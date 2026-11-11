import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { NotificationsService } from '../notifications/notifications.service';
import { formatPseudonymizedResident } from '../common/utils/pseudonymize.util';

@Injectable()
export class MedicationAlertWorker {
  private readonly logger = new Logger(MedicationAlertWorker.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Matrix EMAR-001: Medication overdue (>30 min overdue)
   * Channel: Mobile push | Recipient: Senior Carer / Care Worker on shift | Priority: High
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkMissedMedications() {
    this.logger.debug('Running >30 min overdue medication check (EMAR-001)...');

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const missedRounds = await prisma.medicationRound.findMany({
      where: {
        status: 'Pending',
        scheduledTime: { lte: thirtyMinutesAgo },
        deletedAt: null,
      },
      include: {
        resident: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (missedRounds.length === 0) return;

    this.logger.warn(
      `Found ${missedRounds.length} medication rounds >30 min overdue.`,
    );

    for (const round of missedRounds) {
      const explicitRecipientIds: string[] = [];
      if (round.resident.keyworkerId) {
        explicitRecipientIds.push(round.resident.keyworkerId);
      }

      const resLabel = formatPseudonymizedResident(
        round.resident.fullName,
        round.residentId,
      );

      await this.notificationsService.triggerMatrixAlert('EMAR-001', {
        tenantId: round.resident.tenantId,
        branchId: round.resident.branchId,
        residentId: round.residentId,
        explicitRecipientIds,
        title: 'MEDICATION OVERDUE (>30 MIN)',
        message: `Medication round for ${resLabel} (${round.drugName} ${round.dose}) scheduled at ${round.scheduledTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })} is >30 minutes overdue.`,
        actionUrl: `/residents/${round.residentId}/medication`,
        dedupeKey: `emar-001-overdue-${round.id}`,
        metadata: {
          roundId: round.id,
          residentId: round.residentId,
          drugName: round.drugName,
        },
      });

      await prisma.medicationRound.update({
        where: { id: round.id },
        data: {
          status: 'Missed',
          updatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Matrix EMAR-001: Medication due (Drug round starting)
   * Channel: Mobile push | Recipient: Senior Carer / Care Worker on shift | Priority: High
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkUpcomingMedications() {
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    const upcomingRounds = await prisma.medicationRound.findMany({
      where: {
        status: 'Pending',
        scheduledTime: {
          gte: now,
          lte: fifteenMinutesFromNow,
        },
        deletedAt: null,
      },
      include: {
        resident: true,
      },
    });

    for (const round of upcomingRounds) {
      const explicitRecipientIds: string[] = [];
      if (round.resident.keyworkerId) {
        explicitRecipientIds.push(round.resident.keyworkerId);
      }

      const resLabel = formatPseudonymizedResident(
        round.resident.fullName,
        round.residentId,
      );

      await this.notificationsService.triggerMatrixAlert('EMAR-001', {
        tenantId: round.resident.tenantId,
        branchId: round.resident.branchId,
        residentId: round.residentId,
        explicitRecipientIds,
        title: 'MEDICATION ROUND STARTING',
        message: `Medication round for ${resLabel} (${round.drugName} ${round.dose}) is due at ${round.scheduledTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}.`,
        actionUrl: `/residents/${round.residentId}/medication`,
        dedupeKey: `emar-001-due-${round.id}`,
        metadata: {
          roundId: round.id,
          residentId: round.residentId,
          drugName: round.drugName,
        },
      });
    }
  }
}
