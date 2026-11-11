import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import type { RolePermissions } from '@repo/schema';
import { AuthenticatedUser } from '../../common/interfaces/request.interface';
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
    super({
      // D-03 & E-04: Never extract JWT from URL query parameters (?token=),
      // as tokens in URLs leak via server logs, browser history, and Referer headers.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (request?.cookies?.access_token as string | undefined) ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: assertJwtSecretConfigured(),
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
