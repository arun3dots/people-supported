import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateCarePlanGoalDTO, UpdateCarePlanGoalDTO } from '@repo/schema';

@Injectable()
export class CarePlanGoalService {
  async createGoal(
    carePlanId: string,
    dto: CreateCarePlanGoalDTO,
    tenantId: string,
  ) {
    let plan = await prisma.carePlan.findFirst({
      where: { id: carePlanId, tenantId },
    });
    if (!plan) {
      plan = await prisma.carePlan.findFirst({
        where: { residentId: carePlanId, tenantId },
        orderBy: [{ status: 'asc' }, { versionNumber: 'desc' }],
      });
    }
    if (!plan) throw new NotFoundException('Care Plan not found');
    if (plan.status === 'Expired' || plan.status === 'Superseded') {
      throw new ConflictException(
        `Cannot add goal to an ${plan.status.toLowerCase()} care plan.`,
      );
    }

    return prisma.carePlanGoal.create({
      data: {
        tenantId,
        branchId: plan.branchId,
        carePlanId: plan.id,
        title: dto.title,
        targetDescription: dto.targetDescription,
        whyItMattersToResident: dto.whyItMattersToResident ?? null,
        category: dto.category || 'Mobility',
        reviewFrequency: dto.reviewFrequency || 'Weekly',
        progressPercent: dto.progressPercent || 0,
        status: dto.status || 'Active',
      },
    });
  }

  async updateGoal(
    goalId: string,
    dto: UpdateCarePlanGoalDTO,
    tenantId: string,
  ) {
    const goal = await prisma.carePlanGoal.findFirst({
      where: { id: goalId, tenantId },
    });
    if (!goal) throw new NotFoundException('Goal not found');

    return prisma.carePlanGoal.update({
      where: { id: goalId },
      data: {
        title: dto.title,
        targetDescription: dto.targetDescription,
        whyItMattersToResident: dto.whyItMattersToResident,
        category: dto.category,
        reviewFrequency: dto.reviewFrequency,
        progressPercent: dto.progressPercent,
        status: dto.status,
        retirementReason: dto.retirementReason,
      },
    });
  }

  async deleteGoal(goalId: string, tenantId: string) {
    const goal = await prisma.carePlanGoal.findFirst({
      where: { id: goalId, tenantId },
      include: { carePlan: true },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    if (
      goal.carePlan.status === 'Expired' ||
      goal.carePlan.status === 'Superseded'
    ) {
      throw new ConflictException(
        `Cannot delete goal from an ${goal.carePlan.status.toLowerCase()} care plan.`,
      );
    }

    return prisma.carePlanGoal.delete({ where: { id: goalId } });
  }
}
