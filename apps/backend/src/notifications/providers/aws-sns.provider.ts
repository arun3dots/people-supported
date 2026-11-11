import { Injectable, Logger } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  NotificationProvider,
  NotificationPriority,
} from '../notifications.types';
import {
  getAwsClientConfig,
  getSnsSenderId,
  getSnsTopicArn,
} from '../../common/utils/aws-config.util';

@Injectable()
export class AwsSnsProvider implements NotificationProvider {
  private readonly logger = new Logger(AwsSnsProvider.name);
  private readonly snsClient: SNSClient;
  private readonly topicArn?: string;
  private readonly senderId: string;

  constructor() {
    this.snsClient = new SNSClient(getAwsClientConfig());
    this.topicArn = getSnsTopicArn();
    this.senderId = getSnsSenderId();
  }

  async send(params: {
    recipient: { phoneNumber?: string };
    title: string;
    message: string;
    priority?: NotificationPriority;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; error?: string }> {
    const phoneNumber = params.recipient.phoneNumber?.trim();

    if (!phoneNumber && !this.topicArn) {
      return {
        success: false,
        error: 'No phone number or SNS topic ARN provided',
      };
    }

    try {
      if (phoneNumber) {
        const command = new PublishCommand({
          PhoneNumber: phoneNumber,
          Message: params.message,
          MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
              DataType: 'String',
              StringValue: this.senderId,
            },
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional',
            },
          },
        });

        await this.snsClient.send(command);
        return { success: true };
      }

      const topicCommand = new PublishCommand({
        TopicArn: this.topicArn,
        Subject: params.title.slice(0, 100),
        Message: params.actionUrl
          ? `${params.message}\n\nAction URL: ${params.actionUrl}`
          : params.message,
      });

      await this.snsClient.send(topicCommand);
      return { success: true };
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown SNS error';
      this.logger.error(`AWS SNS send failed: ${errMessage}`);
      return { success: false, error: errMessage };
    }
  }
}
