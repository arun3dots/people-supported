import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, rawPrisma, RawPrismaTransactionClient } from '@repo/db';
import { RenewCarePlanDTO, CarePlanDiffResponseDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import {
  generateCarePlanDiff,
  PlanEntityWithGoalsAndTasks,
} from './utils/diff-generator.util';

@Injectable()
export class CarePlanRenewalService {
  constructor(private readonly auditService: AuditService) {}

  async renewCarePlan(
    parentPlanId: string,
    tenantId: string,
    userId: string,
    dto: RenewCarePlanDTO,
  ) {
    const parentPlan = await prisma.carePlan.findFirst({
      where: { id: parentPlanId, tenantId },
      include: {
        goals: true,
        tasks: true,
        resident: { select: { fullName: true } },
      },
    });

    if (!parentPlan) {
      throw new NotFoundException('Parent Care Plan not found');
    }

    if (new Date(dto.validTo) <= new Date(dto.validFrom)) {
      throw new BadRequestException(
        'Validity End Date must be strictly after Start Date.',
      );
    }

    // Determine sequential version number for this resident
    const latestPlanForResident = await prisma.carePlan.findFirst({
      where: { residentId: parentPlan.residentId, tenantId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextVersion =
      (latestPlanForResident?.versionNumber ?? parentPlan.versionNumber) + 1;

    return rawPrisma.$transaction(async (tx: RawPrismaTransactionClient) => {
      const newPlan = await tx.carePlan.create({
        data: {
          tenantId,
          branchId: parentPlan.branchId,
          residentId: parentPlan.residentId,
          versionNumber: nextVersion,
          status: 'Draft',
          parentVersionId: parentPlanId,
          renewalReason: dto.renewalReason,
          validFrom: new Date(dto.validFrom),
          validTo: new Date(dto.validTo),
          nextReviewDate: new Date(dto.validTo),
          description: dto.description || parentPlan.description,
          authorId: userId,
          primaryDoctorId: dto.primaryDoctorId,
          secondaryDoctorId: dto.secondaryDoctorId ?? null,
          departments: dto.departments ?? parentPlan.departments,
          doctorsInvolved: parentPlan.doctorsInvolved,
        },
      });

      // Clone Goals
      const goalOriginToNewMap = new Map<string, string>();
      for (const goalInput of dto.goals) {
        const isRetired =
          goalInput.diffTag === 'Retired' ||
          goalInput.status === 'Retired' ||
          goalInput.status === 'retired';
        const createdGoal = await tx.carePlanGoal.create({
          data: {
            tenantId,
            branchId: newPlan.branchId,
            carePlanId: newPlan.id,
            originGoalId: goalInput.originGoalId || null,
            title: goalInput.title,
            targetDescription: goalInput.targetDescription,
            category: goalInput.category || 'Mobility',
            reviewFrequency: goalInput.reviewFrequency || 'Weekly',
            progressPercent: isRetired ? 100 : goalInput.progressPercent || 0,
            status: isRetired ? 'Retired' : 'Active',
            retirementReason: isRetired
              ? goalInput.retirementReason || 'Retired during renewal'
              : null,
            nextReviewDate: goalInput.nextReviewDate
              ? new Date(goalInput.nextReviewDate)
              : null,
          },
        });
        if (goalInput.originGoalId) {
          goalOriginToNewMap.set(goalInput.originGoalId, createdGoal.id);
        }
      }

      // Clone Tasks
      for (const taskInput of dto.tasks) {
        if (taskInput.diffTag === 'Removed') continue;

        let mappedGoalId: string | null = null;
        if (taskInput.goalId) {
          mappedGoalId = goalOriginToNewMap.get(taskInput.goalId) || null;
        }

        await tx.carePlanTask.create({
          data: {
            tenantId,
            branchId: newPlan.branchId,
            residentId: parentPlan.residentId,
            carePlanId: newPlan.id,
            originTaskId: taskInput.originTaskId || null,
            goalId: mappedGoalId,
            title: taskInput.title,
            description: taskInput.description,
            instructions: taskInput.instructions,
            precautions: taskInput.precautions || null,
            category: taskInput.category,
            frequency: taskInput.frequency || 'Daily',
            timeOfDay: taskInput.timeOfDay || ['Morning'],
            priority: taskInput.priority || 'Medium',
            assignedGroupId: taskInput.assignedGroupId,
            assignedStaffId: taskInput.assignedStaffId,
            requirePhotoOrNote: taskInput.requirePhotoOrNote ?? false,
            escalateIfSkipped: taskInput.escalateIfSkipped ?? false,
            status: 'Active',
            isActive: true,
          },
        });
      }

      const versionPill = `v${String(nextVersion).padStart(4, '0')}`;
      const parentPill = `v${String(parentPlan.versionNumber).padStart(4, '0')}`;

      await this.auditService.emitCarePlan({
        tenantId,
        userId,
        entityId: newPlan.id,
        residentId: parentPlan.residentId,
        actionType: 'CREATED',
        description: `Draft renewal plan ${versionPill} created from ${parentPill}. Reason: ${dto.renewalReason}`,
        newValue: {
          version: nextVersion,
          parentVersionId: parentPlanId,
          renewalReason: dto.renewalReason,
        },
      });

      return newPlan;
    });
  }

  async computePlanDiff(
    planId: string,
    otherPlanId: string | undefined,
    tenantId: string,
  ): Promise<CarePlanDiffResponseDTO> {
    const targetPlan = await prisma.carePlan.findFirst({
      where: { id: planId, tenantId },
      include: {
        goals: true,
        tasks: true,
      },
    });

    if (!targetPlan) {
      throw new NotFoundException('Target Care Plan not found');
    }

    const sourcePlanId = otherPlanId || targetPlan.parentVersionId;
    if (!sourcePlanId) {
      throw new BadRequestException(
        'No previous version exists to compare against',
      );
    }

    const sourcePlan = await prisma.carePlan.findFirst({
      where: { id: sourcePlanId, tenantId },
      include: {
        goals: true,
        tasks: true,
      },
    });

    if (!sourcePlan) {
      throw new NotFoundException('Source Care Plan not found');
    }

    const sourceEntity: PlanEntityWithGoalsAndTasks = {
      id: sourcePlan.id,
      versionNumber: sourcePlan.versionNumber,
      validFrom: sourcePlan.validFrom,
      validTo: sourcePlan.validTo,
      description: sourcePlan.description,
      primaryDoctorId: sourcePlan.primaryDoctorId,
      secondaryDoctorId: sourcePlan.secondaryDoctorId,
      departments: sourcePlan.departments,
      goals: sourcePlan.goals,
      tasks: sourcePlan.tasks,
    };

    const targetEntity: PlanEntityWithGoalsAndTasks = {
      id: targetPlan.id,
      versionNumber: targetPlan.versionNumber,
      validFrom: targetPlan.validFrom,
      validTo: targetPlan.validTo,
      description: targetPlan.description,
      primaryDoctorId: targetPlan.primaryDoctorId,
      secondaryDoctorId: targetPlan.secondaryDoctorId,
      departments: targetPlan.departments,
      goals: targetPlan.goals,
      tasks: targetPlan.tasks,
    };

    return generateCarePlanDiff(sourceEntity, targetEntity);
  }
}
