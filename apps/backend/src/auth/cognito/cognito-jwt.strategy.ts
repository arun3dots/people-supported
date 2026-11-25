import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { z } from '@repo/schema';
import { extractVerifiedJwtByAlg } from '../auth-cookie.util';
import {
  CognitoConfig,
  COGNITO_APP_AUDIENCE,
  COGNITO_APP_ISSUER,
  isLoopbackHost,
  resolveAppForRequest,
  type CognitoAppKey,
} from './cognito-config';
import { CognitoSessions } from './cognito-sessions.service';

const appClaims = z.object({
  sub: z.string().uuid(),
  sid: z.string().uuid(),
  exp: z.number().int(),
  mfaVerified: z.literal(true),
  app: z.enum(['web', 'superadmin']).optional(),
});
const requestSessions = new WeakMap<Request, string>();

export const cognitoRequestSession = (request: Request) =>
  requestSessions.get(request);

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(
  Strategy,
  'cognito-session',
) {
  constructor(
    private readonly config: CognitoConfig,
    private readonly sessions: CognitoSessions,
  ) {
    super({
      jwtFromRequest: (request: Request) => {
        if (!config.settings) return null;
        return extractVerifiedJwtByAlg(
          request,
          'access_token',
          'RS256',
          config.settings.publicKey,
        );
      },
      secretOrKeyProvider: (_request, _jwt, done) => {
        if (!config.settings) return done(new UnauthorizedException());
        done(null, config.settings.publicKey);
      },
      issuer: COGNITO_APP_ISSUER,
      audience: COGNITO_APP_AUDIENCE,
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: unknown) {
    const claims = appClaims.safeParse(payload);
    if (!claims.success) throw new UnauthorizedException();
    const settings = this.config.require();
    const rawHost = request.get('host')?.split(',')[0]?.trim().toLowerCase();
    let expectedApp: CognitoAppKey | undefined;
    if (rawHost && !isLoopbackHost(rawHost)) {
      expectedApp = resolveAppForRequest(settings, {
        get: (name: string) => request.get(name),
        query: {},
      }).app;
    } else if (claims.data.app) {
      expectedApp = claims.data.app;
    }
    if (claims.data.app && expectedApp && claims.data.app !== expectedApp) {
      throw new ForbiddenException(
        'Session does not belong to this application.',
      );
    }
    const user = await this.sessions.authenticate(
      claims.data.sid,
      claims.data.sub,
      expectedApp,
    );
    requestSessions.set(request, claims.data.sid);
    return user;
  }
}
