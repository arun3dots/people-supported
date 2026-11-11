import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';

export interface IncidentMetricsResult {
  total: number;
  open: number;
  underReview: number;
  closed: number;
  overdue: number;
  closedThisMonth: number;
}

@Injectable()
export class IncidentMetricsService {
  async getMetrics(tenantId?: string): Promise<IncidentMetricsResult> {
    const baseWhere: Record<string, unknown> = { deletedAt: null };
    if (tenantId) {
      baseWhere.tenantId = tenantId;
    }

    const [total, open, underReview, closed] = await Promise.all([
      prisma.incident.count({ where: baseWhere }),
      prisma.incident.count({ where: { ...baseWhere, status: 'Open' } }),
      prisma.incident.count({
        where: { ...baseWhere, status: 'Under Review' },
      }),
      prisma.incident.count({ where: { ...baseWhere, status: 'Closed' } }),
    ]);

    // Overdue: open or under review incidents older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdue = await prisma.incident.count({
      where: {
        ...baseWhere,
        status: { in: ['Open', 'Under Review'] },
        incidentDate: { lt: sevenDaysAgo },
      },
    });

    // Closed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const closedThisMonth = await prisma.incident.count({
      where: {
        ...baseWhere,
        status: 'Closed',
        closedAt: { gte: startOfMonth },
      },
    });

    return {
      total,
      open,
      underReview,
      closed,
      overdue,
      closedThisMonth,
    };
  }
}
