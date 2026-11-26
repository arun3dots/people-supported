import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  prisma,
  type CognitoSession,
  type Prisma,
  type PrismaTransactionClient,
} from '@repo/db';
import { z } from '@repo/schema';
import { timingSafeEqual } from 'node:crypto';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';
import { ACCESS_TOKEN_MAX_AGE_MS } from '../auth.constants';
import { newSecret, seal, unseal } from './cognito-authorization.service';
import {
  COGNITO_APP_AUDIENCE,
  COGNITO_APP_ISSUER,
  type CognitoAppKey,
} from './cognito-config';
import {
  assertNotGloballyRevoked,
  clearedCredentials,
  findSessionUser,
  resolveIdentity,
  type CognitoEligibility,
} from './cognito-identity';
import { CognitoMfaAssuranceException } from './cognito-mfa.util';

export const REFRESH_TOKEN_PATTERN =
  /^slc1\.([a-f0-9-]{36})\.[a-zA-Z0-9_-]{43}$/;
export const COGNITO_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_RETRY_WINDOW_MS = 10_000;

export function persistCognitoSession(
  data: Prisma.CognitoSessionUncheckedCreateInput,
  managed: boolean,
) {
  if (!managed) return prisma.cognitoSession.create({ data });
  return prisma.$transaction(async (tx) => {
    const session = await tx.cognitoSession.create({ data });
    await tx.cognitoProvisioning.updateMany({
      where: { userId: data.userId, activatedAt: null },
      data: {
        activatedAt: new Date(),
        phase: 'Activated',
        invitationDelivery: 'Sent',
        lastError: null,
      },
    });
    return session;
  });
}

const credentialsSchema = z.object({
  providerRefresh: z.string().min(1),
  browserRefresh: z.string().regex(REFRESH_TOKEN_PATTERN),
  app: z.enum(['web', 'superadmin']).default('web'),
  mfaVerified: z.boolean().default(false),
});

export type CognitoSessionCredentials = {
  providerRefresh: string;
  browserRefresh: string;
  app: CognitoAppKey;
  mfaVerified: boolean;
};

export const isCognitoRefresh = (token: unknown): token is string =>
  typeof token === 'string' && token.startsWith('slc1.');

export const issueRefresh = (id: string): string => `slc1.${id}.${newSecret()}`;

export const equalHash = (a: string, b: string | null): boolean =>
  b !== null &&
  a.length === b.length &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function sessionId(token: string): string {
  const id = token.match(REFRESH_TOKEN_PATTERN)?.[1];
  if (!id) throw new UnauthorizedException('Invalid session credential.');
  return id;
}

export function parseCredentials(
  session: CognitoSession,
): CognitoSessionCredentials {
  try {
    return credentialsSchema.parse(
      JSON.parse(unseal(session.sealedCredentials)) as unknown,
    );
  } catch {
    throw new UnauthorizedException('Session credentials unavailable.');
  }
}

export function sealCredentials(creds: CognitoSessionCredentials): string {
  return seal(JSON.stringify(creds));
}

export function parseVerifiedCredentials(
  session: CognitoSession,
  expectedApp?: CognitoAppKey,
): CognitoSessionCredentials {
  const creds = parseCredentials(session);
  if (creds.mfaVerified !== true) {
    throw new CognitoMfaAssuranceException();
  }
  if (expectedApp && creds.app !== expectedApp) {
    throw new ForbiddenException(
      'Session does not belong to this application.',
    );
  }
  return creds;
}

export async function lockCognitoSession(
  tx: PrismaTransactionClient,
  id: string,
  issuer: string,
): Promise<CognitoSession> {
  await tx.$queryRaw`SELECT "id" FROM "CognitoSession" WHERE "id" = ${id} AND "issuer" = ${issuer} FOR UPDATE`;
  const session = await tx.cognitoSession.findUnique({
    where: { id, issuer },
  });
  if (!session) {
    throw new UnauthorizedException('Cognito session is unavailable.');
  }
  return session;
}

export function revokeCognitoSessionLocked(
  tx: PrismaTransactionClient,
  id: string,
) {
  return tx.cognitoSession.update({
    where: { id },
    data: { ...clearedCredentials, revokedAt: new Date() },
  });
}

export async function readCognitoSessionIdentity(
  db: PrismaTransactionClient,
  session: CognitoSession | null,
  eligibility: CognitoEligibility,
  mfaVerified: boolean,
) {
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new UnauthorizedException('Cognito session is unavailable.');
  }
  await assertNotGloballyRevoked(
    db,
    session.issuer,
    session.subject,
    session.authenticatedAt,
  );
  const user = await findSessionUser(
    db,
    session.userId,
    session.tenantId,
    session.subject,
  );
  return resolveIdentity(
    user,
    eligibility,
    session.activeBranchId,
    mfaVerified,
  );
}

export function signCognitoAccessToken(
  jwt: JwtService,
  privateKey: string,
  session: CognitoSession,
  { userId, ...user }: AuthenticatedUser,
  app: CognitoAppKey,
) {
  const ttl = Math.floor(
    Math.min(
      ACCESS_TOKEN_MAX_AGE_MS,
      session.expiresAt.getTime() - Date.now(),
    ) / 1000,
  );
  if (ttl < 1) throw new UnauthorizedException('Cognito session expired.');
  return jwt.signAsync(
    { ...user, sid: session.id, app },
    {
      privateKey,
      algorithm: 'RS256',
      issuer: COGNITO_APP_ISSUER,
      audience: COGNITO_APP_AUDIENCE,
      subject: userId,
      expiresIn: ttl,
    },
  );
}
