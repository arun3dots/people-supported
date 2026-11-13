import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { VisitorLogController } from './visitor-log.controller';
import { VisitorLogService } from './visitor-log.service';
import { PeepController } from './peep.controller';
import { PeepService } from './peep.service';
import { EquipmentMaintenanceController } from './equipment-maintenance.controller';
import { EquipmentMaintenanceService } from './equipment-maintenance.service';
import { StaffSupervisionController } from './staff-supervision.controller';
import { StaffSupervisionService } from './staff-supervision.service';
import { AuditScheduleController } from './audit-schedule.controller';
import { AuditScheduleService } from './audit-schedule.service';
import { CqcNotificationController } from './cqc-notification.controller';
import { CqcNotificationService } from './cqc-notification.service';
import { ComplianceReviewController } from './compliance-review.controller';
import { ComplianceReviewService } from './compliance-review.service';

@Module({
  imports: [AuditModule],
  controllers: [
    VisitorLogController,
    PeepController,
    EquipmentMaintenanceController,
    StaffSupervisionController,
    AuditScheduleController,
    CqcNotificationController,
    ComplianceReviewController,
  ],
  providers: [
    VisitorLogService,
    PeepService,
    EquipmentMaintenanceService,
    StaffSupervisionService,
    AuditScheduleService,
    CqcNotificationService,
    ComplianceReviewService,
  ],
  exports: [
    VisitorLogService,
    PeepService,
    EquipmentMaintenanceService,
    StaffSupervisionService,
    AuditScheduleService,
    CqcNotificationService,
    ComplianceReviewService,
  ],
})
export class CqcModule {}
