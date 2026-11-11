import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, rawPrisma, RawPrismaTransactionClient } from '@repo/db';
import { DecideCarePlanApprovalDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { CarePlanTaskGeneratorService } from './care-plan-task-generator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { sendCarePlanAlert } from './utils/care-plan-notifications.util';

@Injectable()
export class CarePlanApprovalService {
  constructor(
    private readonly auditService: AuditService,
    private readonly taskGeneratorService: CarePlanTaskGeneratorService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submitForApproval(
    carePlanId: string,
    tenantId: string,
    userId: string,
  ) {
    const plan = await prisma.carePlan.findFirst({
      where: { id: carePlanId, tenantId },
      include: {
        goals: { where: { status: 'Active' } },
        tasks: { where: { isActive: true } },
        resident: { select: { fullName: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException('Care Plan not found');
    }

    if (
      plan.status !== 'Draft' &&
      plan.status !== 'ChangesRequested' &&
      plan.status !== 'draft' &&
      plan.status !== 'changes_requested'
    ) {
      throw new ConflictException(
        `Cannot submit care plan in status '${plan.status}'. Only Draft or ChangesRequested plans can be submitted.`,
      );
    }

    const hasApprover =
      plan.managerApproverId ||
      plan.clinicalApproverId ||
      plan.primaryDoctorId ||
      (plan.doctorsInvolved && plan.doctorsInvolved.length > 0) ||
      plan.authorId;
    if (!hasApprover) {
      throw new BadRequestException(
        'A Registered Manager, Clinical Lead, or Approver must be assigned before submission.',
      );
    }
    if (plan.goals.length === 0) {
      throw new BadRequestException(
        'Care Plan must contain at least one active goal.',
      );
    }
    if (plan.tasks.length === 0) {
      throw new BadRequestException(
        'Care Plan must contain at least one daily task.',
      );
    }
    if (plan.validTo && plan.validFrom && plan.validTo <= plan.validFrom) {
      throw new BadRequestException(
        'Validity End Date must be strictly after Start Date.',
      );
    }

    const versionPill = `v${String(plan.versionNumber).padStart(4, '0')}`;
    const primaryApproverId =
      plan.managerApproverId ||
      plan.clinicalApproverId ||
      plan.primaryDoctorId ||
      plan.authorId ||
      userId;

    const result = await rawPrisma.$transaction(
      async (tx: RawPrismaTransactionClient) => {
        // Clear previous pending/stale approvals
        await tx.carePlanApproval.deleteMany({
          where: { carePlanId, tenantId },
        });

        await tx.carePlanApproval.create({
          data: {
            carePlanId,
            tenantId,
            branchId: plan.branchId,
            approverId: primaryApproverId,
            role: 'Primary',
            decision: 'Pending',
          },
        });

        // Secondary approver: Clinical Lead (if manager is primary) OR secondaryDoctorId
        const secondaryApproverId =
          plan.managerApproverId &&
          plan.clinicalApproverId &&
          plan.clinicalApproverId !== primaryApproverId
            ? plan.clinicalApproverId
            : plan.secondaryDoctorId;

        if (secondaryApproverId) {
          await tx.carePlanApproval.create({
            data: {
              carePlanId,
              tenantId,
              branchId: plan.branchId,
              approverId: secondaryApproverId,
              role: 'Secondary',
              decision: 'Pending',
            },
          });
        }

        const updatedPlan = await tx.carePlan.update({
          where: { id: carePlanId },
          data: {
            status: 'PendingPrimaryApproval',
            submittedAt: new Date(),
          },
        });

        await this.auditService.emitCarePlan({
          tenantId,
          userId,
          entityId: carePlanId,
          residentId: plan.residentId,
          actionType: 'SUBMITTED',
          description: `Plan ${versionPill} for ${plan.resident?.fullName ?? 'Resident'} submitted for sign-off.`,
          newValue: {
            status: 'PendingPrimaryApproval',
            version: plan.versionNumber,
          },
        });

        await tx.careTimeline.create({
          data: {
            residentId: plan.residentId,
            eventType: 'CARE_PLAN_SUBMITTED',
            summary: `Care Plan ${versionPill} submitted for sign-off.`,
            carerId: userId,
            createdById: userId,
            updatedById: userId,
          },
        });

        return updatedPlan;
      },
    );

    if (primaryApproverId) {
      await sendCarePlanAlert(this.notificationsService, {
        tenantId,
        recipientId: primaryApproverId,
        title: 'Care Plan Awaiting Sign-off',
        message: `Plan ${versionPill} for ${plan.resident?.fullName ?? 'Resident'} submitted for your approval.`,
        priority: 'High',
        actionUrl: `/admin/care-plans/${carePlanId}`,
      });
    }

    return result;
  }

  async recordApprovalDecision(
    carePlanId: string,
    approvalId: string,
    tenantId: string,
    userId: string,
    dto: DecideCarePlanApprovalDTO,
  ) {
    const plan = await prisma.carePlan.findFirst({
      where: { id: carePlanId, tenantId },
      include: {
        approvals: true,
        resident: { select: { fullName: true } },
      },
    });

    if (!plan) throw new NotFoundException('Care Plan not found');

    const approval = plan.approvals.find((a) => a.id === approvalId);
    if (!approval)
      throw new NotFoundException(
        'Approval record not found for this care plan',
      );

    // CQC Reg 17 Governance: Verify caller is designated approver or manager/admin
    if (approval.approverId !== userId) {
      const caller = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      const roleName = caller?.role?.name;
      if (roleName !== 'Admin' && roleName !== 'Manager') {
        throw new ForbiddenException(
          'Only the designated approver or a Registered Manager may decide this approval.',
        );
      }
    }

    if (dto.decision === 'Rejected' || dto.decision === 'ChangesRequested') {
      if (!dto.comments || dto.comments.trim().length === 0) {
        throw new BadRequestException(
          `Comments are required when decision is ${dto.decision}.`,
        );
      }
    }

    const versionPill = `v${String(plan.versionNumber).padStart(4, '0')}`;

    const result = await rawPrisma.$transaction(
      async (tx: RawPrismaTransactionClient) => {
        await tx.carePlanApproval.update({
          where: { id: approvalId },
          data: {
            decision: dto.decision,
            comments: dto.comments ?? null,
            decidedAt: new Date(),
          },
        });

        if (dto.decision === 'Rejected') {
          const rejectedPlan = await tx.carePlan.update({
            where: { id: carePlanId },
            data: { status: 'Rejected' },
          });
          await this.auditService.emitCarePlan({
            tenantId,
            userId,
            entityId: carePlanId,
            residentId: plan.residentId,
            actionType: 'REJECTED',
            description: `Plan ${versionPill} rejected by ${approval.role} approver: "${dto.comments}"`,
            newValue: { status: 'Rejected', reason: dto.comments },
          });
          await tx.careTimeline.create({
            data: {
              residentId: plan.residentId,
              eventType: 'CARE_PLAN_REJECTED',
              summary: `Care Plan ${versionPill} rejected: "${dto.comments}"`,
              carerId: userId,
              createdById: userId,
              updatedById: userId,
            },
          });
          return rejectedPlan;
        }

        if (dto.decision === 'ChangesRequested') {
          const revisedPlan = await tx.carePlan.update({
            where: { id: carePlanId },
            data: { status: 'ChangesRequested' },
          });
          await this.auditService.emitCarePlan({
            tenantId,
            userId,
            entityId: carePlanId,
            residentId: plan.residentId,
            actionType: 'CHANGES_REQUESTED',
            description: `Changes requested on ${versionPill} by ${approval.role} approver: "${dto.comments}"`,
            newValue: { status: 'ChangesRequested', comments: dto.comments },
          });
          await tx.careTimeline.create({
            data: {
              residentId: plan.residentId,
              eventType: 'CARE_PLAN_CHANGES_REQUESTED',
              summary: `Care Plan ${versionPill} changes requested: "${dto.comments}"`,
              carerId: userId,
              createdById: userId,
              updatedById: userId,
            },
          });
          return revisedPlan;
        }

        // If Approved: Check if secondary sign-off is needed
        const secondaryApproval = plan.approvals.find(
          (a) => a.role === 'Secondary',
        );
        if (
          approval.role === 'Primary' &&
          secondaryApproval &&
          secondaryApproval.decision !== 'Approved'
        ) {
          const updated = await tx.carePlan.update({
            where: { id: carePlanId },
            data: {
              status: 'PendingSecondaryApproval',
              approvedById: userId,
              approvedAt: new Date(),
            },
          });
          await this.auditService.emitCarePlan({
            tenantId,
            userId,
            entityId: carePlanId,
            residentId: plan.residentId,
            actionType: 'APPROVED',
            description: `Plan ${versionPill} approved by Primary Approver. Awaiting Secondary approval.`,
            newValue: { status: 'PendingSecondaryApproval' },
          });
          await tx.careTimeline.create({
            data: {
              residentId: plan.residentId,
              eventType: 'CARE_PLAN_APPROVED',
              summary: `Care Plan ${versionPill} approved by Primary Approver.`,
              carerId: userId,
              createdById: userId,
              updatedById: userId,
            },
          });
          return updated;
        }

        // Fully Approved -> Supersede existing active plans and activate
        const existingActivePlans = await tx.carePlan.findMany({
          where: {
            residentId: plan.residentId,
            tenantId,
            status: 'Active',
            id: { not: carePlanId },
          },
        });

        const now = new Date();
        for (const oldPlan of existingActivePlans) {
          const oldPill = `v${String(oldPlan.versionNumber).padStart(4, '0')}`;
          await tx.carePlan.update({
            where: { id: oldPlan.id },
            data: { status: 'Superseded', supersededAt: now },
          });
          await this.auditService.emitCarePlan({
            tenantId,
            userId,
            entityId: oldPlan.id,
            residentId: plan.residentId,
            actionType: 'SUPERSEDED',
            description: `Plan ${oldPill} superseded by ${versionPill}.`,
            newValue: { status: 'Superseded', supersededBy: carePlanId },
          });
        }

        const activatedPlan = await tx.carePlan.update({
          where: { id: carePlanId },
          data: {
            status: 'Active',
            activatedAt: now,
            ...(approval.role === 'Primary'
              ? { approvedById: userId, approvedAt: now }
              : { secondaryApprovedById: userId, secondaryApprovedAt: now }),
          },
        });

        await this.taskGeneratorService.generateTasksForResident(
          plan.residentId,
          now,
          tx,
        );
        await this.auditService.emitCarePlan({
          tenantId,
          userId,
          entityId: carePlanId,
          residentId: plan.residentId,
          actionType: 'ACTIVATED',
          description: `Plan ${versionPill} activated and in effect.`,
          newValue: { status: 'Active', activatedAt: now },
        });

        await tx.careTimeline.create({
          data: {
            residentId: plan.residentId,
            eventType: 'CARE_PLAN_ACTIVATED',
            summary: `Care Plan ${versionPill} fully approved and activated.`,
            carerId: userId,
            createdById: userId,
            updatedById: userId,
          },
        });

        return activatedPlan;
      },
    );

    // Workflow Notifications
    if (
      plan.authorId &&
      (dto.decision === 'Rejected' || dto.decision === 'ChangesRequested')
    ) {
      const isRejected = dto.decision === 'Rejected';
      await sendCarePlanAlert(this.notificationsService, {
        tenantId,
        recipientId: plan.authorId,
        title: isRejected
          ? 'Care Plan Rejected'
          : 'Care Plan Changes Requested',
        message: `${isRejected ? 'Plan rejected' : 'Changes requested'} on ${versionPill}: "${dto.comments}"`,
        priority: 'High',
        actionUrl: `/admin/care-plans/${carePlanId}`,
      });
    } else if (result.status === 'PendingSecondaryApproval') {
      const secondaryApproval = plan.approvals.find(
        (a) => a.role === 'Secondary',
      );
      if (secondaryApproval?.approverId) {
        await sendCarePlanAlert(this.notificationsService, {
          tenantId,
          recipientId: secondaryApproval.approverId,
          title: 'Care Plan Secondary Sign-off Required',
          message: `Plan ${versionPill} for ${plan.resident?.fullName ?? 'Resident'} approved by Primary Approver. Your sign-off is required.`,
          priority: 'High',
          actionUrl: `/admin/care-plans/${carePlanId}`,
        });
      }
    } else if (result.status === 'Active' && plan.authorId) {
      await sendCarePlanAlert(this.notificationsService, {
        tenantId,
        recipientId: plan.authorId,
        title: 'Care Plan Approved & Activated',
        message: `Plan ${versionPill} for ${plan.resident?.fullName ?? 'Resident'} is now fully approved and Active.`,
        priority: 'Medium',
        actionUrl: `/admin/care-plans/${carePlanId}`,
      });
    }

    return result;
  }
}
