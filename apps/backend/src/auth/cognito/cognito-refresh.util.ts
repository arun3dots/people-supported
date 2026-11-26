import { UnauthorizedException } from '@nestjs/common';
import { prisma } from '@repo/db';
import type { AccessClient } from '../../auth-access/integration/access-client';
import type { CognitoAppTarget, CognitoSettings } from './cognito-config';
import {
  REFRESH_RETRY_WINDOW_MS,
  equalHash,
  issueRefresh,
  lockCognitoSession,
  parseVerifiedCredentials,
  readCognitoSessionIdentity,
  revokeCognitoSessionLocked,
  sealCredentials,
  sessionId,
} from './cognito-credentials.util';
import { type CognitoProvider, digest } from './cognito-provider.service';

export function rotateCognitoSession(
  browserRefresh: string,
  settings: CognitoSettings,
  target: CognitoAppTarget,
  provider: CognitoProvider,
  access?: AccessClient,
) {
  const hash = digest(browserRefresh);
  return prisma.$transaction(
    async (tx) => {
      const session = await lockCognitoSession(
        tx,
        sessionId(browserRefresh),
        settings.issuer,
      );
      const creds = parseVerifiedCredentials(session, target.app);
      const user = await readCognitoSessionIdentity(
        tx,
        session,
        settings,
        creds.mfaVerified,
      );
      const current = equalHash(hash, session.refreshHash);
      if (!current && !equalHash(hash, session.previousRefreshHash)) {
        throw new UnauthorizedException('Invalid session credential.');
      }
      if (access && !(await access.recheck(user, session))) {
        await revokeCognitoSessionLocked(tx, session.id);
        return null;
      }
      if (!current) {
        if (
          session.previousValidUntil &&
          session.previousValidUntil > new Date()
        ) {
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

      const next = await provider
        .refresh(creds.providerRefresh, session.subject, target)
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
}
