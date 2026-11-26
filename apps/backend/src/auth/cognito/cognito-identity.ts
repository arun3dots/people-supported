import { UnauthorizedException } from '@nestjs/common';
import { prisma, type Prisma, type PrismaTransactionClient } from '@repo/db';
import { EMPTY_ROLE_PERMISSIONS, rolePermissionsSchema } from '@repo/schema';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';
import { CognitoMfaAssuranceException } from './cognito-mfa.util';
import type { CognitoSettings } from './cognito-config';

export type CognitoEligibility = Pick<
  CognitoSettings,
  'pilotIds' | 'poolId' | 'managedUsersEnabled'
>;

export type IdentityDb = Pick<
  PrismaTransactionClient,
  'user' | 'cognitoRevocation'
>;

export const clearedCredentials = {
  sealedCredentials: null,
  previousRefreshHash: null,
  previousValidUntil: null,
};

const selection = {
  id: true,
  cognitoSub: true,
  authMode: true,
  cognitoProvisioning: {
    select: {
      poolId: true,
      email: true,
      providerUsername: true,
      accessRequested: true,
      verifiedAt: true,
    },
  },
  tenantId: true,
  email: true,
  fullName: true,
  isActive: true,
  deletedAt: true,
  lockedUntil: true,
  emailVerified: true,
  role: {
    select: { name: true, permissions: true, tenantId: true, deletedAt: true },
  },
  tenant: { select: { status: true, deletedAt: true } },
  branches: {
    orderBy: [{ isPrimary: 'desc' }, { branchId: 'asc' }],
    select: {
      branchId: true,
      branch: { select: { tenantId: true, status: true, deletedAt: true } },
    },
  },
} satisfies Prisma.UserSelect;

type LinkedUser = NonNullable<Awaited<ReturnType<typeof findLinkedUser>>>;

export function findLinkedUser(subject: string) {
  return prisma.user.findUnique({
    where: { cognitoSub: subject },
    select: selection,
  });
}

export function findSessionUser(
  db: IdentityDb,
  userId: string,
  tenantId: string | null,
  subject: string,
) {
  return db.user.findUnique({
    where: { id: userId, tenantId, cognitoSub: subject },
    select: selection,
  });
}

export class CognitoDisabledIdentityException extends UnauthorizedException {
  constructor() {
    super('Local identity is unavailable.');
  }
}

export function resolveIdentity(
  user: LinkedUser | null,
  settings: CognitoEligibility,
  activeBranchId?: string | null,
  mfaVerified = false,
): AuthenticatedUser {
  const provisioned = user?.cognitoProvisioning;
  const eligible =
    user?.authMode === 'Cognito'
      ? settings.managedUsersEnabled &&
        provisioned?.poolId === settings.poolId &&
        provisioned.accessRequested &&
        provisioned.email === user.email &&
        Boolean(provisioned.providerUsername && provisioned.verifiedAt)
      : Boolean(user && settings.pilotIds.has(user.id));
  if (!user || !eligible) {
    throw new UnauthorizedException('Local identity is unavailable.');
  }
  if (mfaVerified !== true) {
    throw new CognitoMfaAssuranceException();
  }
  if (
    !user.isActive ||
    user.deletedAt ||
    (user.lockedUntil && user.lockedUntil > new Date()) ||
    user.role.deletedAt ||
    (user.role.tenantId !== null && user.role.tenantId !== user.tenantId) ||
    (user.tenantId === null && user.role.name !== 'SuperAdmin') ||
    (user.tenantId !== null &&
      (user.role.name === 'SuperAdmin' ||
        !user.emailVerified ||
        !user.tenant ||
        user.tenant.deletedAt ||
        user.tenant.status !== 'Active'))
  ) {
    throw new CognitoDisabledIdentityException();
  }

  const branchIds = user.branches
    .filter(
      ({ branch }) =>
        branch.tenantId === user.tenantId &&
        branch.status === 'Active' &&
        !branch.deletedAt,
    )
    .map(({ branchId }) => branchId);
  if (
    (activeBranchId && !branchIds.includes(activeBranchId)) ||
    (user.branches.length > 0 && branchIds.length === 0)
  ) {
    throw new UnauthorizedException('Assigned branch is unavailable.');
  }
  const permissions = rolePermissionsSchema.safeParse(user.role.permissions);
  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    roleName: user.role.name,
    tenantId: user.tenantId ?? undefined,
    mfaVerified,
    branchIds,
    activeBranchId: activeBranchId ?? branchIds[0],
    permissions: permissions.success
      ? permissions.data
      : EMPTY_ROLE_PERMISSIONS,
  };
}

export async function assertNotGloballyRevoked(
  db: IdentityDb,
  issuer: string,
  subject: string,
  authenticatedAt: Date,
) {
  const revocation = await db.cognitoRevocation.findUnique({
    where: { issuer_subject: { issuer, subject } },
  });
  if (revocation && authenticatedAt <= revocation.revokedBefore) {
    throw new UnauthorizedException('Cognito session revoked.');
  }
}

export async function recordGlobalRevocation(
  issuer: string,
  subject: string,
  revokedBefore: Date,
) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "CognitoRevocation" ("issuer", "subject", "revokedBefore")
      VALUES (${issuer}, ${subject}, ${revokedBefore})
      ON CONFLICT ("issuer", "subject") DO UPDATE SET "revokedBefore" =
        GREATEST("CognitoRevocation"."revokedBefore", EXCLUDED."revokedBefore")
    `;
    await tx.cognitoSession.updateMany({
      where: {
        issuer,
        subject,
        authenticatedAt: { lte: revokedBefore },
        revokedAt: null,
      },
      data: { ...clearedCredentials, revokedAt: new Date() },
    });
  });
}
