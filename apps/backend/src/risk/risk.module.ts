import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { RiskTemplatesService } from './risk-templates.service';
import { RiskControlsService } from './risk-controls.service';
import { RiskAlertsService } from './risk-alerts.service';
import { RiskReportsService } from './risk-reports.service';
import { RiskReminderService } from './risk-reminder.service';
import { RiskAssessmentSyncService } from './risk-assessment-sync.service';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../common/mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, MailModule, NotificationsModule],
  controllers: [RiskController],
  providers: [
    RiskService,
    RiskTemplatesService,
    RiskControlsService,
    RiskAlertsService,
    RiskReportsService,
    RiskReminderService,
    RiskAssessmentSyncService,
  ],
  exports: [RiskService, RiskAssessmentSyncService],
})
export class RiskModule {}
