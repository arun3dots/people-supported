import { Injectable } from '@nestjs/common';
import { prisma, RiskAssessment } from '@repo/db';
import type { RiskOverviewStats } from './risk.types';

/**
 * Read-only aggregate queries for the risk module.
 *
 * Split out of RiskService to keep file sizes within the 350-line cap and to
 * isolate reporting logic from CRUD/transition logic.
 */
@Injectable()
export class RiskReportsService {
  /**
   * Returns assessments with `status = Active` whose `nextReviewDate` is
   * within `days` of now (across ALL tenants — caller filters by tenant
   * if needed). Used by `RiskReminderService`.
   */
  async findReviewsDueWithin(
    days: number,
  ): Promise<(RiskAssessment & { tenantId: string })[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return prisma.riskAssessment.findMany({
      where: {
        deletedAt: null,
        status: 'Active',
        nextReviewDate: { lte: cutoff },
      },
    });
  }

  /**
   * Tenant-scoped dashboard summary — counts by level, by category,
   * pending-review queue length, and reviews due in the next 7 days.
   * When `branchId` is given the summary is narrowed to that branch.
   */
  async getOverview(
    tenantId: string,
    branchId?: string,
  ): Promise<RiskOverviewStats> {
    const assessments = await prisma.riskAssessment.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { not: 'Archived' },
        ...(branchId ? { branchId } : {}),
      },
      select: {
        status: true,
        category: true,
        inherentLevel: true,
        residualLevel: true,
        nextReviewDate: true,
      },
    });

    const total = assessments.length;
    const levelCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    let pendingReview = 0;
    let reviewsDueIn7Days = 0;
    let highRiskActive = 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 7);

    for (const a of assessments) {
      const lvl = a.residualLevel ?? a.inherentLevel;
      levelCounts.set(lvl, (levelCounts.get(lvl) ?? 0) + 1);
      categoryCounts.set(a.category, (categoryCounts.get(a.category) ?? 0) + 1);
      if (a.status === 'PendingReview') pendingReview += 1;
      if (a.status === 'Active' && a.nextReviewDate <= cutoff) {
        reviewsDueIn7Days += 1;
      }
      if (a.status === 'Active' && (lvl === 'High' || lvl === 'Extreme')) {
        highRiskActive += 1;
      }
    }

    return {
      total,
      byLevel: Array.from(levelCounts, ([level, count]) => ({ level, count })),
      byCategory: Array.from(categoryCounts, ([category, count]) => ({
        category,
        count,
      })),
      pendingReview,
      reviewsDueIn7Days,
      highRiskActive,
    };
  }
}
