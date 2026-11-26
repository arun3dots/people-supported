import { ConflictException, NotFoundException } from '@nestjs/common';
import { prisma, type PrismaTransactionClient } from '@repo/db';
import { clearedCredentials } from '../cognito-identity';
import { ManagedCognitoDirectory } from './managed-cognito-directory';
import { lockManagedAccount } from './managed-account-verification';

async function currentAccount(
  tx: PrismaTransactionClient,
  userId: string,
  poolId: string,
) {
  const current = await tx.cognitoProvisioning.findUnique({
    where: { userId, poolId },
    select: {
      email: true,
      verifiedAt: true,
      phase: true,
      providerUsername: true,
      accessRequested: true,
      lastActionAt: true,
      user: {
        select: {
          id: true,
          email: true,
          cognitoSub: true,
          fullName: true,
          isActive: true,
          deletedAt: true,
          authMode: true,
          tenant: { select: { status: true, deletedAt: true } },
        },
      },
    },
  });
  if (
    !current ||
    current.user.authMode !== 'Cognito' ||
    current.user.deletedAt ||
    current.user.email !== current.email ||
    current.user.tenant?.status !== 'Active' ||
    current.user.tenant.deletedAt
  ) {
    throw new NotFoundException('Managed account is unavailable.');
  }
  return {
    ...current,
    identity: {
      id: current.user.id,
      email: current.email,
      subject: current.user.cognitoSub,
      providerUsername: current.providerUsername,
    },
  };
}

function failureCode(error: unknown, fallback: string) {
  return error instanceof ConflictException ||
    (error instanceof Error && Reflect.get(error, 'code') === 'P2002')
    ? 'IDENTITY_CONFLICT'
    : fallback;
}

export async function linkManagedIdentity(
  directory: ManagedCognitoDirectory,
  userId: string,
) {
  const { poolId } = directory.requireSettings();
  try {
    await prisma.$transaction(
      async (tx) => {
        await lockManagedAccount(tx, userId);
        const current = await currentAccount(tx, userId, poolId);
        if (current.phase !== 'ProvisionIdentity') return;
        if (!current.verifiedAt || !current.accessRequested)
          throw new ConflictException('Account is not ready for provisioning.');
        const remote = await directory.ensureIdentity(
          current.identity,
          current.user.fullName,
        );
        const update = await tx.user.updateMany({
          where: {
            id: userId,
            authMode: 'Cognito',
            email: current.email,
            deletedAt: null,
            cognitoSub: current.user.cognitoSub,
          },
          data: {
            cognitoSub: remote.subject,
            emailVerified: true,
            isActive: true,
          },
        });
        if (update.count !== 1)
          throw new ConflictException('Account changed during provisioning.');
        await tx.cognitoProvisioning.update({
          where: { userId },
          data: {
            providerUsername: remote.username,
            phase: 'Invite',
            lastActionAt: null,
            lastError: null,
          },
        });
      },
      { timeout: 17_000 },
    );
  } catch (error) {
    if (error instanceof NotFoundException) throw error;
    await prisma.cognitoProvisioning.updateMany({
      where: { userId, poolId, phase: 'ProvisionIdentity' },
      data: { lastError: failureCode(error, 'IDENTITY_PROVISIONING_FAILED') },
    });
    return false;
  }
  return true;
}

export async function sendManagedInvitation(
  directory: ManagedCognitoDirectory,
  userId: string,
  resend: boolean,
) {
  const { poolId } = directory.requireSettings();
  const startedAt = new Date();
  const identity = await prisma.$transaction(async (tx) => {
    await lockManagedAccount(tx, userId);
    const current = await currentAccount(tx, userId, poolId);
    if (
      !current.user.isActive ||
      !current.accessRequested ||
      !current.verifiedAt ||
      !(current.phase === 'Invite' || (resend && current.phase === 'Invited'))
    ) {
      throw new ConflictException('Account is not eligible for an invitation.');
    }
    if (
      current.lastActionAt &&
      startedAt.getTime() - current.lastActionAt.getTime() < 60_000
    ) {
      if (!resend) return null;
      throw new ConflictException('Wait before resending this invitation.');
    }
    await tx.cognitoProvisioning.update({
      where: { userId },
      data: {
        invitationDelivery: 'Sending',
        lastActionAt: startedAt,
        lastError: null,
      },
    });
    return current.identity;
  });
  if (!identity) return;

  let errorCode: string | null = null;
  try {
    // Hold the row through the provider call to avoid out-of-order disable/enable operations.
    await prisma.$transaction(
      async (tx) => {
        await lockManagedAccount(tx, userId);
        const current = await currentAccount(tx, userId, poolId);
        if (
          !current.user.isActive ||
          !current.accessRequested ||
          current.lastActionAt?.getTime() !== startedAt.getTime()
        ) {
          throw new ConflictException('The invitation was superseded.');
        }
        await directory.operate(identity, 'invite');
      },
      { timeout: 14_000 },
    );
  } catch (error) {
    errorCode = failureCode(error, 'INVITATION_DELIVERY_FAILED');
  }
  await prisma.cognitoProvisioning.updateMany({
    where: {
      userId,
      poolId,
      lastActionAt: startedAt,
      phase: { in: ['Invite', 'Invited'] },
      invitationDelivery: 'Sending',
    },
    data: {
      ...(errorCode ? {} : { phase: 'Invited' }),
      invitationDelivery: errorCode ? 'Failed' : 'Sent',
      lastError: errorCode,
    },
  });
}

export async function updateManagedAccess(
  directory: ManagedCognitoDirectory,
  userId: string,
  action: 'disable' | 'enable' | 'reset-password',
) {
  const { poolId, issuer } = directory.requireSettings();
  if (action === 'disable') {
    await prisma.$transaction(async (tx) => {
      await lockManagedAccount(tx, userId);
      const current = await currentAccount(tx, userId, poolId);
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
      await revokeManagedAccess(tx, userId, issuer, current.identity.subject);
      await tx.cognitoProvisioning.update({
        where: { userId },
        data: {
          accessRequested: false,
          lastError: current.identity.subject
            ? 'PROVIDER_ACTION_PENDING'
            : null,
        },
      });
    });
  }
  await prisma.$transaction(
    async (tx) => {
      await lockManagedAccount(tx, userId);
      const current = await currentAccount(tx, userId, poolId);
      if (action === 'disable' && current.accessRequested) return;
      if (
        action === 'reset-password' &&
        (!current.user.isActive ||
          !current.accessRequested ||
          current.phase !== 'Activated')
      ) {
        throw new ConflictException(
          'Password recovery is available after the first sign-in.',
        );
      }
      if (action === 'reset-password')
        await revokeManagedAccess(tx, userId, issuer, current.identity.subject);
      let lastError: string | null = null;
      if (current.identity.subject) {
        try {
          await directory.operate(current.identity, action);
        } catch (error) {
          lastError = failureCode(error, 'PROVIDER_ACTION_FAILED');
        }
      }
      if (action === 'enable' && !lastError) {
        await tx.user.update({
          where: { id: userId },
          data: { isActive: Boolean(current.identity.subject) },
        });
      }
      await tx.cognitoProvisioning.update({
        where: { userId },
        data: {
          lastError,
          ...(action === 'enable' && !lastError
            ? { accessRequested: true }
            : {}),
        },
      });
    },
    { timeout: 16_000 },
  );
}

async function revokeManagedAccess(
  tx: PrismaTransactionClient,
  userId: string,
  issuer: string,
  subject: string | null,
) {
  const now = new Date();
  if (subject) {
    await tx.$executeRaw`INSERT INTO "CognitoRevocation" ("issuer", "subject", "revokedBefore")
      VALUES (${issuer}, ${subject}, ${now})
      ON CONFLICT ("issuer", "subject") DO UPDATE SET "revokedBefore" =
      GREATEST("CognitoRevocation"."revokedBefore", EXCLUDED."revokedBefore")`;
  }
  await tx.cognitoSession.updateMany({
    where: { userId, revokedAt: null },
    data: { ...clearedCredentials, revokedAt: now },
  });
}
