import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ExecutionContext,
  Inject,
  Optional,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { prisma } from '@repo/db';
import { AuthenticatedUser } from '../interfaces/request.interface';
import type { Request } from 'express';
import { cognitoRequestSession } from '../../auth/cognito/cognito-jwt.strategy';
import { AccessClient } from '../../auth-access/integration/access-client';

const ALLOWED_UNVERIFIED_ROUTES = [
  '/api/auth/me',
  '/api/auth/resend-verification',
  '/api/auth/logout',
];

const ALLOWED_PRE_MFA_ROUTES = [
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/security-state',
  '/api/auth/mfa/generate',
  '/api/auth/mfa/verify',
  '/api/auth/mfa/reset-request',
  '/api/auth/mfa/reset-verify',
  '/api/auth/resend-verification',
];

const PRIVILEGED_MFA_ROLES = ['SuperAdmin', 'Admin', 'Manager'];

@Injectable()
export class JwtAuthGuard extends AuthGuard(['cognito-session', 'jwt']) {
  @Optional()
  @Inject(AccessClient)
  private readonly access?: AccessClient;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    if (!user?.userId) return false;

    const url: string = request.url ?? '';
    if (cognitoRequestSession(request as Request)) return true;
    if (
      this.access?.enrolled(user.tenantId) &&
      url.split('?')[0] !== '/api/auth/logout'
    ) {
      throw new ForbiddenException('Sign in with Cognito for this tenant.');
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        authMode: true,
        isActive: true,
        deletedAt: true,
        emailVerified: true,
        mfaEnabled: true,
        tenant: {
          select: {
            enforceMfaForAllStaff: true,
          },
        },
      },
    });

    // D-03 & D-09: Immediate revocation on deactivation / deletion
    if (
      !dbUser ||
      dbUser.authMode === 'Cognito' ||
      !dbUser.isActive ||
      dbUser.deletedAt !== null
    ) {
      throw new UnauthorizedException('User account is inactive or revoked');
    }

    // D-02: Enforce Multi-Factor Authentication verification
    const isPreMfaRoute = ALLOWED_PRE_MFA_ROUTES.some((route) =>
      url.startsWith(route),
    );
    if (!isPreMfaRoute) {
      if (dbUser.mfaEnabled && !user.mfaVerified) {
        throw new ForbiddenException({
          statusCode: 403,
          message: 'Multi-factor authentication verification required',
          code: 'MFA_REQUIRED',
        });
      }

      const roleRequiresMfa =
        PRIVILEGED_MFA_ROLES.includes(user.roleName) ||
        dbUser.tenant?.enforceMfaForAllStaff === true;
      if (
        roleRequiresMfa &&
        process.env.ENFORCE_MFA === 'true' &&
        !dbUser.mfaEnabled
      ) {
        throw new ForbiddenException({
          statusCode: 403,
          message:
            'Multi-factor authentication enrollment is required for your role',
          code: 'MFA_SETUP_REQUIRED',
        });
      }
    }

    // Only tenant-scoped users are subject to email verification.
    if (!user.tenantId) return true;

    if (ALLOWED_UNVERIFIED_ROUTES.some((route) => url.startsWith(route))) {
      return true;
    }

    if (!dbUser.emailVerified) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    return true;
  }

  handleRequest<T = AuthenticatedUser>(err: Error | null, user: T | false): T {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

@Injectable()
export class LegacyJwtAuthGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext) {
    if (!(await super.canActivate(context))) return false;
    if (cognitoRequestSession(context.switchToHttp().getRequest<Request>())) {
      throw new ForbiddenException(
        'Manage your credentials in Cognito Managed Login.',
      );
    }
    return true;
  }
}
