import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { resolveShiftTimings } from './shift-timing.util';
import { getUkDayBoundaries } from '../../common/utils/time.util';
import { loadPreviousShiftHandovers } from './shift-handover.util';
import {
  formatShiftTimeRemaining,
  hasContinuousFollowingShiftForUser,
} from './shift-continuity.util';

@Injectable()
export class ShiftDetailsService {
  async getShiftDetails(
    shiftId: string,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    if (!tenantId || !userId) {
      throw new NotFoundException('Authentication context required');
    }

    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        tenantId,
        deletedAt: null,
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
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const now = new Date();
    const timings = resolveShiftTimings(shift.startTime, shift.endTime);
    const latestLog = shift.staffLogs?.[0] || null;
    const isCompleted = latestLog?.status === 'Completed';
    const isPast = shift.endTime.getTime() < now.getTime();
    const hasStartedLog = !isCompleted && latestLog?.status === 'Started';
    const hasContinuousNextShift = hasStartedLog
      ? await hasContinuousFollowingShiftForUser(tenantId, userId, shift)
      : false;
    const isStarted = hasStartedLog && !(isPast && hasContinuousNextShift);
    const isContinuing = isStarted && isPast;
    const timeRemainingStr = formatShiftTimeRemaining(timings.rawEndTime, now, {
      isStarted,
      isCompleted,
      hasContinuousNextShift,
    });

    // Resolve assigned residents
    const assignedResidentIds: string[] = [];
    shift.assignments.forEach((a) => {
      if (Array.isArray(a.assignedResidentIds)) {
        assignedResidentIds.push(...a.assignedResidentIds);
      }
    });

    let residents: Array<Record<string, unknown>> = [];
    if (assignedResidentIds.length > 0 || shift.wingId) {
      const residentWhere: Record<string, unknown> = {
        tenantId,
        status: 'Active',
      };
      if (assignedResidentIds.length > 0) {
        residentWhere.id = { in: assignedResidentIds };
      } else if (shift.wingId) {
        residentWhere.bed = { room: { wingId: shift.wingId } };
      }

      residents = (await prisma.resident.findMany({
        where: residentWhere,
        include: {
          bed: { include: { room: { include: { wing: true } } } },
          careProfile: true,
        },
      })) as unknown as Array<Record<string, unknown>>;
    }

    const residentIdsList = residents.map((r) => r.id as string);

    // Resolve real daily tasks scoped to tenant & residents
    let mappedTasks: unknown[] = [];
    if (residentIdsList.length > 0) {
      const { start: taskDayStart, end: taskDayEnd } = getUkDayBoundaries(
        timings.rawStartTime,
      );

      const dailyTasks = await prisma.dailyTask.findMany({
        where: {
          resident: { tenantId },
          residentId: { in: residentIdsList },
          scheduledDate: {
            gte: taskDayStart,
            lte: taskDayEnd,
          },
        },
        include: {
          resident: {
            select: { id: true, fullName: true, photoUrl: true },
          },
        },
        orderBy: [{ priority: 'desc' }],
      });

      mappedTasks = dailyTasks.map((t) => ({
        id: t.id,
        residentId: t.residentId,
        residentName: t.resident?.fullName || 'Resident',
        residentPhotoUrl: t.resident?.photoUrl || null,
        title: t.title,
        description: t.description || null,
        category: t.category || 'General Care',
        priority: t.priority || 'Medium',
        status: t.status,
        time: t.targetTime || 'Scheduled',
        scheduledTimeStr: t.targetTime || 'Scheduled',
        timingStatus: t.status === 'Completed' ? 'Completed' : 'Due Today',
      }));
    }

    const incidentCount = await prisma.incident.count({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: shift.startTime, lte: shift.endTime },
      },
    });

    const previousShiftHandovers = await loadPreviousShiftHandovers(
      shift,
      assignedResidentIds,
      shift.assignments.flatMap((assignment) => assignment.assignedRoomIds),
    );

    return {
      id: shift.id,
      name: shift.type?.name || 'Shift',
      wardName: shift.wing?.name || 'Main Facility',
      startTime: shift.startTime,
      endTime: shift.endTime,
      formattedStartTime: timings.startTime,
      formattedEndTime: timings.endTime,
      rawStartTime: timings.rawStartTime,
      rawEndTime: timings.rawEndTime,
      timingFormatted: `${timings.startTime} - ${timings.endTime}`,
      durationFormatted: `${Math.max(1, Math.round((timings.rawEndTime.getTime() - timings.rawStartTime.getTime()) / 3600000))} hrs`,
      timeRemainingStr,
      status: isContinuing
        ? 'Continuing'
        : latestLog?.status || shift.status || 'Scheduled',
      isStarted,
      isCompleted,
      isContinuing,
      hasContinuousNextShift,
      actualStartTime: latestLog?.actualStartTime || null,
      actualEndTime: latestLog?.actualEndTime || null,
      tasksCompleted: mappedTasks.filter(
        (t: unknown) => (t as { status: string }).status === 'Completed',
      ).length,
      tasksTotal: mappedTasks.length,
      tasksPending: mappedTasks.filter(
        (t: unknown) => (t as { status: string }).status !== 'Completed',
      ).length,
      incidentCount,
      shiftNotes: shift.notes || null,
      handoverNotes: latestLog?.handoverNotes || null,
      previousShiftHandover: previousShiftHandovers[0] ?? null,
      previousShiftHandovers,
      assignedResidents: residents.map((r) => {
        const cp = r.careProfile as Record<string, unknown> | null;
        const bed = r.bed as
          | {
              bedLabel?: string;
              number?: string;
              room?: { roomNumber?: string; wing?: { name?: string } };
            }
          | undefined;
        return {
          id: r.id,
          fullName: r.fullName,
          roomNumber: bed?.room?.roomNumber || '',
          bedNumber: bed?.bedLabel || bed?.number || '',
          wingName: bed?.room?.wing?.name || '',
          careLevel: cp?.careComplexity || cp?.careCategory || 'Medium',
          photoUrl: r.photoUrl || null,
        };
      }),
      tasks: mappedTasks,
    };
  }
}
