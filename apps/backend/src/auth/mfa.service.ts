import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { prisma } from '@repo/db';
import { MailService } from '../common/mail/mail.service';
import { AuditService } from '../audit/audit.service';

const PRIVILEGED_MFA_ROLES = ['SuperAdmin', 'Admin', 'Manager'];

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {
    authenticator.options = { window: 1 };
  }

  async getSecurityState(userId: string): Promise<{
    mfaEnabled: boolean;
    mfaMandatory: boolean;
    passwordChangedAt: Date | null;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { select: { name: true } },
        tenant: { select: { enforceMfaForAllStaff: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const roleName = user.role?.name ?? '';
    const mfaMandatory =
      PRIVILEGED_MFA_ROLES.includes(roleName) ||
      user.tenant?.enforceMfaForAllStaff === true;

    return {
      mfaEnabled: user.mfaEnabled,
      mfaMandatory,
      passwordChangedAt: user.passwordChangedAt,
    };
  }

  async generateMfaSecret(userId: string): Promise<{
    secret: string;
    qrCodeDataUrl: string;
    otpauthUrl: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, tenantId: true, fullName: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Cantra Care', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    void this.auditService.emitAuth({
      userId: user.id,
      tenantId: user.tenantId,
      userEmail: user.email,
      userFullName: user.fullName,
      actionType: 'MFA_SECRET_GENERATED',
      entityType: 'User',
      entityId: user.id,
    });

    return { secret, qrCodeDataUrl, otpauthUrl };
  }

  async verifyMfaCode(userId: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.mfaSecret) {
      throw new BadRequestException(
        'MFA is not initialized for this account. Generate a secret first.',
      );
    }

    const isValid = authenticator.verify({
      token: token.trim(),
      secret: user.mfaSecret,
    });

    if (!isValid) {
      void this.auditService.emitAuth({
        userId: user.id,
        tenantId: user.tenantId,
        userEmail: user.email,
        userFullName: user.fullName,
        actionType: 'MFA_VERIFY_FAILED',
        entityType: 'User',
        entityId: user.id,
      });
      throw new UnauthorizedException('Invalid 6-digit authenticator code');
    }

    if (!user.mfaEnabled) {
      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });
    }

    void this.auditService.emitAuth({
      userId: user.id,
      tenantId: user.tenantId,
      userEmail: user.email,
      userFullName: user.fullName,
      actionType: 'MFA_VERIFIED',
      entityType: 'User',
      entityId: user.id,
    });
  }

  async disableMfa(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { select: { name: true } },
        tenant: { select: { enforceMfaForAllStaff: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const roleName = user.role?.name ?? '';
    const isMandatory =
      (PRIVILEGED_MFA_ROLES.includes(roleName) ||
        user.tenant?.enforceMfaForAllStaff === true) &&
      process.env.ENFORCE_MFA === 'true';

    if (isMandatory) {
      throw new ForbiddenException(
        'Multi-factor authentication is mandatory for your role and cannot be disabled.',
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    void this.auditService.emitAuth({
      userId: user.id,
      tenantId: user.tenantId,
      userEmail: user.email,
      userFullName: user.fullName,
      actionType: 'MFA_DISABLED',
      entityType: 'User',
      entityId: user.id,
    });
  }

  async requestMfaReset(userId: string): Promise<{ success: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const rawCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(rawCode, 10);
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.mfaResetRequest.deleteMany({ where: { userId } });
    await prisma.mfaResetRequest.create({
      data: {
        userId,
        token,
        code: hashedCode,
        expiresAt,
      },
    });

    try {
      await this.mailService.sendOtpEmail(user.email, rawCode);
    } catch (err) {
      this.logger.warn(
        `Could not send MFA reset email to ${user.email}: ${(err as Error).message}`,
      );
      if (process.env.NODE_ENV === 'production') throw err;
    }

    void this.auditService.emitAuth({
      userId: user.id,
      tenantId: user.tenantId,
      userEmail: user.email,
      userFullName: user.fullName,
      actionType: 'MFA_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id,
    });

    return { success: true };
  }

  async verifyMfaReset(
    userId: string,
    code: string,
  ): Promise<{ success: boolean }> {
    const resetReq = await prisma.mfaResetRequest.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetReq) {
      throw new UnauthorizedException('Invalid or expired MFA reset code');
    }

    const isMatch = await bcrypt.compare(code.trim(), resetReq.code);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid MFA reset code');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false, mfaSecret: null },
      }),
      prisma.mfaResetRequest.deleteMany({ where: { userId } }),
    ]);

    void this.auditService.emitAuth({
      userId,
      actionType: 'MFA_RESET_COMPLETED',
      entityType: 'User',
      entityId: userId,
    });

    return { success: true };
  }
}
