import {
  Controller,
  ForbiddenException,
  Get,
  Header,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuditService } from '../../audit/audit.service';
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  clearStaleDomainCookies,
  extractCookieValues,
  isSecureCookieRequest,
} from '../auth-cookie.util';
import { ACCESS_TOKEN_MAX_AGE_MS } from '../auth.constants';
import {
  CognitoAuthorization,
  LOGIN_ATTEMPT_TTL_MS,
} from './cognito-authorization.service';
import { COGNITO_CALLBACK_PATH, CognitoConfig } from './cognito-config';
import { CognitoDisabledIdentityException } from './cognito-identity';
import { CognitoMfaAssuranceException } from './cognito-mfa.util';
import { CognitoSessions } from './cognito-sessions.service';

const loginCookie = 'sl_cognito_binding';

export function setCognitoCookies(
  res: Response,
  secure: boolean,
  session: { accessToken: string; refreshToken: string; expiresAt: Date },
  req?: Request,
) {
  clearStaleDomainCookies(res, req, secure);
  const remaining = Math.max(0, session.expiresAt.getTime() - Date.now());
  res.cookie(
    'access_token',
    session.accessToken,
    ACCESS_COOKIE_OPTIONS(secure, Math.min(remaining, ACCESS_TOKEN_MAX_AGE_MS)),
  );
  res.cookie('refresh_token', session.refreshToken, {
    ...REFRESH_COOKIE_OPTIONS(secure),
    maxAge: remaining,
  });
}

function failureReason(error: unknown, rawError?: unknown, rawDesc?: unknown) {
  if (typeof rawError === 'string') {
    const desc = typeof rawDesc === 'string' ? rawDesc.toLowerCase() : '';
    if (
      rawError === 'access_denied' ||
      rawError === 'mfa_failed' ||
      desc.includes('mfa')
    ) {
      return 'mfa_failed';
    }
  }
  if (error instanceof CognitoMfaAssuranceException) return 'mfa_failed';
  if (error instanceof ForbiddenException) return 'unauthorized';
  if (error instanceof CognitoDisabledIdentityException) {
    return 'account_disabled';
  }
  return null;
}

@Controller('auth/cognito')
export class CognitoController {
  private readonly logger = new Logger(CognitoController.name);

  constructor(
    private readonly config: CognitoConfig,
    private readonly authorization: CognitoAuthorization,
    private readonly sessions: CognitoSessions,
    private readonly audit: AuditService,
  ) {}

  @Get('start')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  async start(@Req() req: Request, @Res() res: Response) {
    const target = this.config.resolveApp(req);
    const secure = isSecureCookieRequest(req, target.secure);
    const next = await this.authorization.start(target.app);
    res.cookie(loginCookie, next.binding, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: COGNITO_CALLBACK_PATH,
      maxAge: LOGIN_ATTEMPT_TTL_MS,
    });
    res.redirect(303, next.url);
  }

  @Get('callback')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  async callback(@Req() req: Request, @Res() res: Response) {
    const target = this.config.resolveApp(req);
    const secure = isSecureCookieRequest(req, target.secure);
    res.clearCookie(loginCookie, {
      path: COGNITO_CALLBACK_PATH,
      secure,
      sameSite: 'lax',
      httpOnly: true,
    });
    try {
      if (req.query.error !== undefined) {
        throw new Error('Provider returned authorization error.');
      }
      const binding = extractCookieValues(req, loginCookie).at(-1);
      const identity = await this.authorization.exchange(
        req.query.state,
        req.query.code,
        binding,
        target.app,
      );
      const session = await this.sessions.create(identity, {
        app: target.app,
        requireSuperAdmin: target.app === 'superadmin',
      });
      const { user } = session;
      if (user.tenantId) {
        await this.audit
          .emitAuth({
            actionType: 'LOGIN',
            userId: user.userId,
            tenantId: user.tenantId,
            entityType: 'User',
            entityId: user.userId,
            metadata: { provider: 'cognito', app: target.app },
          })
          .catch(() => {});
      }
      setCognitoCookies(res, secure, session, req);
      const login = new URL(target.signOutUri);
      login.searchParams.set('cognito', 'complete');
      res.redirect(303, login.href);
    } catch (error: unknown) {
      this.logger.warn('Cognito callback failed.');
      const login = new URL(target.signOutUri);
      login.searchParams.set('cognito', 'failed');
      const reason = failureReason(
        error,
        req.query.error,
        req.query.error_description,
      );
      if (reason) login.searchParams.set('reason', reason);
      res.redirect(303, login.href);
    }
  }
}
