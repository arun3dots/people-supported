import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Resend } from 'resend';
import { welcomeTemplate } from './templates/welcome';
import { otpTemplate } from './templates/otp';
import { notificationTemplate } from './templates/notification';
import { passwordResetTemplate } from './templates/passwordReset';
import {
  getAwsClientConfig,
  getSesConfigurationSet,
  getSesFromEmail,
} from '../utils/aws-config.util';

type MailTransport =
  | {
      provider: 'ses';
      client: SESClient;
      fromEmail: string;
      configurationSetName?: string;
    }
  | { provider: 'resend'; client: Resend; fromEmail: string };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: MailTransport;

  constructor() {
    const provider = process.env.MAIL_PROVIDER?.trim().toLowerCase() || 'ses';
    if (provider === 'ses') {
      this.transport = {
        provider,
        client: new SESClient(getAwsClientConfig()),
        fromEmail: getSesFromEmail(),
        configurationSetName: getSesConfigurationSet(),
      };
    } else if (provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY?.trim();
      if (!apiKey)
        throw new Error('MAIL_PROVIDER=resend requires RESEND_API_KEY.');
      this.transport = {
        provider,
        client: new Resend(apiKey),
        fromEmail:
          process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev',
      };
    } else {
      throw new Error('MAIL_PROVIDER must be ses or resend.');
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    fromName = 'Cantra Care',
  ): Promise<void> {
    const transport = this.transport;
    const sender = `${fromName} <${transport.fromEmail}>`;

    if (transport.provider === 'resend') {
      const response = await transport.client.emails.send({
        from: sender,
        to: [to],
        subject,
        html,
      });

      if (response.error) {
        this.logger.error('Error sending email via Resend:', response.error);
        throw new Error(
          `Resend email delivery failed: ${response.error.message}`,
        );
      }

      this.logger.log(`Email successfully sent via Resend to ${to}`);
      return;
    }

    const command = new SendEmailCommand({
      Source: sender,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
      ...(transport.configurationSetName
        ? { ConfigurationSetName: transport.configurationSetName }
        : {}),
    });
    await transport.client.send(command);
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    tenantName: string,
    subdomain: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`;

    try {
      await this.sendEmail(
        email,
        `Verify your account - ${tenantName}`,
        welcomeTemplate(tenantName, subdomain, verificationUrl),
      );
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    await this.sendEmail(
      email,
      'Security Verification Code',
      otpTemplate(otpCode),
      'Cantra Care Security',
    );
  }

  async sendManagedAccountVerification(
    email: string,
    verificationUrl: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      'Verify your Cantra Care invitation',
      notificationTemplate(
        'Verify your email address',
        'Confirm the address used for your Cantra Care account before receiving sign-in instructions.',
        verificationUrl,
      ),
    );
  }

  async sendNotification(
    email: string,
    title: string,
    message: string,
    actionUrl?: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      title,
      notificationTemplate(title, message, actionUrl),
      'Cantra Care Notifications',
    );
  }

  async sendStaffWelcomeEmail(
    email: string,
    fullName: string,
    tempPassword: string,
    tenantName: string,
  ): Promise<void> {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    const title = `Welcome to ${tenantName}`;
    const message = `Hello ${fullName},<br><br>You have been added as a staff member for ${tenantName}.<br><br>Your temporary password is:<br><br><span style="font-size: 18px; font-weight: bold; background-color: #f1f5f9; padding: 6px 12px; border-radius: 6px; display: inline-block;">${tempPassword}</span><br><br>Please log in using your email address and change your password immediately after signing in.`;

    try {
      await this.sendEmail(
        email,
        title,
        notificationTemplate(title, message, loginUrl),
      );
      this.logger.log(`Welcome email sent to staff ${email}`);
    } catch (error) {
      this.logger.error('Error sending staff welcome email:', error);
      // Don't throw here to avoid blocking staff creation, but log it
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    fullName: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.sendEmail(
        email,
        'Reset Your Password - Cantra Care',
        passwordResetTemplate(fullName, resetUrl),
        'Cantra Care Security',
      );
      this.logger.log(`Password reset link sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Error sending password reset email to ${email}:`,
        error,
      );
      throw error;
    }
  }
}
