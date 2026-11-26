import { ConflictException } from '@nestjs/common';
import { prisma, type Prisma } from '@repo/db';
import type {
  CreateManagedAccountDTO,
  ManagedAccountStatusDTO,
} from '@repo/schema';
import type { AuthenticatedUser } from '../../../common/interfaces/request.interface';
import { assertManagedAccountAuthority } from './managed-account-policy';

export const managedAccountSelection = {
  accessRequested: true,
  phase: true,
  verificationDelivery: true,
  invitationDelivery: true,
  lastError: true,
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      roleId: true,
      role: { select: { name: true } },
      tenantId: true,
      deletedAt: true,
      branches: { select: { branchId: true } },
      authMode: true,
    },
  },
  poolId: true,
  email: true,
} satisfies Prisma.CognitoProvisioningSelect;

export function toManagedAccountStatus(
  entry: Prisma.CognitoProvisioningGetPayload<{
    select: typeof managedAccountSelection;
  }>,
): ManagedAccountStatusDTO {
  return {
    userId: entry.user.id,
    email: entry.user.email,
    fullName: entry.user.fullName,
    active: entry.accessRequested,
    phase: entry.phase,
    verificationDelivery: entry.verificationDelivery,
    invitationDelivery: entry.invitationDelivery,
    lastError: entry.lastError,
  };
}

export async function reserveManagedAccount(
  actor: AuthenticatedUser,
  tenantId: string,
  input: CreateManagedAccountDTO,
  poolId: string,
) {
  const email = input.email.trim().toLowerCase();
  return prisma.$transaction(async (tx) => {
    await assertManagedAccountAuthority(
      tx,
      actor,
      tenantId,
      input.roleId,
      input.branchId,
    );
    // Serialize managed reservations by canonical email and by the caller's retry key.
    await tx.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(hashtextextended(${`cantra:managed-email:${email}`}, 0))`;
    await tx.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(hashtextextended(${`cantra:managed-request:${input.requestId}`}, 0))`;
    const existing = await tx.cognitoProvisioning.findUnique({
      where: { requestId: input.requestId },
      select: managedAccountSelection,
    });
    if (existing) {
      const { user } = existing;
      if (
        existing.poolId !== poolId ||
        existing.email !== email ||
        user.deletedAt ||
        user.authMode !== 'Cognito' ||
        user.tenantId !== tenantId ||
        user.email !== email ||
        user.fullName !== input.fullName ||
        user.roleId !== input.roleId ||
        !user.branches.some(({ branchId }) => branchId === input.branchId)
      ) {
        throw new ConflictException(
          'This request identifier is already in use.',
        );
      }
      return toManagedAccountStatus(existing);
    }
    const duplicate = await tx.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (
      duplicate ||
      (await tx.cognitoProvisioning.findUnique({
        where: { email },
        select: { userId: true },
      }))
    ) {
      throw new ConflictException('Email is already registered.');
    }

    const record = await tx.cognitoProvisioning.create({
      data: {
        requestId: input.requestId,
        email,
        poolId,
        user: {
          create: {
            email,
            fullName: input.fullName,
            roleId: input.roleId,
            tenantId,
            authMode: 'Cognito',
            passwordHash: null,
            emailVerified: false,
            isActive: false,
            createdById: actor.userId,
            branches: { create: { branchId: input.branchId, isPrimary: true } },
          },
        },
      },
      select: managedAccountSelection,
    });
    return toManagedAccountStatus(record);
  });
}
