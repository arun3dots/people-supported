import { Module } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './notifications.processor';
import { NotificationJobData } from './notifications.types';
import { AwsSesProvider } from './providers/aws-ses.provider';
import { AwsSnsProvider } from './providers/aws-sns.provider';
import { FcmProvider } from './providers/fcm.provider';
import { WebPushProvider } from './providers/web-push.provider';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationProcessor,
    {
      provide: getQueueToken('notifications'),
      useFactory: (processor: NotificationProcessor) => ({
        add: async (name: string, data: NotificationJobData) => {
          void processor.process({
            id: `${name}-${Date.now()}`,
            data,
          } as Job<NotificationJobData>);
        },
      }),
      inject: [NotificationProcessor],
    },
    AwsSesProvider,
    AwsSnsProvider,
    FcmProvider,
    WebPushProvider,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
