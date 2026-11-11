import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  ResidentMetricsDTO,
  ResidentInsightsDTO,
  calculateAge,
} from '@repo/schema';
import { safeDecryptStr } from '../../common/utils/crypto.util';

@Injectable()
export class ResidentAnalyticsService {
  async getMetrics(tenantId: string): Promise<ResidentMetricsDTO> {
    const residents = await prisma.resident.findMany({
      where: { tenantId, deletedAt: null },
      select: { dob: true, status: true, admissionDate: true, updatedAt: true },
    });

    const activeResidents = residents.filter((r) => r.status === 'Active');
    const total = activeResidents.length;
    const active = total;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newAdmissions = residents.filter(
      (r) => r.admissionDate && new Date(r.admissionDate) >= startOfMonth,
    ).length;

    const discharges = residents.filter(
      (r) => r.status === 'Discharged',
    ).length;

    const totalAge = activeResidents.reduce(
      (sum, r) => sum + (calculateAge(safeDecryptStr(r.dob)) ?? 78),
      0,
    );
    const avgAge = total > 0 ? Number((totalAge / total).toFixed(1)) : 0;

    const branchCount = await prisma.branch.count({
      where: { tenantId, deletedAt: null },
    });

    return {
      total,
      active,
      newAdmissions,
      discharges,
      avgAge,
      branchCount: branchCount || 1,
    };
  }

  async getInsights(tenantId: string): Promise<ResidentInsightsDTO> {
    const activeResidents = await prisma.resident.findMany({
      where: { tenantId, status: 'Active', deletedAt: null },
      select: {
        fundingType: true,
        careProfile: { select: { allergies: true } },
      },
    });

    const careTypeCounts: Record<string, number> = {};
    activeResidents.forEach((r) => {
      const type = r.fundingType || 'General';
      careTypeCounts[type] = (careTypeCounts[type] || 0) + 1;
    });

    const careTypeBreakdown = Object.entries(careTypeCounts).map(
      ([type, count]) => ({
        type,
        count,
      }),
    );

    const residentsWithAlerts = activeResidents.filter(
      (r) => r.careProfile?.allergies && r.careProfile.allergies.length > 0,
    ).length;

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const reviewsDue = await prisma.carePlan.count({
      where: {
        tenantId,
        status: 'Active',
        nextReviewDate: { lte: nextMonth },
      },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDocumentsCount = await prisma.document.count({
      where: {
        tenantId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    return {
      reviewsDue,
      residentsWithAlerts,
      recentDocumentsCount,
      careTypeBreakdown,
    };
  }
}
