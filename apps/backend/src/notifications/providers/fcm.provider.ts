import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { NotificationProvider } from '../notifications.types';

@Injectable()
export class FcmProvider implements NotificationProvider {
  private readonly logger = new Logger(FcmProvider.name);
  private isInitialized = false;

  constructor() {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
        this.isInitialized = true;
      } else {
        this.logger.warn(
          'FIREBASE_SERVICE_ACCOUNT_JSON not set. Mobile Push will fail.',
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to initialize Firebase Admin: ${error.message}`,
      );
    }
  }

  async send(params: {
    recipient: { fcmTokens?: string[] };
    title: string;
    message: string;
    priority: any;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; error?: string }> {
    const tokens = params.recipient.fcmTokens || [];
    if (!tokens.length) {
      return { success: false, error: 'No device tokens provided' };
    }

    const expoTokens = tokens.filter(
      (t) => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'),
    );
    const standardFcmTokens = tokens.filter(
      (t) =>
        !t.startsWith('ExponentPushToken') && !t.startsWith('ExpoPushToken'),
    );

    let expoSuccess = true;
    if (expoTokens.length > 0) {
      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            expoTokens.map((token) => ({
              to: token,
              sound: 'default',
              title: params.title,
              body: params.message,
              data: { url: params.actionUrl || '', ...params.metadata },
              priority:
                params.priority === 'High' || params.priority === 'Urgent'
                  ? 'high'
                  : 'default',
            })),
          ),
        });
        if (!res.ok) {
          this.logger.warn(
            `Expo push delivery failed with status ${res.status}`,
          );
          expoSuccess = false;
        }
      } catch (err: unknown) {
        this.logger.error(
          `Expo push dispatch error: ${(err as Error).message}`,
        );
        expoSuccess = false;
      }
    }

    if (standardFcmTokens.length > 0 && this.isInitialized) {
      try {
        const message: admin.messaging.MulticastMessage = {
          tokens: standardFcmTokens,
          notification: {
            title: params.title,
            body: params.message,
          },
          webpush: params.actionUrl
            ? {
                fcmOptions: {
                  link: params.actionUrl,
                },
              }
            : undefined,
          data: {
            url: params.actionUrl || '',
          },
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        if (response.failureCount > 0) {
          this.logger.warn(
            `FCM had ${response.failureCount} failures out of ${standardFcmTokens.length}`,
          );
        }
      } catch (error: unknown) {
        this.logger.error(`FCM send failed: ${(error as Error).message}`);
      }
    }

    return { success: expoSuccess };
  }
}
