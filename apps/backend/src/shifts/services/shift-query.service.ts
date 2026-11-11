import { Injectable } from '@nestjs/common';
import { prisma, Prisma } from '@repo/db';
import { resolveShiftTimings, formatTime } from './shift-timing.util';
import { ShiftDetailsService } from './shift-details.service';
import { getUkDayBoundaries } from '../../common/utils/time.util';

@Injectable()
export class ShiftQueryService {
  private readonly detailsService = new ShiftDetailsService();

  async findMyShifts(
    tenantId: string,
    userId: string,
    from?: Date,
    to?: Date,
  ): Promise<unknown[]> {
    if (!tenantId || !userId) {
      return [];
    }

    const ukBoundaries = getUkDayBoundaries();
    const startOfToday = from || ukBoundaries.start;
    const endOfToday = to || ukBoundaries.end;

    const where: Prisma.ShiftWhereInput = {
      tenantId,
      deletedAt: null,
      assignments: {
        some: { userId },
      },
    };

    if (from || to) {
      where.AND = [
        ...(from ? [{ endTime: { gte: from } }] : []),
        ...(to ? [{ startTime: { lte: to } }] : []),
      ];
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        type: true,
        wing: true,
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        staffLogs: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const allAssignedRoomIds = Array.from(
      new Set(
        shifts.flatMap((s) =>
          s.assignments
            .filter((a) => a.userId === userId)
            .flatMap((a) => a.assignedRoomIds || []),
        ),
      ),
    );

    const rooms =
      allAssignedRoomIds.length > 0
        ? await prisma.room.findMany({
            where: { id: { in: allAssignedRoomIds }, deletedAt: null },
            select: { id: true, roomNumber: true },
          })
        : [];
    const roomMap = new Map(rooms.map((r) => [r.id, r.roomNumber]));

    const assignedResidentIds: string[] = [];
    shifts.forEach((s) => {
      s.assignments.forEach((a) => {
        if (a.userId === userId && Array.isArray(a.assignedResidentIds)) {
          assignedResidentIds.push(...a.assignedResidentIds);
        }
      });
    });

    let todayTasksCount = 0;
    let completedTasksCount = 0;

    if (assignedResidentIds.length > 0) {
      const tasks = await prisma.dailyTask.findMany({
        where: {
          resident: { tenantId },
          residentId: { in: assignedResidentIds },
          scheduledDate: { gte: startOfToday, lte: endOfToday },
        },
        select: { id: true, status: true },
      });
      todayTasksCount = tasks.length;
      completedTasksCount = tasks.filter(
        (t) => t.status === 'Completed',
      ).length;
    }

    const now = new Date();
    return shifts.map((shift) => {
      const latestLog = shift.staffLogs?.[0] || null;
      const isPast = shift.endTime.getTime() < now.getTime();
      const isCompleted = isPast && latestLog?.status === 'Completed';
      const isStarted = latestLog?.status === 'Started' && !isPast;
      const timings = resolveShiftTimings(shift.startTime, shift.endTime);

      const tasksCompleted =
        completedTasksCount > 0
          ? completedTasksCount
          : latestLog?.tasksCompleted || 0;
      const tasksTotal =
        todayTasksCount > 0 ? todayTasksCount : latestLog?.tasksTotal || 0;

      const userAssignment = shift.assignments.find((a) => a.userId === userId);
      const userRoomIds = userAssignment?.assignedRoomIds || [];
      const assignedRoomNames = userRoomIds
        .map((rid) => roomMap.get(rid))
        .filter(Boolean);
      const location =
        assignedRoomNames.length > 0
          ? `Room ${assignedRoomNames.join(', ')}`
          : shift.wing?.name || null;

      let actualHoursWorked: number | null = null;
      if (isCompleted || latestLog?.status === 'Completed') {
        const start = latestLog?.actualStartTime
          ? new Date(latestLog.actualStartTime)
          : shift.startTime;
        const end = latestLog?.actualEndTime
          ? new Date(latestLog.actualEndTime)
          : shift.endTime;
        const diffMs = end.getTime() - start.getTime();
        actualHoursWorked = Math.max(
          0,
          Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10,
        );
      }

      const computedStatus =
        shift.status === 'Cancelled'
          ? 'Cancelled'
          : shift.status === 'Absent'
            ? 'Absent'
            : shift.status === 'Draft'
              ? 'Draft'
              : isCompleted
                ? 'Completed'
                : isPast
                  ? latestLog?.status === 'Started'
                    ? 'Ended'
                    : 'Missed'
                  : isStarted
                    ? 'Started'
                    : shift.status || 'Scheduled';

      return {
        ...shift,
        id: shift.id,
        name: shift.type?.name || 'Shift',
        location,
        wardName: location,
        actualHoursWorked,
        startTime: shift.startTime,
        endTime: shift.endTime,
        formattedStartTime: timings.startTime,
        formattedEndTime: timings.endTime,
        rawStartTime: timings.rawStartTime,
        rawEndTime: timings.rawEndTime,
        timingFormatted: `${timings.startTime} - ${timings.endTime}`,
        isStarted,
        isCompleted,
        currentLog: latestLog,
        status: computedStatus,
        shiftStatus: computedStatus,
        tasksCompleted,
        tasksTotal,
      };
    });
  }

  async findActiveOrNextShift(
    tenantId: string,
    userId: string,
  ): Promise<{
    active: unknown;
    next: unknown;
    lastCompleted?: unknown;
  }> {
    if (!tenantId || !userId) {
      return { active: null, next: null };
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const shifts = await prisma.shift.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'Published',
        assignments: { some: { userId, deletedAt: null } },
        OR: [
          {
            startTime: { lte: now },
            endTime: { gte: windowStart },
          },
          { startTime: { gt: now, lte: windowEnd } },
        ],
      },
      include: {
        type: true,
        wing: true,
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        staffLogs: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const validShifts = shifts.filter(
      (shift) => shift.endTime.getTime() > shift.startTime.getTime(),
    );

    const enhanceShift = (shiftItem: (typeof shifts)[0] | null) => {
      if (!shiftItem) return null;
      const latestLog = shiftItem.staffLogs?.[0] || null;
      const isStarted = latestLog?.status === 'Started';
      const isCompleted =
        latestLog?.status === 'Completed' &&
        shiftItem.endTime.getTime() < now.getTime();
      const timings = resolveShiftTimings(
        shiftItem.startTime,
        shiftItem.endTime,
      );

      let timeRemainingStr = '';
      const msDiff = timings.rawEndTime.getTime() - now.getTime();
      if (msDiff > 0) {
        const hrs = Math.floor(msDiff / (1000 * 60 * 60));
        const mins = Math.floor((msDiff % (1000 * 60 * 60)) / (1000 * 60));
        timeRemainingStr = `Ends in ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} hrs`;
      } else {
        timeRemainingStr = 'Shift ended';
      }

      return {
        ...shiftItem,
        id: shiftItem.id,
        name: shiftItem.type?.name || 'Shift',
        wardName: shiftItem.wing?.name || null,
        startTime: shiftItem.startTime,
        endTime: shiftItem.endTime,
        formattedStartTime: timings.startTime,
        formattedEndTime: timings.endTime,
        rawStartTime: timings.rawStartTime,
        rawEndTime: timings.rawEndTime,
        timingFormatted: `${timings.startTime} - ${timings.endTime}`,
        actualStartedTime: latestLog?.actualStartTime
          ? formatTime(new Date(latestLog.actualStartTime))
          : null,
        timeRemainingStr,
        isStarted,
        isCompleted,
        currentLog: latestLog,
        status: latestLog?.status || shiftItem.status || 'Scheduled',
        shiftStatus:
          latestLog?.status ||
          (isStarted ? 'Started' : isCompleted ? 'Completed' : 'Scheduled'),
        tasksCompleted: latestLog?.tasksCompleted || 0,
        tasksTotal: latestLog?.tasksTotal || 0,
      };
    };

    const active =
      validShifts.find((shift) => {
        const latestStatus = shift.staffLogs?.[0]?.status;
        const isStarted =
          latestStatus === 'Started' &&
          now.getTime() - shift.endTime.getTime() < 24 * 60 * 60 * 1000;
        const isOngoing = shift.startTime <= now && shift.endTime >= now;
        const isCompleted = shift.staffLogs?.[0]?.status === 'Completed';
        return (isStarted || isOngoing) && !isCompleted;
      }) || null;

    if (active) {
      return { active: enhanceShift(active), next: null, lastCompleted: null };
    }

    const next =
      validShifts.find((shift) => {
        const isCompleted = shift.staffLogs?.[0]?.status === 'Completed';
        return shift.startTime > now && !isCompleted;
      }) || null;

    const ukDay = getUkDayBoundaries();
    const completedCandidates = await prisma.shift.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'Published',
        assignments: { some: { userId, deletedAt: null } },
        staffLogs: { some: { userId, status: 'Completed' } },
        startTime: { gte: ukDay.start },
        endTime: { lt: now },
      },
      include: {
        type: true,
        wing: true,
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        staffLogs: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });
    const lastCompleted =
      completedCandidates.find(
        (shift) => shift.staffLogs?.[0]?.status === 'Completed',
      ) || null;

    return {
      active: null,
      next: enhanceShift(next),
      lastCompleted: enhanceShift(lastCompleted),
    };
  }

  async getShiftDetails(
    shiftId: string,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    return this.detailsService.getShiftDetails(shiftId, tenantId, userId);
  }
}
