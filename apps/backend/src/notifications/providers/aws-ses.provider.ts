import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  NotificationProvider,
  NotificationPriority,
} from '../notifications.types';
import {
  notificationTemplate,
  resolveActionUrl,
} from '../../common/mail/templates/notification';
import {
  getAwsClientConfig,
  getSesConfigurationSet,
  getSesFromEmail,
} from '../../common/utils/aws-config.util';

@Injectable()
export class AwsSesProvider implements NotificationProvider {
  private readonly logger = new Logger(AwsSesProvider.name);
  private readonly sesClient: SESClient;
  private readonly fromEmail: string;
  private readonly configurationSetName?: string;

  constructor() {
    this.sesClient = new SESClient(getAwsClientConfig());
    this.fromEmail = getSesFromEmail();
    this.configurationSetName = getSesConfigurationSet();
  }

  async send(params: {
    recipient: { email?: string };
    title: string;
    message: string;
    priority?: NotificationPriority;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; error?: string }> {
    if (!params.recipient.email)
      return { success: false, error: 'No email provided' };

    try {
      const resolvedUrl = resolveActionUrl(params.actionUrl);

      const body = resolvedUrl
        ? `${params.message}\n\nAction required: ${resolvedUrl}`
        : params.message;

      const htmlBody = notificationTemplate(
        params.title,
        params.message.replace(/\n/g, '<br>'),
        resolvedUrl,
      );

      const command = new SendEmailCommand({
        Source: `Cantra Care Notifications <${this.fromEmail}>`,
        Destination: { ToAddresses: [params.recipient.email] },
        Message: {
          Subject: { Data: params.title, Charset: 'UTF-8' },
          Body: {
            Text: { Data: body, Charset: 'UTF-8' },
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
          },
        },
        ...(this.configurationSetName
          ? { ConfigurationSetName: this.configurationSetName }
          : {}),
      });

      await this.sesClient.send(command);
      return { success: true };
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown SES error';
      this.logger.error(`AWS SES send failed: ${errMessage}`);
      return { success: false, error: errMessage };
    }
  }
}
