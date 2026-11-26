import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { prisma, type PrismaTransactionClient } from '@repo/db';
import { randomBytes, createHash } from 'node:crypto';
import type { MailService } from '../../../common/mail/mail.service';

const verificationTtlMs = 24 * 60 * 60 * 1_000;
const sendCooldownMs = 60_000;
const tokenHash = (value: string) =>
  createHash('sha256').update(value).digest('base64url');

export function lockManagedAccount(
  tx: PrismaTransactionClient,
  userId: string,
) {
  return tx.$queryRaw`SELECT "userId" FROM "CognitoProvisioning" WHERE "userId" = ${userId} FOR UPDATE`;
}

export async function sendManagedAccountVerification(
  mail: Pick<MailService, 'sendManagedAccountVerification'>,
  userId: string,
  poolId: string,
  webOrigin: string,
) {
  const token = randomBytes(32).toString('base64url');
  const verificationHash = tokenHash(token);
  const recipient = await prisma.$transaction(async (tx) => {
    await lockManagedAccount(tx, userId);
    const current = await tx.cognitoProvisioning.findUnique({
      where: { userId, poolId },
      select: {
        phase: true,
        email: true,
        lastActionAt: true,
        accessRequested: true,
        user: { select: { email: true, deletedAt: true } },
      },
    });
    const now = Date.now();
    if (
      !current ||
      current.phase !== 'VerifyEmail' ||
      current.user.email !== current.email ||
      current.user.deletedAt ||
      !current.accessRequested ||
      (current.lastActionAt &&
        now - current.lastActionAt.getTime() < sendCooldownMs)
    ) {
      throw new ConflictException(
        'This verification message cannot be sent now.',
      );
    }
    await tx.cognitoProvisioning.update({
      where: { userId },
      data: {
        verificationHash,
        verificationExpiresAt: new Date(now + verificationTtlMs),
        verificationDelivery: 'Sending',
        lastActionAt: new Date(now),
        lastError: null,
      },
    });
    return current.user.email;
  });
  const url = new URL('/verify-invitation', webOrigin);
  // The browser posts the secret only after an explicit confirmation action.
  url.hash = new URLSearchParams({ token }).toString();
  let delivery: 'Sent' | 'Failed' = 'Sent';
  try {
    await mail.sendManagedAccountVerification(recipient, url.href);
  } catch {
    delivery = 'Failed';
  }
  await prisma.cognitoProvisioning.updateMany({
    where: { userId, verificationHash, phase: 'VerifyEmail' },
    data: {
      verificationDelivery: delivery,
      lastError: delivery === 'Failed' ? 'VERIFICATION_DELIVERY_FAILED' : null,
    },
  });
  return delivery;
}

export async function verifyManagedAccountMailbox(
  token: string,
  poolId: string,
) {
  const verificationHash = tokenHash(token);
  return prisma.$transaction(async (tx) => {
    const entry = await tx.cognitoProvisioning.findUnique({
      where: { verificationHash, poolId },
      select: { userId: true, email: true },
    });
    if (!entry)
      throw new UnauthorizedException('This invitation is invalid or expired.');
    await lockManagedAccount(tx, entry.userId);
    const result = await tx.cognitoProvisioning.updateMany({
      where: {
        userId: entry.userId,
        poolId,
        verificationHash,
        phase: 'VerifyEmail',
        verificationExpiresAt: { gt: new Date() },
        accessRequested: true,
        user: {
          email: entry.email,
          deletedAt: null,
          tenant: { status: 'Active', deletedAt: null },
        },
      },
      data: {
        phase: 'ProvisionIdentity',
        verifiedAt: new Date(),
        verificationHash: null,
        verificationExpiresAt: null,
        verificationDelivery: 'Sent',
        lastActionAt: null,
        lastError: null,
      },
    });
    if (result.count !== 1)
      throw new UnauthorizedException('This invitation is invalid or expired.');
    return entry.userId;
  });
}
