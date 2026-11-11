import { Module } from '@nestjs/common';
import { MedicationAlertWorker } from './medication-alert.worker';
import { TaskAlertWorker } from './task-alert.worker';
import { SubscriptionRenewalWorker } from './subscription-renewal.worker';
import { RetentionPurgeWorker } from './retention-purge.worker';
import { HydrationAlertWorker } from './hydration-alert.worker';
import { MatrixComplianceAlertWorker } from './matrix-compliance-alert.worker';
import { ShiftReminderWorker } from './shift-reminder.worker';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [NotificationsModule, PaymentsModule, ShiftsModule],
  providers: [
    MedicationAlertWorker,
    TaskAlertWorker,
    SubscriptionRenewalWorker,
    RetentionPurgeWorker,
    HydrationAlertWorker,
    MatrixComplianceAlertWorker,
    ShiftReminderWorker,
  ],
  exports: [
    RetentionPurgeWorker,
    HydrationAlertWorker,
    MatrixComplianceAlertWorker,
    ShiftReminderWorker,
  ],
})
export class JobsModule {}
