import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { rawPrisma } from '@repo/db';
import * as crypto from 'crypto';

/** Duration in days before a refresh token expires */
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_REUSE_GRACE_MS = 5000;
const MFA_VERIFIED_FAMILY_PREFIX = 'mfa-verified:';
const MFA_PENDING_FAMILY_PREFIX = 'mfa-pending:';

function getFamilyMfaState(family: string): boolean | null {
  if (family.startsWith(MFA_PENDING_FAMILY_PREFIX)) return false;
  if (family.startsWith(MFA_VERIFIED_FAMILY_PREFIX)) return true;
  return null;
}

@Injectable()
export class RefreshTokenService {
  private async rejectRefreshConflict(
    tokenFamily: string,
    now: Date,
  ): Promise<never> {
    const activeSuccessor = await rawPrisma.refreshToken.findFirst({
      where: {
        family: tokenFamily,
        isRevoked: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (!activeSuccessor) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const successorAgeMs = now.getTime() - activeSuccessor.createdAt.getTime();
    if (successorAgeMs >= REFRESH_TOKEN_REUSE_GRACE_MS) {
      await rawPrisma.refreshToken.updateMany({
        where: { family: tokenFamily, isRevoked: false },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException(
        'Refresh token reuse detected; session invalidated',
      );
    }

    // A just-created successor can indicate simultaneous refreshes in separate
    // tabs. Give the client time to retry with the updated HttpOnly cookie.
    throw new ConflictException(
      'Refresh token was already rotated; retry with the latest cookie',
    );
  }

  async createRefreshToken(
    userId: string,
    family?: string,
    activeBranchId?: string | null,
    mfaVerified = true,
  ): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const tokenFamily =
      family ??
      (mfaVerified ? MFA_VERIFIED_FAMILY_PREFIX : MFA_PENDING_FAMILY_PREFIX) +
        crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await rawPrisma.refreshToken.create({
      data: {
        token,
        userId,
        family: tokenFamily,
        activeBranchId: activeBranchId ?? null,
        expiresAt,
      },
    });

    return token;
  }

  async rotateRefreshToken(oldToken: string): Promise<{
    newToken: string;
    userId: string;
    activeBranchId: string | null;
    mfaVerified: boolean | null;
  }> {
    const existingToken = await rawPrisma.refreshToken.findUnique({
      where: { token: oldToken },
    });

    if (!existingToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const now = new Date();
    if (existingToken.isRevoked) {
      await this.rejectRefreshConflict(existingToken.family, now);
    }

    if (existingToken.expiresAt <= now) {
      await rawPrisma.refreshToken.updateMany({
        where: { id: existingToken.id, isRevoked: false },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    const newToken = crypto.randomBytes(40).toString('hex');
    const newExpiresAt = new Date(now);
    newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // The conditional update makes one concurrent request the winner. Creating
    // its successor in the same transaction prevents a revoked token with no
    // replacement if token creation fails.
    const rotated = await rawPrisma.$transaction(async (tx) => {
      const claim = await tx.refreshToken.updateMany({
        where: {
          id: existingToken.id,
          isRevoked: false,
          expiresAt: { gt: now },
        },
        data: { isRevoked: true },
      });

      if (claim.count !== 1) return false;

      await tx.refreshToken.create({
        data: {
          token: newToken,
          userId: existingToken.userId,
          family: existingToken.family,
          activeBranchId: existingToken.activeBranchId,
          expiresAt: newExpiresAt,
        },
      });
      return true;
    });

    if (!rotated) {
      await this.rejectRefreshConflict(existingToken.family, now);
    }

    return {
      newToken,
      userId: existingToken.userId,
      activeBranchId: existingToken.activeBranchId,
      mfaVerified: getFamilyMfaState(existingToken.family),
    };
  }

  async updateActiveBranch(token: string, branchId: string): Promise<void> {
    const existingToken = await rawPrisma.refreshToken.findUnique({
      where: { token },
    });

    if (!existingToken || existingToken.isRevoked) {
      throw new UnauthorizedException('Refresh token not found');
    }
    if (existingToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await rawPrisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { activeBranchId: branchId },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await rawPrisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await rawPrisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isRevoked: true,
            createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
    });
    return result.count;
  }
}
