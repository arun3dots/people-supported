import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ComplianceCronService {
  private readonly logger = new Logger(ComplianceCronService.name);

  constructor(
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Runs daily at 7:00 AM to check for expiring HR compliance records (HR-002)
   * and team training completion threshold <80% (HR-004).
   * Respects the RUN_CRON env var so only one replica fires in multi-instance deploys.
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleComplianceAlerts() {
    if (process.env.RUN_CRON !== 'true') return;

    this.logger.log('Running daily HR compliance & training check...');

    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const in90Days = new Date(now);
    in90Days.setDate(in90Days.getDate() + 90);

    // ── RTW Expiry ──
    const expiringRtw = await prisma.rightToWorkCheck.findMany({
      where: {
        expiryDate: { lte: in90Days, gt: now },
        rtwStatus: { not: 'Expired' },
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, tenantId: true },
        },
      },
    });

    for (const rtw of expiringRtw) {
      const daysUntilExpiry = Math.ceil(
        (new Date(rtw.expiryDate!).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const priority = daysUntilExpiry <= 30 ? 'HIGH' : 'STANDARD';
      this.logger.warn(
        `[${priority}] RTW expiring in ${daysUntilExpiry} days for ${rtw.user.fullName} (${rtw.user.email})`,
      );
    }

    // ── Matrix HR-002: DBS Expiry Approaching (3 months / 90 days before expiry) ──
    const expiringDbs = await prisma.dbsCheck.findMany({
      where: {
        expiryDate: { lte: in90Days, gt: now },
        status: { not: 'Action Required' },
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, tenantId: true },
        },
      },
    });

    for (const dbs of expiringDbs) {
      const daysUntilExpiry = Math.ceil(
        (new Date(dbs.expiryDate!).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const priority = daysUntilExpiry <= 30 ? 'HIGH' : 'STANDARD';
      this.logger.warn(
        `[${priority}] DBS expiring in ${daysUntilExpiry} days for ${dbs.user.fullName} (${dbs.user.email})`,
      );

      if (this.notificationsService && dbs.user.tenantId) {
        const milestone =
          daysUntilExpiry <= 7 ? '7d' : daysUntilExpiry <= 30 ? '30d' : '90d';
        await this.notificationsService.triggerMatrixAlert('HR-002', {
          tenantId: dbs.user.tenantId,
          title: `DBS EXPIRY APPROACHING: ${dbs.user.fullName}`,
          message: `DBS certificate for ${dbs.user.fullName} expires in ${daysUntilExpiry} days (${new Date(dbs.expiryDate!).toLocaleDateString('en-GB')}). Please initiate renewal.`,
          actionUrl: `/admin/staff/${dbs.user.id}`,
          dedupeKey: `hr-002-dbs-${dbs.id}-${milestone}`,
          dedupeWindowHours: 24 * 7,
          metadata: {
            dbsId: dbs.id,
            staffUserId: dbs.user.id,
            daysUntilExpiry,
          },
        });
      }
    }

    // ── Certification Expiry ──
    const expiringCerts = await prisma.staffCertification.findMany({
      where: {
        expiryDate: { lte: in90Days, gt: now },
        status: { not: 'Expired' },
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, tenantId: true },
        },
      },
    });

    for (const cert of expiringCerts) {
      const daysUntilExpiry = Math.ceil(
        (new Date(cert.expiryDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysUntilExpiry <= 30 && cert.status !== 'Expiring Soon') {
        await prisma.staffCertification.update({
          where: { id: cert.id },
          data: { status: 'Expiring Soon' },
        });
      }
    }

    // ── Matrix HR-004: Training Below Threshold (Team completion <80%) ──
    await this.checkTeamTrainingThreshold(now);

    // ── Auto-expire past-due records ──
    await prisma.rightToWorkCheck.updateMany({
      where: { expiryDate: { lt: now }, rtwStatus: { not: 'Expired' } },
      data: { rtwStatus: 'Expired' },
    });

    await prisma.staffCertification.updateMany({
      where: { expiryDate: { lt: now }, status: { not: 'Expired' } },
      data: { status: 'Expired' },
    });

    this.logger.log('Compliance expiry check complete.');
  }

  /**
   * Matrix HR-004: Checks team training compliance rate per tenant;
   * triggers Email to Manager + HR Manager if team completion < 80%.
   */
  async checkTeamTrainingThreshold(now: Date = new Date()): Promise<void> {
    if (!this.notificationsService) return;

    const tenants = await prisma.tenant.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true },
    });

    for (const tenant of tenants) {
      const trainings = await prisma.staffTraining.findMany({
        where: {
          deletedAt: null,
          user: { tenantId: tenant.id, isActive: true, deletedAt: null },
        },
        select: { expiryDate: true },
      });

      if (trainings.length === 0) continue;

      const validCount = trainings.filter(
        (t) => new Date(t.expiryDate).getTime() >= now.getTime(),
      ).length;
      const completionPct = Math.round((validCount / trainings.length) * 100);

      if (completionPct < 80) {
        const weekKey = `${now.getUTCFullYear()}-W${Math.ceil(now.getUTCDate() / 7)}`;
        await this.notificationsService.triggerMatrixAlert('HR-004', {
          tenantId: tenant.id,
          title: `TRAINING BELOW THRESHOLD (${completionPct}%)`,
          message: `Team mandatory training completion for ${tenant.name} is at ${completionPct}% (${validCount}/${trainings.length} up to date), which is below the 80% threshold.`,
          actionUrl: `/admin/staff`,
          dedupeKey: `hr-004-training-${tenant.id}-${weekKey}`,
          dedupeWindowHours: 24 * 6,
          metadata: {
            completionPct,
            validCount,
            totalRecords: trainings.length,
          },
        });
      }
    }
  }
}
