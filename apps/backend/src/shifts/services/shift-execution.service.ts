import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { AuditService } from '../../audit/audit.service';
import { toJsonValue } from '../../common/utils/json.util';
import { isContinuousFollowUpShift } from './shift-continuity.util';

@Injectable()
export class ShiftExecutionService {
  constructor(private readonly auditService: AuditService) {}

  async startShiftLog(
    shiftId: string,
    tenantId: string,
    userId: string,
    notes?: string,
  ): Promise<unknown> {
    if (!tenantId || !userId) {
      throw new UnauthorizedException(
        'Authentication context required to start shift',
      );
    }

    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        tenantId,
        deletedAt: null,
      },
      include: { type: true },
    });

    if (!shift) {
      throw new NotFoundException(
        'Assigned shift not found for current tenant',
      );
    }

    if (shift.status === 'Draft') {
      throw new BadRequestException(
        'Cannot clock in to an unpublished draft shift',
      );
    }

    const now = new Date();
    const earlyClockInWindowMs = 10 * 60 * 1000;
    const clockSkewAllowanceMs = 60 * 1000;
    // Allow clock-in up to 10 minutes prior to scheduled start.
    // Accommodate timezone variations (e.g. BST vs IST in mobile testing) for shifts scheduled on today's date.
    const isSameCalendarDay =
      Math.abs(shift.startTime.getTime() - now.getTime()) <
        24 * 60 * 60 * 1000 &&
      (shift.startTime.getUTCDate() === now.getUTCDate() ||
        shift.startTime.getDate() === now.getDate());

    const isTooEarlyStrict =
      shift.startTime.getTime() >
      now.getTime() + earlyClockInWindowMs + clockSkewAllowanceMs;

    if (isTooEarlyStrict && !isSameCalendarDay) {
      throw new BadRequestException(
        'Cannot clock in more than 10 minutes before scheduled shift start time',
      );
    }

    const existingLog = await prisma.staffShiftLog.findFirst({
      where: {
        shiftId: shift.id,
        tenantId,
        userId,
        status: 'Started',
      },
      include: {
        shift: { include: { type: true } },
        user: true,
      },
    });

    if (existingLog) {
      return existingLog;
    }

    const openPriorLogs = await prisma.staffShiftLog.findMany({
      where: {
        tenantId,
        userId,
        status: 'Started',
        actualEndTime: null,
        shiftId: { not: shift.id },
      },
      include: {
        shift: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });
    const continuousPredecessors = openPriorLogs.filter(
      (prior) => prior.shift && isContinuousFollowUpShift(prior.shift, shift),
    );

    const log = await prisma.$transaction(async (tx) => {
      for (const prior of continuousPredecessors) {
        const closedAt =
          prior.shift.endTime.getTime() < now.getTime()
            ? prior.shift.endTime
            : now;
        await tx.staffShiftLog.update({
          where: { id: prior.id },
          data: {
            status: 'Completed',
            actualEndTime: closedAt,
            handoverNotes:
              prior.handoverNotes || 'Auto-transitioned to continuous shift',
          },
        });
      }

      return tx.staffShiftLog.create({
        data: {
          tenantId,
          branchId: shift.branchId,
          shiftId: shift.id,
          userId,
          actualStartTime: now,
          status: 'Started',
          handoverNotes: notes,
        },
        include: {
          shift: { include: { type: true } },
          user: true,
        },
      });
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'SHIFT_STARTED',
      entityType: 'StaffShiftLog',
      entityId: log.id,
      entityLabel: `Staff Started Shift (${shift.type?.name || 'Shift'})`,
      tenantId,
      userId,
      newValue: toJsonValue(log) as Record<string, unknown>,
    });

    return log;
  }

  async endShiftLog(
    shiftId: string,
    tenantId: string,
    userId: string,
    handoverNotes?: string,
    tasksCompleted?: number,
    tasksTotal?: number,
  ): Promise<unknown> {
    if (!tenantId || !userId) {
      throw new UnauthorizedException(
        'Authentication context required to end shift',
      );
    }

    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, tenantId, deletedAt: null },
      include: { type: true },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const log = await prisma.staffShiftLog.findFirst({
      where: {
        shiftId,
        tenantId,
        userId,
        status: 'Started',
      },
      orderBy: { createdAt: 'desc' },
    });

    let updatedLog: unknown;

    if (!log) {
      updatedLog = await prisma.staffShiftLog.create({
        data: {
          tenantId,
          branchId: shift.branchId,
          shiftId,
          userId,
          actualStartTime: shift.startTime,
          actualEndTime: new Date(),
          status: 'Completed',
          handoverNotes,
          tasksCompleted: tasksCompleted || 0,
          tasksTotal: tasksTotal || 0,
        },
        include: {
          shift: { include: { type: true } },
          user: true,
        },
      });
    } else {
      updatedLog = await prisma.staffShiftLog.update({
        where: { id: log.id },
        data: {
          actualEndTime: new Date(),
          status: 'Completed',
          handoverNotes: handoverNotes || log.handoverNotes,
          tasksCompleted: tasksCompleted ?? log.tasksCompleted,
          tasksTotal: tasksTotal ?? log.tasksTotal,
        },
        include: {
          shift: { include: { type: true } },
          user: true,
        },
      });
    }

    // CQC Regulation 12 & 17: Official Handover audit record
    if (handoverNotes && handoverNotes.trim()) {
      const trimmedNotes = handoverNotes.trim();
      const missed =
        tasksTotal && tasksCompleted
          ? Math.max(0, tasksTotal - tasksCompleted)
          : 0;
      await prisma.handover.upsert({
        where: { shiftId },
        create: {
          shiftId,
          comment: trimmedNotes,
          missedTasks: missed,
          incidentCount: 0,
          lockedAt: new Date(),
          createdById: userId,
        },
        update: {
          comment: trimmedNotes,
          missedTasks: missed,
          lockedAt: new Date(),
          updatedById: userId,
        },
      });
    }

    const logRecord = updatedLog as { id: string };
    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'SHIFT_ENDED',
      entityType: 'StaffShiftLog',
      entityId: logRecord.id,
      entityLabel: `Staff Ended Shift (${shift.type?.name || 'Shift'})`,
      tenantId,
      userId,
      newValue: toJsonValue(updatedLog) as Record<string, unknown>,
    });

    return updatedLog;
  }

  async updateHandoverNotes(
    shiftId: string,
    tenantId: string,
    userId: string,
    handoverNotes: string,
  ): Promise<unknown> {
    if (!tenantId || !userId) {
      throw new UnauthorizedException('Authentication context required');
    }

    const log = await prisma.staffShiftLog.findFirst({
      where: {
        shiftId,
        tenantId,
        userId,
        status: 'Started',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      throw new NotFoundException(
        'Active shift log not found for current staff member',
      );
    }

    const updated = await prisma.staffShiftLog.update({
      where: { id: log.id },
      data: { handoverNotes },
      include: {
        shift: { include: { type: true } },
        user: true,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'HANDOVER_NOTE_ADDED',
      entityType: 'StaffShiftLog',
      entityId: updated.id,
      entityLabel: 'Staff Handover Note Recorded Mid-Shift',
      tenantId,
      userId,
      newValue: { handoverNotes },
    });

    return updated;
  }

  async getShiftLogs(shiftId: string, tenantId: string): Promise<unknown[]> {
    if (!tenantId) return [];

    return prisma.staffShiftLog.findMany({
      where: {
        shiftId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        shift: { include: { type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
