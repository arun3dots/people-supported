import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { StaffModule } from '../staff/staff.module';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  // StaffModule re-exports ComplianceService (read-only compliance for self).
  imports: [StaffModule, AuditModule, StorageModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
