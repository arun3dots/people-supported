import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { AuditModule } from '../audit/audit.module';
import { ShiftRequestsService } from './shift-requests.service';
import { ShiftRequestsController } from './shift-requests.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShiftNotificationService } from './services/shift-notification.service';
import { LeaveRequestService } from './services/leave-request.service';
import { LeaveRequestsController } from './leave-requests.controller';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [ShiftsController, ShiftRequestsController, LeaveRequestsController],
  providers: [ShiftsService, ShiftRequestsService, ShiftNotificationService, LeaveRequestService],
  exports: [ShiftsService, ShiftRequestsService, ShiftNotificationService, LeaveRequestService],
})
export class ShiftsModule {}
