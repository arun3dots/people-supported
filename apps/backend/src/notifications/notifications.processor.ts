import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { prisma } from '@repo/db';
import { NotificationJobData } from './notifications.types';
import { AwsSesProvider } from './providers/aws-ses.provider';
import { AwsSnsProvider } from './providers/aws-sns.provider';
import { FcmProvider } from './providers/fcm.provider';
import { WebPushProvider } from './providers/web-push.provider';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly sesProvider: AwsSesProvider,
    private readonly snsProvider: AwsSnsProvider,
    private readonly fcmProvider: FcmProvider,
    private readonly webPushProvider: WebPushProvider,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const {
      recipientId,
      title,
      message,
      channels,
      actionUrl,
      metadata,
      priority = 'Medium',
    } = job.data;

    this.logger.debug(
      `Processing notification job ${job.id} for user ${recipientId}`,
    );

    // 1. Fetch recipient contact data
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: {
        profile: true,
        pushSubscriptions: true,
        deviceTokens: true,
      },
    });

    if (!recipient) {
      this.logger.error(
        `Recipient ${recipientId} not found in DB during processing.`,
      );
      return;
    }

    // 2. Dispatch to each channel in parallel
    const deliveryPromises = channels.map(async (channel) => {
      try {
        let result: { success: boolean; error?: string };

        switch (channel) {
          case 'EMAIL':
            result = await this.sesProvider.send({
              recipient: { email: recipient.email },
              title,
              message,
              priority,
              actionUrl,
              metadata,
            });
            break;
          case 'SMS':
            result = await this.snsProvider.send({
              recipient: {
                phoneNumber: recipient.profile?.phoneNumber || undefined,
              },
              title,
              message: `${title}: ${message}`,
              priority,
              actionUrl,
              metadata,
            });
            break;
          case 'WEB_PUSH':
            result = await this.webPushProvider.send({
              recipient: {
                pushSubscriptions: recipient.pushSubscriptions.map(
                  (s: { endpoint: string; p256dh: string; auth: string }) => ({
                    endpoint: s.endpoint,
                    p256dh: s.p256dh,
                    auth: s.auth,
                  }),
                ),
              },
              title,
              message,
              priority,
              actionUrl,
              metadata,
            });
            break;
          case 'MOBILE_PUSH':
            result = await this.fcmProvider.send({
              recipient: {
                fcmTokens: recipient.deviceTokens.map((d) => d.token),
              },
              title,
              message,
              priority,
              actionUrl,
              metadata,
            });
            break;
          default:
            this.logger.warn(`Unknown channel ${channel} requested.`);
            return;
        }

        if (result && !result.success) {
          this.logger.warn(
            `Delivery failed for channel ${channel}: ${result.error}`,
          );
        }
      } catch (error: unknown) {
        this.logger.error(
          `Error delivering notification via ${channel}: ${(error as Error).message}`,
        );
      }
    });

    await Promise.all(deliveryPromises);
  }
}
