import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  prisma,
  type CognitoSession,
  type PrismaTransactionClient,
} from '@repo/db';
import {
  globalIdentityRevocationSchema,
  type GlobalIdentityRevocation,
} from '@repo/schema';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';
import {
  CognitoConfig,
  type CognitoAppKey,
  type CognitoAppTarget,
} from './cognito-config';
import {
  COGNITO_SESSION_TTL_MS,
  REFRESH_RETRY_WINDOW_MS,
  equalHash,
  isCognitoRefresh,
  issueRefresh,
  lockCognitoSession,
  parseCredentials,
  parseVerifiedCredentials,
  persistCognitoSession,
  readCognitoSessionIdentity,
  revokeCognitoSessionLocked,
  sealCredentials,
  sessionId,
  signCognitoAccessToken,
} from './cognito-credentials.util';
import {
  assertNotGloballyRevoked,
  findLinkedUser,
  recordGlobalRevocation,
  resolveIdentity,
} from './cognito-identity';
import { CognitoMfaAssuranceException } from './cognito-mfa.util';
import { CognitoProvider, digest } from './cognito-provider.service';

export { isCognitoRefresh };

@Injectable()
export class CognitoSessions {
  private readonly logger = new Logger(CognitoSessions.name);

  constructor(
    private readonly config: CognitoConfig,
    private readonly provider: CognitoProvider,
    private readonly jwt: JwtService,
  ) {}

  async create(
    identity: {
      subject: string;
      authenticatedAt: Date;
      refreshToken: string;
      mfaVerified: boolean;
    },
    options?: { app?: CognitoAppKey; requireSuperAdmin?: boolean },
  ) {
    if (identity.mfaVerified !== true) {
      throw new CognitoMfaAssuranceException();
    }
    const settings = this.config.require();
    const app: CognitoAppKey =
      options?.app ?? (options?.requireSuperAdmin ? 'superadmin' : 'web');
    const linked = await findLinkedUser(identity.subject);
    const user = resolveIdentity(
      linked,
      settings,
      undefined,
      identity.mfaVerified,
    );
    if (
      (options?.requireSuperAdmin || app === 'superadmin') &&
      (user.roleName !== 'SuperAdmin' || user.tenantId !== undefined)
    ) {
      throw new ForbiddenException('SuperAdmin access required.');
    }
    await assertNotGloballyRevoked(
      prisma,
      settings.issuer,
      identity.subject,
      identity.authenticatedAt,
    );
    const id = randomUUID();
    const browserRefresh = issueRefresh(id);
    const session = await persistCognitoSession(
      {
        id,
        userId: user.userId,
        tenantId: user.tenantId,
        issuer: settings.issuer,
        subject: identity.subject,
        authenticatedAt: identity.authenticatedAt,
        expiresAt: new Date(Date.now() + COGNITO_SESSION_TTL_MS),
        activeBranchId: user.activeBranchId,
        refreshHash: digest(browserRefresh),
        sealedCredentials: sealCredentials({
          browserRefresh,
          providerRefresh: identity.refreshToken,
          app,
          mfaVerified: identity.mfaVerified,
        }),
      },
      linked?.authMode === 'Cognito',
    );
    return this.issue(session, user, browserRefresh, app);
  }

  async authenticate(id: string, userId: string, expectedApp?: CognitoAppKey) {
    const issuer = this.config.require().issuer;
    const session = await prisma.cognitoSession.findUnique({
      where: { id, userId, issuer },
    });
    if (!session) {
      throw new UnauthorizedException('Cognito session is unavailable.');
    }
    const creds = parseVerifiedCredentials(session, expectedApp);
    return readCognitoSessionIdentity(
      prisma,
      session,
      this.config.require(),
      creds.mfaVerified,
    );
  }

  async refresh(browserRefresh: string, target?: CognitoAppTarget) {
    const settings = this.config.require();
    const appTarget = target ?? settings.apps.web;
    const hash = digest(browserRefresh);
    const result = await prisma.$transaction(
      async (tx) => {
        const session = await lockCognitoSession(
          tx,
          sessionId(browserRefresh),
          settings.issuer,
        );
        const creds = parseVerifiedCredentials(session, appTarget.app);
        const user = await readCognitoSessionIdentity(
          tx,
          session,
          settings,
          creds.mfaVerified,
        );
        const now = new Date();
        if (!equalHash(hash, session.refreshHash)) {
          if (!equalHash(hash, session.previousRefreshHash))
            throw new UnauthorizedException('Invalid session credential.');
          if (session.previousValidUntil && session.previousValidUntil > now) {
            return {
              session,
              user,
              browserRefresh: creds.browserRefresh,
              app: creds.app,
            };
          }
          await revokeCognitoSessionLocked(tx, session.id);
          return null;
        }

        const next = await this.provider
          .refresh(creds.providerRefresh, session.subject, appTarget)
          .catch(async (error: unknown) => {
            if (!(error instanceof UnauthorizedException)) throw error;
            await revokeCognitoSessionLocked(tx, session.id);
            return null;
          });
        if (!next || next.mfaVerified !== true) return null;
        const rotated = issueRefresh(session.id);
        const updated = await tx.cognitoSession.update({
          where: { id: session.id },
          data: {
            refreshHash: digest(rotated),
            previousRefreshHash: session.refreshHash,
            previousValidUntil: new Date(Date.now() + REFRESH_RETRY_WINDOW_MS),
            sealedCredentials: sealCredentials({
              browserRefresh: rotated,
              providerRefresh: next.refreshToken,
              app: creds.app,
              mfaVerified: next.mfaVerified,
            }),
          },
        });
        return {
          session: updated,
          user,
          browserRefresh: rotated,
          app: creds.app,
        };
      },
      { timeout: 20_000 },
    );
    if (!result)
      throw new UnauthorizedException('Session credential has been revoked.');
    return this.issue(
      result.session,
      result.user,
      result.browserRefresh,
      result.app,
    );
  }

  async switchBranch(
    id: string,
    userId: string,
    branchId: string,
    expectedApp?: CognitoAppKey,
  ) {
    const issuer = this.config.require().issuer;
    const result = await prisma.$transaction(async (tx) => {
      const session = await lockCognitoSession(tx, id, issuer);
      if (session.userId !== userId) throw new UnauthorizedException();
      const creds = parseVerifiedCredentials(session, expectedApp);
      const user = await readCognitoSessionIdentity(
        tx,
        session,
        this.config.require(),
        creds.mfaVerified,
      );
      if (!user.branchIds?.includes(branchId))
        throw new UnauthorizedException('Branch access denied.');
      const updated = await tx.cognitoSession.update({
        where: { id, userId },
        data: { activeBranchId: branchId },
      });
      return {
        updated,
        user: { ...user, activeBranchId: branchId },
        app: creds.app,
      };
    });
    return {
      accessToken: await signCognitoAccessToken(
        this.jwt,
        this.config.require().privateKey,
        result.updated,
        result.user,
        result.app,
      ),
      activeBranchId: branchId,
    };
  }

  async logout(browserRefresh: string, target?: CognitoAppTarget) {
    const settings = this.config.require();
    const appTarget = target ?? settings.apps.web;
    const hash = digest(browserRefresh);
    const logout = await prisma.$transaction(async (tx) => {
      const session = await lockCognitoSession(
        tx,
        sessionId(browserRefresh),
        settings.issuer,
      );
      if (
        session.revokedAt ||
        (!equalHash(hash, session.refreshHash) &&
          !(
            session.previousValidUntil &&
            session.previousValidUntil > new Date() &&
            equalHash(hash, session.previousRefreshHash)
          ))
      ) {
        throw new UnauthorizedException('Invalid session credential.');
      }
      let providerRefresh: string | undefined;
      try {
        const creds = parseCredentials(session);
        if (creds.app !== appTarget.app) {
          throw new ForbiddenException(
            'Session does not belong to this application.',
          );
        }
        providerRefresh = creds.providerRefresh;
      } catch (error: unknown) {
        if (error instanceof ForbiddenException) throw error;
        this.logger.warn(
          'Local Cognito session revoked with no usable provider credential.',
        );
      }
      await revokeCognitoSessionLocked(tx, session.id);
      return {
        providerRefresh,
        userId: session.userId,
        tenantId: session.tenantId,
      };
    });
    if (logout.providerRefresh) {
      try {
        await this.provider.revoke(logout.providerRefresh, appTarget);
      } catch {
        this.logger.warn(
          'Local Cognito session revoked. Provider revocation failed.',
        );
      }
    }
    return {
      signOutUrl: this.provider.logoutUrl(appTarget),
      userId: logout.userId,
      tenantId: logout.tenantId,
    };
  }

  /** Called by a future authenticated service-to-service revocation consumer. */
  async applyGlobalRevocation(message: GlobalIdentityRevocation) {
    const event = globalIdentityRevocationSchema.parse(message);
    if (event.issuer !== this.config.require().issuer)
      throw new UnauthorizedException('Unrecognized identity issuer.');
    return recordGlobalRevocation(
      event.issuer,
      event.subject,
      new Date(event.revokedBefore),
    );
  }

  private async issue(
    session: CognitoSession,
    user: AuthenticatedUser,
    refreshToken: string,
    app: CognitoAppKey,
  ) {
    return {
      accessToken: await signCognitoAccessToken(
        this.jwt,
        this.config.require().privateKey,
        session,
        user,
        app,
      ),
      refreshToken,
      expiresAt: session.expiresAt,
      user,
    };
  }
}
