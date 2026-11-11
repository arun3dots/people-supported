import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { DashboardSummaryDTO } from '@repo/schema';
import { getUkDayBoundaries } from '../common/utils/time.util';

@Injectable()
export class DashboardService {
  async getDashboardSummary(tenantId: string): Promise<DashboardSummaryDTO> {
    const now = new Date();
    const { start: todayStart, end: todayEnd } = getUkDayBoundaries(now);

    // 1. Total residents (matching Resident Directory) & active residents
    const totalResidents = await prisma.resident.count({
      where: { tenantId, status: 'Active', deletedAt: null },
    });
    const activeResidents = await prisma.resident.count({
      where: { tenantId, status: 'Active', deletedAt: null },
    });

    // 2. Active staff & staff on duty today (accounting for approved leave)
    const activeLeaveRequests = await prisma.shiftRequest.findMany({
      where: {
        tenantId,
        type: 'Leave',
        status: 'Approved',
        startTime: { lte: todayEnd },
        endTime: { gte: todayStart },
      },
      select: { userId: true },
    });
    const onLeaveUserIds = new Set(activeLeaveRequests.map((r) => r.userId));
    const staffOnLeave = onLeaveUserIds.size;

    const totalActiveUsers = await prisma.user.count({
      where: { tenantId, isActive: true, deletedAt: null },
    });
    const activeStaff = Math.max(0, totalActiveUsers - staffOnLeave);

    const staffOnDutyCount = await prisma.shiftAssignment.count({
      where: {
        shift: {
          tenantId,
          startTime: { lte: todayEnd },
          endTime: { gte: todayStart },
          deletedAt: null,
        },
        user: {
          isActive: true,
          deletedAt: null,
          id: { notIn: Array.from(onLeaveUserIds) },
        },
        deletedAt: null,
      },
    });
    const staffOnDuty = staffOnDutyCount;

    // 3. Occupancy rate & Beds
    const totalBeds = await prisma.bed.count({
      where: {
        room: { wing: { tenantId } },
        deletedAt: null,
      },
    });

    const occupiedBeds = await prisma.bed.count({
      where: {
        room: { wing: { tenantId } },
        status: 'Occupied',
        deletedAt: null,
      },
    });

    const occupancyRate =
      totalBeds > 0
        ? Math.min(100, Math.round((occupiedBeds / totalBeds) * 100 * 10) / 10)
        : 0;

    // 4. Daily tasks & Open Incidents
    const pendingTasks = await prisma.dailyTask.count({
      where: {
        resident: { tenantId, deletedAt: null },
        status: 'Pending',
      },
    });

    const openIncidents = await prisma.incident.count({
      where: {
        tenantId,
        status: { in: ['Open', 'Under Review'] },
        deletedAt: null,
      },
    });

    // 5. Financial statistics (Invoices & Revenue)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allInvoices, monthlyInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where: { tenantId, deletedAt: null },
        select: { amount: true, status: true },
      }),
      prisma.invoice.findMany({
        where: {
          tenantId,
          issuedDate: { gte: currentMonthStart },
          deletedAt: null,
        },
        select: { amount: true, status: true },
      }),
    ]);

    const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const monthlyRevenue = monthlyInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0,
    );
    const totalOutstanding = allInvoices
      .filter((inv) => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    // 6. Critical residents
    const criticalResidents = await prisma.resident.findMany({
      where: { tenantId, status: 'Active', deletedAt: null },
      take: 5,
      select: {
        id: true,
        fullName: true,
        photoUrl: true,
      },
    });

    // 7. Recent alerts from database
    const dbIncidents = await prisma.incident.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        severity: true,
        createdAt: true,
      },
    });

    const alerts = dbIncidents.map((inc) => ({
      id: inc.id,
      title: inc.title,
      description: `Incident logged (${inc.severity || 'Medium'} priority)`,
      severity: (inc.severity?.toLowerCase() === 'high'
        ? 'high'
        : inc.severity?.toLowerCase() === 'low'
          ? 'low'
          : 'medium') as 'low' | 'medium' | 'high' | 'critical',
      timestamp: inc.createdAt.toISOString(),
    }));

    // 8. Recent activity from database
    const dbObservations = await prisma.observation.findMany({
      where: { resident: { tenantId }, deletedAt: null },
      orderBy: { timestamp: 'desc' },
      take: 3,
      include: {
        resident: { select: { fullName: true } },
      },
    });

    const recentActivity = dbObservations.map((obs) => ({
      id: obs.id,
      type: 'observation',
      title: `Vitals Recorded - ${obs.resident?.fullName || 'Resident'}`,
      description:
        obs.news2Score !== null
          ? `NEWS2 Score: ${obs.news2Score}`
          : 'Observation logged',
      timestamp: obs.timestamp.toISOString(),
    }));

    return {
      totalResidents,
      activeResidents,
      occupancyRate,
      occupiedBeds,
      activeStaff,
      staffOnDuty,
      staffOnLeave,
      totalBeds,
      pendingTasks,
      openIncidents,
      totalRevenue,
      monthlyRevenue,
      totalOutstanding,
      criticalResidents,
      alerts,
      recentActivity,
    };
  }

  async getAdminStats(tenantId: string): Promise<DashboardSummaryDTO> {
    return this.getDashboardSummary(tenantId);
  }

  async getMyTasks(carerId: string, tenantId: string) {
    const { start: todayStart, end: todayEnd } = getUkDayBoundaries();

    // 1. Direct explicit assignment (StaffResidents or Keyworker)
    const directResidents = await prisma.resident.findMany({
      where: {
        tenantId,
        status: 'Active',
        deletedAt: null,
        OR: [{ staff: { some: { id: carerId } } }, { keyworkerId: carerId }],
      },
      select: { id: true },
    });

    // 2. Active shift assignments for this carer on today's date
    const activeShifts = await prisma.shiftAssignment.findMany({
      where: {
        userId: carerId,
        shift: {
          tenantId,
          startTime: { lte: todayEnd },
          endTime: { gte: todayStart },
        },
      },
      include: {
        shift: { select: { wingId: true, branchId: true } },
      },
    });

    const shiftResidentIds = activeShifts.flatMap(
      (s) => s.assignedResidentIds || [],
    );
    const roomIds = activeShifts.flatMap((s) => s.assignedRoomIds || []);
    const wingIds = activeShifts
      .map((s) => s.shift?.wingId)
      .filter(Boolean) as string[];
    const branchIds = activeShifts
      .map((s) => s.shift?.branchId)
      .filter(Boolean);

    // 3. Get residents in those assigned rooms, wings, or branches.
    // Resident.branchId is a direct column, so this needs no join.
    const residentsInScope = await prisma.resident.findMany({
      where: {
        tenantId,
        status: 'Active',
        deletedAt: null,
        OR: [
          ...(roomIds.length > 0 ? [{ bed: { roomId: { in: roomIds } } }] : []),
          ...(wingIds.length > 0
            ? [{ bed: { room: { wingId: { in: wingIds } } } }]
            : []),
          ...(branchIds.length > 0 ? [{ branchId: { in: branchIds } }] : []),
        ],
      },
      select: { id: true },
    });

    // Combine all resident IDs
    const residentIds = Array.from(
      new Set([
        ...directResidents.map((r) => r.id),
        ...shiftResidentIds,
        ...residentsInScope.map((r) => r.id),
      ]),
    );

    // 4. Fetch Daily Tasks (for assigned residents or directly assigned to carer)
    const dailyTasks = await prisma.dailyTask.findMany({
      where: {
        scheduledDate: { gte: todayStart, lte: todayEnd },
        resident: { tenantId, deletedAt: null },
        OR: [
          ...(residentIds.length > 0
            ? [{ residentId: { in: residentIds } }]
            : []),
          { assignedStaffId: carerId },
        ],
      },
      include: {
        resident: { select: { fullName: true, id: true, photoUrl: true } },
        carePlanTask: {
          select: {
            category: true,
            priority: true,
            instructions: true,
            precautions: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { scheduledDate: 'asc' }],
    });

    // 5. Fetch Medication Rounds
    const medicationRounds = await prisma.medicationRound.findMany({
      where: {
        scheduledTime: { gte: todayStart, lte: todayEnd },
        resident: { tenantId, deletedAt: null },
        ...(residentIds.length > 0 ? { residentId: { in: residentIds } } : {}),
      },
      include: {
        resident: { select: { fullName: true, id: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return {
      dailyTasks,
      medicationRounds,
    };
  }
}
