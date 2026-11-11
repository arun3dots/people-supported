import { Module } from '@nestjs/common';
import { EscalationsController } from './escalations.controller';
import { EscalationsService } from './escalations.service';
import { EscalationsTriageService } from './escalations-triage.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EscalationsController],
  providers: [EscalationsService, EscalationsTriageService],
  exports: [EscalationsService, EscalationsTriageService],
})
export class EscalationsModule {}
