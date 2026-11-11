import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { NotificationsService } from '../notifications/notifications.service';
import { formatPseudonymizedResident } from '../common/utils/pseudonymize.util';

@Injectable()
export class RetentionPurgeWorker {
  private readonly logger = new Logger(RetentionPurgeWorker.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * B-10: Nightly Token & Ephemeral Data Purge (UK GDPR Art 5(1)(e) Storage Limitation).
   * Runs nightly at 03:00 AM.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredTokensAndArtifacts() {
    this.logger.log('Starting nightly data retention purge run...');
    const now = new Date();

    try {
      // 1. Purge expired refresh tokens
      const { count: deletedTokens } = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      // 2. Purge expired password reset tokens
      const { count: deletedResets } = await prisma.passwordReset.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      // 3. Purge expired MFA reset requests
      const { count: deletedMfaResets } =
        await prisma.mfaResetRequest.deleteMany({
          where: { expiresAt: { lt: now } },
        });

      this.logger.log(
        `Retention purge complete: ${deletedTokens} expired refresh tokens, ${deletedResets} password resets, and ${deletedMfaResets} MFA reset requests removed.`,
      );

      // 4. Update lastRetentionRunAt on all tenant policies
      await prisma.tenantRetentionPolicy.updateMany({
        data: { lastRetentionRunAt: now },
      });
    } catch (err: unknown) {
      this.logger.error('Error during nightly retention purge', err);
    }
  }

  /**
   * I-05: 15-Minute Unacknowledged High-Risk Clinical Escalation Timeout.
   * Runs every 5 minutes to escalate unacknowledged high/critical escalations to on-duty Managers.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkUnacknowledgedClinicalEscalations() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const staleEscalations = await prisma.clinicalEscalation.findMany({
      where: {
        status: 'Open',
        severity: { in: ['High', 'Critical'] },
        createdAt: { lt: fifteenMinutesAgo },
      },
      include: {
        resident: { select: { id: true, fullName: true, tenantId: true } },
      },
    });

    if (staleEscalations.length === 0) return;

    this.logger.warn(
      `Found ${staleEscalations.length} unacknowledged high-risk clinical escalations older than 15 minutes.`,
    );

    for (const esc of staleEscalations) {
      // Find on-duty Managers and Admins for this tenant
      const managers = await prisma.user.findMany({
        where: {
          tenantId: esc.tenantId,
          role: { name: { in: ['Manager', 'Admin'] } },
          isActive: true,
        },
        select: { id: true },
      });

      const pseudonymized = formatPseudonymizedResident(
        esc.resident.fullName,
        esc.resident.id,
      );

      for (const mgr of managers) {
        await this.notificationsService
          .triggerAlert({
            tenantId: esc.tenantId,
            recipientId: mgr.id,
            title: 'URGENT: UNACKNOWLEDGED CLINICAL ESCALATION',
            message: `Clinical escalation for ${pseudonymized} has been unacknowledged for >15 minutes (${esc.reason}). Immediate clinical oversight required.`,
            category: 'CLINICAL',
            priority: 'Urgent',
            actionUrl: `/admin/escalations/${esc.id}`,
            preferPushOverEmail: true,
            metadata: {
              escalationId: esc.id,
              residentId: esc.resident.id,
              severity: esc.severity,
            },
          })
          .catch(() => {});
      }
    }
  }
}
