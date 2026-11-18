import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { NotificationsService } from '../notifications/notifications.service';
import {
  SHIFT_OVERRUN_GRACE_MS,
  hasContinuousFollowingShiftForUser,
} from '../shifts/services/shift-continuity.util';
import { formatTime } from '../shifts/services/shift-timing.util';

const DEDUPE_WINDOW_HOURS = 24 * 30;

@Injectable()
export class ShiftOverrunWorker {
  private readonly logger = new Logger(ShiftOverrunWorker.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Notifies respective branch/tenant Admins & Managers when a carer has not
   * manually ended a Started shift after the scheduled end + grace period,
   * provided they are not transitioning into a continuous shift.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleShiftOverruns(now: Date = new Date()): Promise<void> {
    try {
      const graceCutoff = new Date(now.getTime() - SHIFT_OVERRUN_GRACE_MS);
      const openLogs = await prisma.staffShiftLog.findMany({
        where: {
          status: 'Started',
          actualEndTime: null,
          shift: {
            deletedAt: null,
            status: 'Published',
            endTime: { lte: graceCutoff },
          },
        },
        include: {
          user: { select: { id: true, fullName: true } },
          shift: {
            select: {
              id: true,
              tenantId: true,
              branchId: true,
              startTime: true,
              endTime: true,
              status: true,
              deletedAt: true,
              createdById: true,
              type: { select: { name: true } },
            },
          },
        },
      });

      for (const log of openLogs) {
        if (
          !log.shift ||
          log.shift.endTime.getTime() <= log.shift.startTime.getTime()
        ) {
          continue;
        }

        const hasContinuousNext = await hasContinuousFollowingShiftForUser(
          log.shift.tenantId,
          log.userId,
          log.shift,
        );
        if (hasContinuousNext) {
          continue;
        }

        const recipientIds = await this.resolveRespectiveAdminIds(
          log.shift.tenantId,
          log.shift.branchId,
          log.shift.createdById ?? null,
        );
        if (recipientIds.length === 0) {
          continue;
        }

        const carerName = log.user?.fullName || 'Support Worker';
        const shiftName = log.shift.type?.name || 'Scheduled';
        const scheduledEndStr = formatTime(log.shift.endTime);

        for (const recipientId of recipientIds) {
          await this.notificationsService.triggerAlert({
            tenantId: log.shift.tenantId,
            branchId: log.shift.branchId,
            recipientId,
            title: `Carer Continuing Shift: ${carerName}`,
            message: `${carerName} has not ended their ${shiftName} shift (scheduled end ${scheduledEndStr}) and is continuing their shift.`,
            category: 'ROTA',
            priority: 'High',
            channels: ['IN_APP', 'EMAIL', 'WEB_PUSH'],
            inApp: true,
            sourceCode: 'ROT-OVERRUN',
            actionUrl: '/admin/staff/rota',
            dedupeKey: `shift-overrun-${log.id}`,
            dedupeWindowHours: DEDUPE_WINDOW_HOURS,
            metadata: {
              sourceCode: 'ROT-OVERRUN',
              shiftId: log.shift.id,
              staffShiftLogId: log.id,
              carerId: log.userId,
              scheduledEndTime: log.shift.endTime.toISOString(),
            },
          });
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in ShiftOverrunWorker: ${msg}`);
    }
  }

  private async resolveRespectiveAdminIds(
    tenantId: string,
    branchId: string,
    createdById: string | null,
  ): Promise<string[]> {
    const admins = await prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          {
            role: { name: { in: ['Admin', 'Manager'] } },
            OR: [
              { branches: { some: { branchId } } },
              { branches: { none: {} } },
            ],
          },
          ...(createdById ? [{ id: createdById }] : []),
        ],
      },
      select: { id: true },
    });
    return Array.from(new Set(admins.map((admin) => admin.id)));
  }
}
