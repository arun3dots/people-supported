import { Module } from '@nestjs/common';
import { CarePlanService } from './care-plan.service';
import { CarePlanApprovalService } from './care-plan-approval.service';
import { CarePlanRenewalService } from './care-plan-renewal.service';
import { CarePlanTaskService } from './care-plan-task.service';
import { CarePlanDailyTaskService } from './care-plan-daily-task.service';
import { CarePlanTaskGeneratorService } from './care-plan-task-generator.service';
import { CarePlanGoalService } from './care-plan-goal.service';
import { CarePlanReviewService } from './care-plan-review.service';
import { CarePlanTransferService } from './care-plan-transfer.service';
import { CarePlanPdfService } from './care-plan-pdf.service';
import { CarePlanAutoDraftService } from './care-plan-auto-draft.service';
import { CarePlanSectionService } from './care-plan-section.service';
import { CarePlanController } from './care-plan.controller';
import { CarePlanReviewController } from './care-plan-review.controller';
import { CarePlanTransferController } from './care-plan-transfer.controller';
import { CarePlanExportController } from './care-plan-export.controller';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [
    CarePlanController,
    CarePlanReviewController,
    CarePlanTransferController,
    CarePlanExportController,
  ],
  providers: [
    CarePlanService,
    CarePlanGoalService,
    CarePlanApprovalService,
    CarePlanRenewalService,
    CarePlanTaskService,
    CarePlanDailyTaskService,
    CarePlanTaskGeneratorService,
    CarePlanReviewService,
    CarePlanTransferService,
    CarePlanPdfService,
    CarePlanAutoDraftService,
    CarePlanSectionService,
  ],
  exports: [
    CarePlanService,
    CarePlanGoalService,
    CarePlanApprovalService,
    CarePlanRenewalService,
    CarePlanTaskService,
    CarePlanDailyTaskService,
    CarePlanTaskGeneratorService,
    CarePlanReviewService,
    CarePlanTransferService,
    CarePlanPdfService,
    CarePlanAutoDraftService,
    CarePlanSectionService,
  ],
})
export class CarePlanModule {}
