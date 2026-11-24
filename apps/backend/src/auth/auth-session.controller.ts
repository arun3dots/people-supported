import {
  Body,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Header,
  Injectable,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  refreshTokenSchema,
  type RefreshTokenDTO,
  switchBranchSchema,
  type SwitchBranchDTO,
} from '@repo/schema';
import type { Request, Response } from 'express';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  clearAuthCookies,
  clearStaleDomainCookies,
  extractCookieValues,
  extractJwtByAlg,
  isSecureCookieRequest,
} from './auth-cookie.util';
import { assertSafeBrowserOrigin } from './auth-origin.util';
import { AuthService } from './auth.service';
import {
  CognitoConfig,
  isLoopbackHost,
  resolveAppForRequest,
} from './cognito/cognito-config';
import { cognitoRequestSession } from './cognito/cognito-jwt.strategy';
import {
  CognitoSessions,
  isCognitoRefresh,
} from './cognito/cognito-sessions.service';
import { setCognitoCookies } from './cognito/cognito.controller';

function pickRefreshCookies(req: Request) {
  const all = extractCookieValues(req, 'refresh_token');
  let cognito: string | undefined;
  let legacy: string | undefined;
  for (let i = all.length - 1; i >= 0; i--) {
    const val = all[i];
    if (isCognitoRefresh(val)) {
      cognito ??= val;
    } else if (val) {
      legacy ??= val;
    }
  }
  return { cognito, legacy };
}

@Injectable()
export class SessionLogoutGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    return (
      Boolean(pickRefreshCookies(req).cognito) || super.canActivate(context)
    );
  }
}

@ApiTags('Auth')
@Controller('auth')
export class AuthSessionController {
  constructor(
    private readonly legacy: AuthService,
    private readonly audit: AuditService,
    private readonly config: CognitoConfig,
    private readonly cognito: CognitoSessions,
  ) {}

  private checkOrigin(req: Request) {
    const settings = this.config.require();
    const target = this.config.resolveOrigin(req.get('origin'));
    if (!target) throw new ForbiddenException('Unexpected request origin.');
    const rawHost = req.get('host')?.split(',')[0]?.trim().toLowerCase();
    if (
      process.env.NODE_ENV === 'production' ||
      (rawHost && !isLoopbackHost(rawHost))
    ) {
      const hostTarget = resolveAppForRequest(settings, {
        get: (name: string) => req.get(name),
        query: { app: target.app },
      });
      if (hostTarget.app !== target.app) {
        throw new ForbiddenException('Cognito application host mismatch.');
      }
    }
    return target;
  }

  @Post('refresh')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Refresh the active application session' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(refreshTokenSchema.optional().default({})))
    body?: RefreshTokenDTO,
  ) {
    const { cognito, legacy } = pickRefreshCookies(req);
    if (cognito) {
      const target = this.checkOrigin(req);
      const secure = isSecureCookieRequest(req, target.secure);
      setCognitoCookies(
        res,
        secure,
        await this.cognito.refresh(cognito, target),
        req,
      );
      return { success: true };
    }

    assertSafeBrowserOrigin(req);
    if (
      process.env.COGNITO_AUTH_ENABLED === 'true' &&
      process.env.LEGACY_AUTH_ENABLED === 'false' &&
      !body?.refreshToken
    ) {
      throw new UnauthorizedException(
        'Legacy password authentication is disabled.',
      );
    }
    const oldRefreshToken = legacy || body?.refreshToken || '';
    if (!oldRefreshToken)
      throw new UnauthorizedException('No refresh token provided');
    const accessToken =
      extractJwtByAlg(req, 'access_token', 'HS256') ?? undefined;
    const result = await this.legacy.refreshAccessToken(
      oldRefreshToken,
      accessToken,
    );
    const secure = isSecureCookieRequest(req);
    clearStaleDomainCookies(res, req, secure);
    res.cookie(
      'access_token',
      result.access_token,
      ACCESS_COOKIE_OPTIONS(secure),
    );
    res.cookie(
      'refresh_token',
      result.refresh_token,
      REFRESH_COOKIE_OPTIONS(secure),
    );
    return {
      success: true,
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
  }

  @UseGuards(SessionLogoutGuard)
  @Post('logout')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Sign out the active application session' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { cognito } = pickRefreshCookies(req);
    if (cognito) {
      const target = this.checkOrigin(req);
      const secure = isSecureCookieRequest(req, target.secure);
      try {
        const { userId, tenantId, signOutUrl } = await this.cognito.logout(
          cognito,
          target,
        );
        if (tenantId) {
          await this.audit
            .emitAuth({
              actionType: 'LOGOUT',
              userId,
              tenantId,
              entityType: 'User',
              entityId: userId,
              metadata: { provider: 'cognito', app: target.app },
            })
            .catch(() => {});
        }
        return { success: true, signOutUrl };
      } finally {
        clearAuthCookies(res, req, secure);
      }
    }
    assertSafeBrowserOrigin(req);
    if (cognitoRequestSession(req))
      throw new UnauthorizedException('No session credential provided.');
    if (req.user.tenantId) {
      await this.audit
        .emitAuth({
          userId: req.user.userId,
          tenantId: req.user.tenantId,
          userEmail: req.user.email,
          userFullName: req.user.fullName,
          userRoleName: req.user.roleName,
          actionType: 'LOGOUT',
          entityType: 'User',
          entityId: req.user.userId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        })
        .catch(() => {});
    }
    await this.legacy.logout(req.user.userId);
    clearAuthCookies(res, req, isSecureCookieRequest(req));
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-branch')
  async switchBranch(
    @Body(new ZodValidationPipe(switchBranchSchema)) dto: SwitchBranchDTO,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = cognitoRequestSession(req);
    if (session) {
      const target = this.checkOrigin(req);
      const secure = isSecureCookieRequest(req, target.secure);
      const result = await this.cognito.switchBranch(
        session,
        req.user.userId,
        dto.branchId,
        target.app,
      );
      clearStaleDomainCookies(res, req, secure);
      res.cookie(
        'access_token',
        result.accessToken,
        ACCESS_COOKIE_OPTIONS(secure),
      );
      return { success: true, activeBranchId: result.activeBranchId };
    }
    assertSafeBrowserOrigin(req);
    const refreshToken = pickRefreshCookies(req).legacy;
    if (!refreshToken)
      throw new UnauthorizedException('No refresh token provided');
    const result = await this.legacy.switchBranch(
      req.user.userId,
      refreshToken,
      dto.branchId,
    );
    const secure = isSecureCookieRequest(req);
    clearStaleDomainCookies(res, req, secure);
    res.cookie(
      'access_token',
      result.access_token,
      ACCESS_COOKIE_OPTIONS(secure),
    );
    return { success: true, activeBranchId: result.activeBranchId };
  }
}
