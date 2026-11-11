import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { prisma } from '@repo/db';
import { MailService } from '../common/mail/mail.service';
import { AuditService } from '../audit/audit.service';

/**
 * NCSC Top Breached / Common Password Deny-List (D-01 Compliance)
 */
const COMMON_PASSWORDS = new Set([
  'password123!',
  'password1234!',
  'admin123456!',
  'carehome2026!',
  'welcome12345!',
  'qwerty123456!',
  '123456789012',
  'letmein12345!',
  'cantracare123!',
  'changeme1234!',
]);

export function assertPasswordNotCommon(password: string): void {
  const normalized = password.toLowerCase().trim();
  if (COMMON_PASSWORDS.has(normalized)) {
    throw new BadRequestException(
      'This password is on the NCSC list of common breached passwords and cannot be used. Please choose a unique passphrase.',
    );
  }
}

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  async changePassword(
    userId: string,
    currentPass: string,
    newPass: string,
  ): Promise<void> {
    assertPasswordNotCommon(newPass);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPass, 12);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });

    void this.auditService.emitAuth({
      userId: user.id,
      tenantId: user.tenantId,
      userEmail: user.email,
      userFullName: user.fullName,
      actionType: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
    });
  }

  async forgotPassword(email: string): Promise<{ success: boolean }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new NotFoundException(
        'No active user account found with this email address',
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.passwordReset.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    await prisma.passwordReset.create({
      data: {
        email,
        otpHash: '',
        resetToken,
        expiresAt,
      },
    });

    try {
      await this.mailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.fullName,
      );
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}`, err);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
    }

    void this.auditService.emitAuth({
      userEmail: email,
      actionType: 'FORGOT_PASSWORD_REQUESTED',
      entityType: 'User',
    });

    return { success: true };
  }

  async verifyOtp(
    email: string,
    otpCode: string,
  ): Promise<{ success: boolean; resetToken: string }> {
    const record = await prisma.passwordReset.findFirst({
      where: {
        email,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.attempts >= 5) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const isValid = await bcrypt.compare(otpCode, record.otpHash);
    if (!isValid) {
      await prisma.passwordReset.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });
      throw new UnauthorizedException('Invalid verification code');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.passwordReset.update({
      where: { id: record.id },
      data: { resetToken },
    });

    return { success: true, resetToken };
  }

  async resetPasswordWithToken(
    resetToken: string,
    newPass: string,
    email?: string,
  ): Promise<{ success: boolean }> {
    assertPasswordNotCommon(newPass);

    const record = await prisma.passwordReset.findFirst({
      where: {
        resetToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new UnauthorizedException(
        'Invalid or expired password reset link. Password reset links are valid for 5 minutes.',
      );
    }

    const targetEmail = record.email || email;
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });
    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    const passwordHash = await bcrypt.hash(newPass, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });

    await prisma.passwordReset.update({
      where: { id: record.id },
      data: { used: true },
    });

    void this.auditService.emitAuth({
      userId: user.id,
      tenantId: user.tenantId,
      userEmail: user.email,
      actionType: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user.id,
    });

    return { success: true };
  }
}
