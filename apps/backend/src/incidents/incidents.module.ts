import { Module } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { DutyOfCandourService } from './services/duty-of-candour.service';
import { IncidentNotificationService } from './services/incident-notification.service';
import { IncidentMetricsService } from './services/incident-metrics.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [IncidentsController],
  providers: [
    IncidentsService,
    DutyOfCandourService,
    IncidentNotificationService,
    IncidentMetricsService,
  ],
  exports: [
    IncidentsService,
    DutyOfCandourService,
    IncidentNotificationService,
    IncidentMetricsService,
  ],
})
export class IncidentsModule {}
