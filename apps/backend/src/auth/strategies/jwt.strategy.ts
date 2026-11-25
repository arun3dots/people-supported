import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import type { RolePermissions } from '@repo/schema';
import { AuthenticatedUser } from '../../common/interfaces/request.interface';
import { extractVerifiedJwtByAlg } from '../auth-cookie.util';
import { hasRs256AccessCookie } from '../auth-origin.util';
import { assertJwtSecretConfigured } from '../jwt-secret.util';

interface JwtPayload {
  sub: string;
  email: string;
  fullName?: string;
  roleName: string;
  tenantId?: string;
  mfaVerified?: boolean;
  branchIds?: string[];
  activeBranchId?: string;
  permissions?: RolePermissions;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = assertJwtSecretConfigured();
    super({
      // D-03 & E-04: Never extract JWT from URL query parameters (?token=),
      // as tokens in URLs leak via server logs, browser history, and Referer headers.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          if (
            process.env.COGNITO_AUTH_ENABLED === 'true' &&
            (process.env.LEGACY_AUTH_ENABLED === 'false' ||
              hasRs256AccessCookie(request))
          ) {
            return null;
          }
          return extractVerifiedJwtByAlg(
            request,
            'access_token',
            'HS256',
            secret,
          );
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      roleName: payload.roleName,
      tenantId: payload.tenantId,
      mfaVerified: Boolean(payload.mfaVerified),
      branchIds: payload.branchIds,
      activeBranchId: payload.activeBranchId,
      permissions: payload.permissions,
    };
  }
}
