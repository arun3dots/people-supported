import { Module } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { ObservationsController } from './observations.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [NotificationsModule, AuditModule],
  controllers: [ObservationsController],
  providers: [ObservationsService],
  exports: [ObservationsService],
})
export class ObservationsModule {}
