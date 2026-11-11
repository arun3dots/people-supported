import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { AuditService } from '../audit/audit.service';
import { RiskAlertsService } from './risk-alerts.service';
import { RiskReportsService } from './risk-reports.service';

/**
 * Daily cron job that nudges reviewers about upcoming/overdue reviews.
 *
 * Runs at 08:00 in the server timezone. Disabled unless RUN_CRON=true so
 * multi-replica deployments can elect a single firing instance.
 *
 * For each Active assessment whose nextReviewDate falls within the next
 * 7 days (inclusive of overdue), we:
 *   - dispatch a RiskAlert + email to the original creator and approvers
 *   - emit a RISK_ASSESSMENT_REVIEW_DUE audit event
 */
@Injectable()
export class RiskReminderService {
  private readonly logger = new Logger(RiskReminderService.name);

  constructor(
    private readonly reportsService: RiskReportsService,
    private readonly alertsService: RiskAlertsService,
    private readonly auditService: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'risk-review-reminders' })
  async sendReviewReminders(): Promise<void> {
    if (process.env.RUN_CRON !== 'true') {
      this.logger.debug('RUN_CRON not set — skipping risk review reminders.');
      return;
    }
    await this.run();
  }

  /**
   * Public for test or admin-triggered runs.
   */
  async run(): Promise<{ processed: number }> {
    const due = await this.reportsService.findReviewsDueWithin(7);
    if (!due.length) {
      this.logger.log('No risk reviews due in the next 7 days.');
      return { processed: 0 };
    }
    this.logger.log(`Processing ${due.length} risk review reminder(s).`);

    for (const a of due) {
      const recipients = new Set<string>();
      if (a.createdById) recipients.add(a.createdById);
      const approvers = await this.alertsService.findApproversForTenant(
        a.tenantId,
      );
      approvers.forEach((u) => recipients.add(u));

      const overdue = a.nextReviewDate.getTime() < Date.now();
      const subject = overdue
        ? `Overdue risk review: ${a.title}`
        : `Risk review due soon: ${a.title}`;
      const message = `Risk assessment "${a.title}" is ${
        overdue ? 'overdue' : 'due within 7 days'
      } (review date ${a.nextReviewDate.toISOString().slice(0, 10)}).`;

      await this.alertsService.dispatch({
        tenantId: a.tenantId,
        recipientUserIds: Array.from(recipients),
        riskAssessmentId: a.id,
        type: 'ReviewDue',
        subject,
        message,
      });

      await this.auditService.emitClinicalDoc({
        actionType: 'RISK_ASSESSMENT_REVIEW_DUE',
        tenantId: a.tenantId,
        entityType: 'RiskAssessment',
        entityId: a.id,
        entityLabel: a.title,
        metadata: {
          nextReviewDate: a.nextReviewDate.toISOString(),
          overdue,
        },
      });

      // Mark overdue controls
      if (overdue) {
        await prisma.riskControl.updateMany({
          where: {
            riskAssessmentId: a.id,
            status: { in: ['Pending', 'InProgress'] },
            dueDate: { lt: new Date() },
            deletedAt: null,
          },
          data: { status: 'Overdue' },
        });
      }
    }

    return { processed: due.length };
  }
}
