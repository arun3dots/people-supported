import { Injectable } from '@nestjs/common';
import { prisma, Prisma } from '@repo/db';
import { ShiftDetailsService } from './shift-details.service';
import { getUkDayBoundaries } from '../../common/utils/time.util';
import {
  CONTINUOUS_SHIFT_MAX_GAP_MS,
  findContinuousFollowUpShiftInList,
  hasContinuousFollowingShiftForUser,
} from './shift-continuity.util';
import { buildActiveShiftItem, buildMyShiftItem } from './shift-query.mapper';

const buildShiftInclude = (userId: string) => ({
  type: true,
  wing: true,
  assignments: {
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  },
  staffLogs: {
    where: { userId },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
});

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
      include: buildShiftInclude(userId),
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
    const results: unknown[] = [];

    for (const shift of shifts) {
      const latestLog = shift.staffLogs?.[0] || null;
      const isPast = shift.endTime.getTime() < now.getTime();
      const hasStartedLog =
        latestLog?.status !== 'Completed' && latestLog?.status === 'Started';

      let hasContinuousNextShift =
        findContinuousFollowUpShiftInList(shift, shifts) !== null;
      if (
        !hasContinuousNextShift &&
        hasStartedLog &&
        isPast &&
        to &&
        shift.endTime.getTime() + CONTINUOUS_SHIFT_MAX_GAP_MS > to.getTime()
      ) {
        hasContinuousNextShift = await hasContinuousFollowingShiftForUser(
          tenantId,
          userId,
          shift,
        );
      }

      results.push(
        buildMyShiftItem(shift, {
          now,
          userId,
          hasContinuousNextShift,
          roomMap,
          completedTasksCount,
          todayTasksCount,
        }),
      );
    }

    return results;
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
          {
            staffLogs: {
              some: { userId, status: 'Started', actualEndTime: null },
            },
          },
          { startTime: { gt: now, lte: windowEnd } },
        ],
      },
      include: buildShiftInclude(userId),
      orderBy: { startTime: 'asc' },
    });

    const validShifts = shifts.filter(
      (shift) => shift.endTime.getTime() > shift.startTime.getTime(),
    );

    const resolveHasContinuousNext = async (
      shiftItem: (typeof shifts)[0],
    ): Promise<boolean> => {
      if (findContinuousFollowUpShiftInList(shiftItem, validShifts) !== null) {
        return true;
      }
      // If a stale Started log ended >48h ago or outside the fetch window, double check DB.
      if (shiftItem.endTime.getTime() < now.getTime()) {
        return hasContinuousFollowingShiftForUser(tenantId, userId, shiftItem);
      }
      return false;
    };

    let active: (typeof shifts)[0] | null = null;
    let activeHasContinuousNext = false;

    for (const shift of validShifts) {
      const latestStatus = shift.staffLogs?.[0]?.status;
      const isCompleted = latestStatus === 'Completed';
      if (isCompleted) continue;

      const hasStartedLog = latestStatus === 'Started';
      const isPast = shift.endTime.getTime() < now.getTime();
      const isOngoing = shift.startTime <= now && shift.endTime >= now;

      if (hasStartedLog) {
        const hasContinuous = await resolveHasContinuousNext(shift);
        if (!isPast || !hasContinuous) {
          active = shift;
          activeHasContinuousNext = hasContinuous;
          break;
        }
        continue;
      }

      if (isOngoing) {
        active = shift;
        activeHasContinuousNext =
          findContinuousFollowUpShiftInList(shift, validShifts) !== null;
        break;
      }
    }

    if (active) {
      const upcomingAfterActive =
        validShifts.find(
          (shift) =>
            shift.id !== active.id &&
            shift.startTime >= active.endTime &&
            shift.staffLogs?.[0]?.status !== 'Completed',
        ) || null;
      return {
        active: buildActiveShiftItem(active, now, activeHasContinuousNext),
        next: upcomingAfterActive
          ? buildActiveShiftItem(upcomingAfterActive, now)
          : null,
        lastCompleted: null,
      };
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
      include: buildShiftInclude(userId),
      orderBy: { startTime: 'desc' },
      take: 10,
    });
    const lastCompleted =
      completedCandidates.find(
        (shift) => shift.staffLogs?.[0]?.status === 'Completed',
      ) || null;

    return {
      active: null,
      next: buildActiveShiftItem(next, now),
      lastCompleted: buildActiveShiftItem(lastCompleted, now),
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
