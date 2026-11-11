import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, rawPrisma, RawPrismaTransactionClient } from '@repo/db';
import { CreateCarePlanReviewDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CarePlanReviewService {
  constructor(private readonly auditService: AuditService) {}

  async createReview(
    carePlanId: string,
    tenantId: string,
    userId: string,
    dto: CreateCarePlanReviewDTO,
  ) {
    const plan = await prisma.carePlan.findFirst({
      where: { id: carePlanId, tenantId },
      include: {
        resident: { select: { id: true, fullName: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException('Care Plan not found');
    }

    const now = new Date();
    const nextScheduled = dto.nextScheduledReview
      ? new Date(dto.nextScheduledReview)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days statutory default

    return rawPrisma.$transaction(async (tx: RawPrismaTransactionClient) => {
      const review = await tx.carePlanReview.create({
        data: {
          tenantId,
          branchId: plan.branchId,
          carePlanId,
          residentId: plan.residentId,
          reviewerId: userId,
          reviewedAt: now,
          nextScheduledReview: nextScheduled,
          decision: dto.decision,
          summaryNotes: dto.summaryNotes,
          residentFeedback: dto.residentFeedback ?? null,
          familyFeedback: dto.familyFeedback ?? null,
          domainsEvaluated: dto.domainsEvaluated ?? [],
        },
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              role: { select: { name: true } },
            },
          },
        },
      });

      // Update care plan with latest evaluation timestamp and next scheduled review date
      await tx.carePlan.update({
        where: { id: carePlanId },
        data: {
          lastReviewedAt: now,
          nextReviewDate: nextScheduled,
        },
      });

      const versionPill = `v${String(plan.versionNumber).padStart(4, '0')}`;
      await this.auditService.emitCarePlan({
        tenantId,
        userId,
        entityId: carePlanId,
        residentId: plan.residentId,
        actionType: 'CARE_PLAN_REVIEWED',
        description: `Care Plan ${versionPill} for ${plan.resident?.fullName ?? 'Resident'} reviewed: ${dto.decision}.`,
        newValue: {
          reviewId: review.id,
          decision: dto.decision,
          reviewedAt: now,
          nextScheduledReview: nextScheduled,
        },
      });

      return review;
    });
  }

  async getReviews(carePlanId: string, tenantId: string) {
    const plan = await prisma.carePlan.findFirst({
      where: { id: carePlanId, tenantId },
      select: { id: true },
    });

    if (!plan) {
      throw new NotFoundException('Care Plan not found');
    }

    return prisma.carePlanReview.findMany({
      where: { carePlanId, tenantId },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
    });
  }

  async getResidentReviewHistory(residentId: string, tenantId: string) {
    return prisma.carePlanReview.findMany({
      where: { residentId, tenantId },
      include: {
        carePlan: { select: { id: true, versionNumber: true, status: true } },
        reviewer: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
    });
  }
}
