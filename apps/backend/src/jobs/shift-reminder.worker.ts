import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { ShiftNotificationService } from '../shifts/services/shift-notification.service';

@Injectable()
export class ShiftReminderWorker implements OnModuleInit {
  private readonly logger = new Logger(ShiftReminderWorker.name);

  constructor(
    private readonly shiftNotificationService: ShiftNotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    void this.runUpcomingShiftReminders();
  }

  /**
   * Evaluates upcoming published shifts every 5 minutes.
   * If a shift starts within the next 35 minutes (and hasn't started yet),
   * checks if a 30-minute reminder has already been sent to assigned staff.
   * If not, delivers the reminder email and logs an in-app notification.
   */
  @Cron('*/5 * * * *')
  async runUpcomingShiftReminders(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes grace for boundary overlap
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000); // 35 minutes ahead

    try {
      const upcomingShifts = await prisma.shift.findMany({
        where: {
          status: 'Published',
          deletedAt: null,
          startTime: {
            gte: windowStart,
            lte: windowEnd,
          },
          assignments: {
            some: { deletedAt: null },
          },
        },
        include: {
          type: true,
          wing: true,
          tenant: { select: { name: true } },
          assignments: {
            where: { deletedAt: null },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

      if (upcomingShifts.length === 0) return;

      for (const shift of upcomingShifts) {
        for (const assignment of shift.assignments) {
          if (!assignment.user?.email) continue;

          const dedupeActionUrl = `/carer/rota?shiftId=${shift.id}&reminder=30min`;

          // Deduplication: ensure reminder is only sent once per carer per shift
          const existingNotification = await prisma.notification.findFirst({
            where: {
              recipientId: assignment.user.id,
              actionUrl: dedupeActionUrl,
            },
            select: { id: true },
          });

          if (existingNotification) continue;

          await this.shiftNotificationService.sendUpcomingReminderNotification({
            user: assignment.user,
            shift,
            tenantName: shift.tenant?.name,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Error executing upcoming shift reminder check: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
