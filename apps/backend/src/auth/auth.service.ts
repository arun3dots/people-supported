import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import {
  UsersService,
  type UserWithRoleAndProfile,
} from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { prisma, User, Role, UserBranch } from '@repo/db';
import { MailService } from '../common/mail/mail.service';
import {
  EMPTY_ROLE_PERMISSIONS,
  rolePermissionsSchema,
  type RolePermissions,
} from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { MfaService } from './mfa.service';
import { PasswordService } from './password.service';
import type { AuthenticatedUser } from '../common/interfaces/request.interface';

export type SafeUser = Omit<User, 'passwordHash'> & {
  role?: Pick<Role, 'name' | 'permissions'> | null;
  branches?: UserBranch[];
  profile?: { profilePhotoUrl?: string | null } | null;
};

interface JwtPayloadShape {
  email: string | undefined;
  fullName: string | undefined;
  sub: string | undefined;
  roleName: string | undefined;
  tenantId: string | null | undefined;
  mfaVerified: boolean;
  branchIds: string[];
  activeBranchId: string | null;
  permissions: RolePermissions;
}

function coercePermissions(raw: unknown): RolePermissions {
  const parsed = rolePermissionsSchema.safeParse(raw);
  return parsed.success ? parsed.data : EMPTY_ROLE_PERMISSIONS;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly mfaService: MfaService,
    private readonly passwordService: PasswordService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<UserWithRoleAndProfile, 'passwordHash'>> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const now = new Date();
    if (user.lockedUntil) {
      if (user.lockedUntil > now) {
        const remainingMinutes = Math.ceil(
          (user.lockedUntil.getTime() - now.getTime()) / 60000,
        );
        throw new UnauthorizedException(
          `Account is temporarily locked due to repeated failed login attempts. Please try again after ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
        );
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
      }
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      const maxAttempts = 5; // NCSC guidance: 5-10 attempts (D-01)
      const updatedAttempts = (user.failedLoginAttempts || 0) + 1;
      if (updatedAttempts >= maxAttempts) {
        const lockDurationMs = 15 * 60 * 1000;
        const lockedUntil = new Date(Date.now() + lockDurationMs);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: updatedAttempts,
            lockedUntil,
          },
        });

        // D-12 Security Alert: Emit alert on repeated brute-force threshold (>=10 attempts)
        if (updatedAttempts >= 10) {
          void this.auditService.emit({
            categoryType: 'AUTH',
            actionType: 'ACCOUNT_LOCKED',
            entityType: 'User',
            entityId: user.id,
            tenantId: user.tenantId || undefined,
            metadata: {
              alertType: 'SECURITY_ALERT_BRUTE_FORCE',
              failedAttempts: updatedAttempts,
              userEmail: user.email,
              severity: 'CRITICAL',
            },
          });
        }

        throw new UnauthorizedException(
          `Account is temporarily locked due to ${maxAttempts} consecutive failed login attempts. Please try again after 15 minutes.`,
        );
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: updatedAttempts },
        });
        const attemptsLeft = maxAttempts - updatedAttempts;
        throw new UnauthorizedException(
          `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before account lockout.`,
        );
      }
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil !== null) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    const { passwordHash: _passwordHash, ...result } = user;
    return this.ensureUserBranchAssignment(result);
  }

  private async ensureUserBranchAssignment<
    T extends { id: string; tenantId: string | null; branches?: UserBranch[] },
  >(user: T): Promise<T> {
    if (!user.tenantId || (user.branches && user.branches.length > 0)) {
      return user;
    }

    let branch = await prisma.branch.findFirst({
      where: { tenantId: user.tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!branch) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
      });
      branch = await prisma.branch.create({
        data: {
          tenantId: user.tenantId,
          name: 'Main Branch',
          code: 'MAIN',
          addressLine1: tenant?.addressLine1,
          addressLine2: tenant?.addressLine2,
          city: tenant?.city,
          postcode: tenant?.postcode,
          status: 'Active',
        },
      });
    }

    const userBranch = await prisma.userBranch.upsert({
      where: {
        userId_branchId: {
          userId: user.id,
          branchId: branch.id,
        },
      },
      update: { isPrimary: true },
      create: {
        userId: user.id,
        branchId: branch.id,
        isPrimary: true,
      },
    });

    return {
      ...user,
      branches: [userBranch],
    };
  }

  async resendVerification(
    userId: string,
  ): Promise<{ success: boolean; alreadyVerified?: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.emailVerified) return { success: true, alreadyVerified: true };

    let token = user.verificationToken;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: userId },
        data: { verificationToken: token },
      });
    }

    await this.mailService.sendVerificationEmail(
      user.email,
      token,
      user.tenant?.name ?? 'your account',
      user.tenant?.subdomain ?? '',
    );

    return { success: true };
  }

  private resolveBranchScope(
    branches: UserBranch[] | undefined,
    preferredActiveBranchId?: string | null,
  ): { branchIds: string[]; activeBranchId: string | null } {
    const branchIds = branches?.map((b) => b.branchId) ?? [];
    if (
      preferredActiveBranchId &&
      branchIds.includes(preferredActiveBranchId)
    ) {
      return { branchIds, activeBranchId: preferredActiveBranchId };
    }
    const primary = branches?.find((b) => b.isPrimary)?.branchId;
    return { branchIds, activeBranchId: primary ?? branchIds[0] ?? null };
  }

  private buildJwtPayload(
    user: Partial<User> & {
      role?: Pick<Role, 'name' | 'permissions'> | null;
      branches?: UserBranch[];
    },
    preferredActiveBranchId?: string | null,
    mfaVerified = false,
  ): JwtPayloadShape {
    const { branchIds, activeBranchId } = this.resolveBranchScope(
      user.branches,
      preferredActiveBranchId,
    );

    return {
      email: user.email,
      fullName: user.fullName,
      sub: user.id,
      roleName: user.role?.name,
      tenantId: user.tenantId,
      mfaVerified,
      branchIds,
      activeBranchId,
      permissions: coercePermissions(user.role?.permissions),
    };
  }

  async login(
    user: SafeUser,
    explicitMfaVerified?: boolean,
  ): Promise<{
    access_token: string;
    refresh_token: string | null;
    requiresMfa: boolean;
    mfaSetupRequired: boolean;
    mfaVerified: boolean;
  }> {
    const roleName = user.role?.name ?? 'Carer';
    const isPrivilegedRole = ['SuperAdmin', 'Admin', 'Manager'].includes(
      roleName,
    );
    const enforceMfaEnv = process.env.ENFORCE_MFA === 'true';

    let requiresMfa = false;
    let mfaSetupRequired = false;
    let mfaVerified = true;

    if (explicitMfaVerified === true) {
      mfaVerified = true;
    } else if (user.mfaEnabled) {
      requiresMfa = true;
      mfaVerified = false;
    } else if (isPrivilegedRole && enforceMfaEnv) {
      requiresMfa = true;
      mfaSetupRequired = true;
      mfaVerified = false;
    }

    const payload = this.buildJwtPayload(user, undefined, mfaVerified);
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    // Pending-MFA logins receive only a short-lived access token. A refresh
    // token is issued after MFA is complete so refresh cannot elevate claims.
    const refresh_token = mfaVerified
      ? await this.refreshTokenService.createRefreshToken(
          user.id,
          undefined,
          payload.activeBranchId,
          mfaVerified,
        )
      : null;

    return {
      access_token,
      refresh_token,
      requiresMfa,
      mfaSetupRequired,
      mfaVerified,
    };
  }

  async verifyMfaAndIssueTokens(
    userId: string,
    token: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: SafeUser;
  }> {
    await this.mfaService.verifyMfaCode(userId, token);
    const rawUser = await this.usersService.findById(userId);
    if (!rawUser) throw new UnauthorizedException('User not found');
    const user = await this.ensureUserBranchAssignment(rawUser);
    const tokens = await this.login(user, true);
    if (!tokens.refresh_token) {
      throw new UnauthorizedException(
        'MFA verification is required before issuing a refresh token',
      );
    }
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user,
    };
  }

  private getMfaStateFromAccessToken(
    accessToken: string | undefined,
    userId: string,
  ): boolean | undefined {
    if (!accessToken) return undefined;
    try {
      const payload = this.jwtService.verify<JwtPayloadShape>(accessToken, {
        ignoreExpiration: true,
      });
      return payload.sub === userId ? payload.mfaVerified : undefined;
    } catch {
      return undefined;
    }
  }

  async refreshAccessToken(
    oldRefreshToken: string,
    accessToken?: string,
  ) {
    const { newToken, userId, activeBranchId, mfaVerified: tokenMfaVerified } =
      await this.refreshTokenService.rotateRefreshToken(oldRefreshToken);

    const rawUser = await this.usersService.findById(userId);
    if (!rawUser) {
      throw new UnauthorizedException('User not found');
    }

    if (!rawUser.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const user = await this.ensureUserBranchAssignment(rawUser);
    const roleName = user.role?.name ?? 'Carer';
    const mfaRequired =
      Boolean(user.mfaEnabled) ||
      (['SuperAdmin', 'Admin', 'Manager'].includes(roleName) &&
        process.env.ENFORCE_MFA === 'true');
    const accessTokenMfaVerified = this.getMfaStateFromAccessToken(
      accessToken,
      user.id,
    );
    const mfaVerified =
      tokenMfaVerified ?? accessTokenMfaVerified ?? !mfaRequired;
    const payload = this.buildJwtPayload(user, activeBranchId, mfaVerified);
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });

    void this.auditService.emitAuth({
      userId: user.id,
      tenantId: user.tenantId,
      userEmail: user.email,
      userFullName: user.fullName,
      actionType: 'TOKEN_ROTATED',
      entityType: 'User',
      entityId: user.id,
    });

    return {
      access_token,
      refresh_token: newToken,
    };
  }

  async switchBranch(
    userId: string,
    refreshToken: string,
    branchId: string,
  ): Promise<{ access_token: string; activeBranchId: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const branchIds = user.branches?.map((b) => b.branchId) ?? [];
    if (!branchIds.includes(branchId)) {
      throw new ForbiddenException('You are not assigned to this branch');
    }

    await this.refreshTokenService.updateActiveBranch(refreshToken, branchId);

    const payload = this.buildJwtPayload(user, branchId, true);
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });

    void this.auditService.emitAuth({
      userId: user.id,
      tenantId: user.tenantId,
      userEmail: user.email,
      userFullName: user.fullName,
      actionType: 'BRANCH_SWITCHED',
      entityType: 'User',
      entityId: user.id,
      metadata: { branchId },
    });

    return { access_token, activeBranchId: branchId };
  }

  /**
   * Retrieves live profile, tenant, and permission data for the authenticated user,
   * enforcing security validation (soft-delete, account status, tenant status).
   */
  async getMe(currentUser: AuthenticatedUser) {
    if (!currentUser?.userId) {
      throw new UnauthorizedException('Authentication session is invalid');
    }

    // 1. SuperAdmin user (platform-wide, tenantId is null/undefined)
    if (!currentUser.tenantId) {
      const superAdminUser = await prisma.user.findFirst({
        where: { id: currentUser.userId, deletedAt: null },
        select: {
          id: true,
          isActive: true,
          lockedUntil: true,
          profile: { select: { profilePhotoUrl: true } },
          role: { select: { name: true, permissions: true } },
        },
      });

      if (!superAdminUser) {
        throw new UnauthorizedException(
          'SuperAdmin account not found or has been deactivated',
        );
      }

      if (!superAdminUser.isActive) {
        throw new UnauthorizedException('Account has been deactivated');
      }

      if (
        superAdminUser.lockedUntil &&
        superAdminUser.lockedUntil > new Date()
      ) {
        throw new UnauthorizedException('Account is temporarily locked');
      }

      return {
        ...currentUser,
        roleName: superAdminUser.role?.name ?? currentUser.roleName,
        permissions: superAdminUser.role?.permissions
          ? coercePermissions(superAdminUser.role.permissions)
          : (currentUser.permissions ?? EMPTY_ROLE_PERMISSIONS),
        subscriptionStatus: 'active',
        emailVerified: true,
        avatarUrl: superAdminUser.profile?.profilePhotoUrl ?? null,
        organizationName: null,
        organizationContactName: null,
      };
    }

    // 2. Tenant-scoped User
    const [tenant, user] = await Promise.all([
      prisma.tenant.findFirst({
        where: { id: currentUser.tenantId, deletedAt: null },
        select: {
          status: true,
          subscriptionStatus: true,
          name: true,
          primaryContactName: true,
        },
      }),
      prisma.user.findFirst({
        where: {
          id: currentUser.userId,
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        select: {
          isActive: true,
          lockedUntil: true,
          emailVerified: true,
          profile: { select: { profilePhotoUrl: true } },
          role: { select: { name: true, permissions: true } },
          branches: { select: { branchId: true } },
        },
      }),
    ]);

    if (!user) {
      throw new UnauthorizedException(
        'User account not found or has been deactivated',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    if (!tenant) {
      throw new UnauthorizedException(
        'Organization not found or has been deactivated',
      );
    }

    if (tenant.status === 'Suspended' || tenant.status === 'Inactive') {
      throw new UnauthorizedException(
        'Organization access is suspended or inactive',
      );
    }

    const subscriptionStatus = tenant.subscriptionStatus ?? 'active';
    const emailVerified = user.emailVerified ?? true;

    let paymentUrl: string | undefined;
    if (subscriptionStatus !== 'active') {
      const latest = await prisma.payment.findFirst({
        where: { tenantId: currentUser.tenantId, status: 'created' },
        orderBy: { createdAt: 'desc' },
        select: { shortUrl: true },
      });
      paymentUrl = latest?.shortUrl ?? undefined;
    }

    const liveBranchIds =
      user.branches?.map((b) => b.branchId) ?? currentUser.branchIds ?? [];
    let liveActiveBranchId = currentUser.activeBranchId;
    if (
      liveActiveBranchId &&
      liveBranchIds.length > 0 &&
      !liveBranchIds.includes(liveActiveBranchId)
    ) {
      liveActiveBranchId = liveBranchIds[0];
    }

    return {
      ...currentUser,
      // Refresh live role name and live permissions directly from database
      roleName: user.role?.name ?? currentUser.roleName,
      permissions: user.role?.permissions
        ? coercePermissions(user.role.permissions)
        : (currentUser.permissions ?? EMPTY_ROLE_PERMISSIONS),
      branchIds: liveBranchIds,
      activeBranchId: liveActiveBranchId,
      subscriptionStatus,
      paymentUrl,
      emailVerified,
      avatarUrl: user.profile?.profilePhotoUrl ?? null,
      organizationName: tenant.name ?? null,
      organizationContactName: tenant.primaryContactName ?? null,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(userId);
  }

  // Delegated MFA & Password methods (preserving AuthService facade)
  getSecurityState(userId: string) {
    return this.mfaService.getSecurityState(userId);
  }
  generateMfaSecret(userId: string) {
    return this.mfaService.generateMfaSecret(userId);
  }
  disableMfa(userId: string, password: string) {
    return this.mfaService.disableMfa(userId, password);
  }
  requestMfaReset(userId: string) {
    return this.mfaService.requestMfaReset(userId);
  }
  verifyMfaReset(userId: string, code: string) {
    return this.mfaService.verifyMfaReset(userId, code);
  }
  changePassword(userId: string, currentPass: string, newPass: string) {
    return this.passwordService.changePassword(userId, currentPass, newPass);
  }
  forgotPassword(email: string) {
    return this.passwordService.forgotPassword(email);
  }
  verifyOtp(email: string, otpCode: string) {
    return this.passwordService.verifyOtp(email, otpCode);
  }
  resetPasswordWithToken(resetToken: string, newPass: string, email?: string) {
    return this.passwordService.resetPasswordWithToken(
      resetToken,
      newPass,
      email,
    );
  }
}
