import { prisma } from '@repo/db';
import { SafeUser } from './auth.service';

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

export const ACCESS_COOKIE_OPTIONS = (isProduction: boolean) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
  domain: COOKIE_DOMAIN,
  maxAge: 15 * 60 * 1000,
});

export const REFRESH_COOKIE_OPTIONS = (isProduction: boolean) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/api/auth',
  domain: COOKIE_DOMAIN,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export function formatAuthUser(user: SafeUser, mfaVerified: boolean) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleName: user.role?.name || 'Carer',
    tenantId: user.tenantId,
    branchIds: user.branches?.map((b) => b.branchId),
    activeBranchId:
      user.branches?.find((b) => b.isPrimary)?.branchId ??
      user.branches?.[0]?.branchId ??
      null,
    mfaVerified,
    avatarUrl: user.profile?.profilePhotoUrl ?? null,
  };
}

export async function resolveMeUserData(
  userId: string,
  tenantId: string | null | undefined,
  defaultRoleName: string,
) {
  if (!tenantId) {
    const superAdmin = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profile: { select: { profilePhotoUrl: true } },
        role: { select: { name: true } },
      },
    });
    return {
      roleName: superAdmin?.role?.name ?? defaultRoleName,
      subscriptionStatus: 'active',
      emailVerified: true,
      avatarUrl: superAdmin?.profile?.profilePhotoUrl ?? null,
      paymentUrl: undefined,
      organizationName: null,
      organizationContactName: null,
    };
  }

  const [tenant, user] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionStatus: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        profile: { select: { profilePhotoUrl: true } },
        role: { select: { name: true } },
      },
    }),
  ]);

  const subscriptionStatus = tenant?.subscriptionStatus ?? 'active';
  const emailVerified = user?.emailVerified ?? true;

  let paymentUrl: string | undefined;
  if (subscriptionStatus !== 'active') {
    const latest = await prisma.payment.findFirst({
      where: { tenantId, status: 'created' },
      orderBy: { createdAt: 'desc' },
      select: { shortUrl: true },
    });
    paymentUrl = latest?.shortUrl ?? undefined;
  }

  return {
    roleName: user?.role?.name ?? defaultRoleName,
    subscriptionStatus,
    paymentUrl,
    emailVerified,
    avatarUrl: user?.profile?.profilePhotoUrl ?? null,
  };
}
