import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceCronService } from './compliance-cron.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PasswordGeneratorService } from '../common/services/password-generator.service';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [StaffController, ComplianceController],
  providers: [
    StaffService,
    ComplianceService,
    ComplianceCronService,
    PasswordGeneratorService,
  ],
  exports: [StaffService, ComplianceService, PasswordGeneratorService],
})
export class StaffModule {}
