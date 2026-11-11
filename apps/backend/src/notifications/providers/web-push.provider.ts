import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import {
  NotificationProvider,
  NotificationPriority,
} from '../notifications.types';

@Injectable()
export class WebPushProvider implements NotificationProvider {
  private readonly logger = new Logger(WebPushProvider.name);

  constructor() {
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    const privateKey = process.env.VAPID_PRIVATE_KEY || '';
    const contactEmail =
      process.env.VAPID_CONTACT_EMAIL || 'mailto:admin@3dots.care';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(contactEmail, publicKey, privateKey);
    } else {
      this.logger.warn('VAPID keys not set. Web Push will fail.');
    }
  }

  async send(params: {
    recipient: {
      pushSubscriptions?: Array<{
        endpoint: string;
        p256dh: string;
        auth: string;
      }>;
    };
    title: string;
    message: string;
    priority?: NotificationPriority;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; error?: string }> {
    if (!params.recipient.pushSubscriptions?.length) {
      return { success: false, error: 'No push subscriptions provided' };
    }

    const tag =
      (params.metadata?.tag as string) ||
      (params.metadata?.category as string) ||
      (params.title
        ? `alert-${params.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        : 'care-notification');

    const isCritical = params.priority === 'Critical';

    const payload = JSON.stringify({
      title: params.title,
      body: params.message,
      message: params.message,
      url: params.actionUrl,
      actionUrl: params.actionUrl,
      priority: params.priority || 'Medium',
      tag,
      renotify: isCritical,
      icon: '/icons/notification-icon.png',
      metadata: params.metadata,
    });

    const results = await Promise.all(
      params.recipient.pushSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
          return { success: true };
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Web Push failed for endpoint ${sub.endpoint}: ${msg}`,
          );
          return { success: false, error: msg };
        }
      }),
    );

    const successCount = results.filter((r) => r.success).length;
    return {
      success: successCount > 0,
      error: successCount === 0 ? 'All push deliveries failed' : undefined,
    };
  }
}
