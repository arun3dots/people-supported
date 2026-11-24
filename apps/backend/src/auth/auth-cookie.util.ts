import type { Request, Response } from 'express';
import { createHmac, createVerify, timingSafeEqual } from 'node:crypto';
import { prisma } from '@repo/db';
import { SafeUser } from './auth.service';
import { ACCESS_TOKEN_MAX_AGE_MS } from './auth.constants';

const IPV4_OR_V6_HOST = /^(?:\d{1,3}(?:\.\d{1,3}){3}|\[?[a-fA-F0-9:]+\]?)$/;

export function isHostOnlyCookieMode(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.COOKIE_HOST_ONLY !== 'false';
}

export function getActiveCookieDomain(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  if (isHostOnlyCookieMode(env)) return undefined;
  const domain = env.COOKIE_DOMAIN?.trim();
  return domain ? domain : undefined;
}

export function isSecureCookieRequest(
  req?: Request,
  explicitSecure?: boolean,
): boolean {
  if (explicitSecure === true) return true;
  if (process.env.NODE_ENV === 'production') return true;
  if (!req) return false;
  if (req.secure) return true;
  const forwarded = req.get('x-forwarded-proto');
  if (!forwarded) return false;
  return forwarded.split(',')[0]?.trim().toLowerCase() === 'https';
}

function normalizeCookieDomain(raw: string): string | null {
  const cleaned = raw.trim().replace(/^\.+/, '').toLowerCase();
  if (!cleaned || !cleaned.includes('.') || IPV4_OR_V6_HOST.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export function getStaleCookieDomains(
  hostname?: string,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const candidates = new Set<string>();
  const add = (raw?: string) => {
    if (!raw) return;
    for (const part of raw.split(',')) {
      const normalized = normalizeCookieDomain(part);
      if (normalized) candidates.add(normalized);
    }
  };
  add(env.LEGACY_COOKIE_DOMAIN);
  if (isHostOnlyCookieMode(env)) add(env.COOKIE_DOMAIN);

  const normalizedHost = hostname?.trim().toLowerCase();
  return [...candidates].filter((domain) => {
    if (!normalizedHost) return true;
    return normalizedHost === domain || normalizedHost.endsWith(`.${domain}`);
  });
}

export const ACCESS_COOKIE_OPTIONS = (
  secure: boolean,
  maxAge = ACCESS_TOKEN_MAX_AGE_MS,
) => {
  const domain = getActiveCookieDomain();
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    path: '/',
    ...(domain ? { domain } : {}),
    maxAge,
  };
};

export const REFRESH_COOKIE_OPTIONS = (
  secure: boolean,
  maxAge = 7 * 24 * 60 * 60 * 1000,
) => {
  const domain = getActiveCookieDomain();
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    path: '/api/auth',
    ...(domain ? { domain } : {}),
    maxAge,
  };
};

function clearTargetsForDomain(
  res: Response,
  secure: boolean,
  domain?: string,
) {
  const base = {
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    ...(domain ? { domain } : {}),
  };
  res.clearCookie('access_token', { ...base, path: '/' });
  res.clearCookie('refresh_token', { ...base, path: '/api/auth' });
  if (domain) {
    res.clearCookie('refresh_token', { ...base, path: '/' });
  }
}

export function clearStaleDomainCookies(
  res: Response,
  req: Request | undefined,
  secure: boolean,
) {
  const host = req?.hostname;
  for (const domain of getStaleCookieDomains(host)) {
    clearTargetsForDomain(res, secure, `.${domain}`);
  }
}

export function clearAuthCookies(
  res: Response,
  req: Request | undefined,
  secure: boolean,
) {
  const activeDomain = getActiveCookieDomain();
  clearTargetsForDomain(res, secure, activeDomain);
  clearStaleDomainCookies(res, req, secure);
}

export function clearRefreshCookie(
  res: Response,
  req: Request | undefined,
  secure: boolean,
) {
  const activeDomain = getActiveCookieDomain();
  const base = { httpOnly: true, secure, sameSite: 'strict' as const };
  res.clearCookie('refresh_token', {
    ...base,
    path: '/api/auth',
    ...(activeDomain ? { domain: activeDomain } : {}),
  });
  for (const domain of getStaleCookieDomains(req?.hostname)) {
    res.clearCookie('refresh_token', {
      ...base,
      path: '/api/auth',
      domain: `.${domain}`,
    });
    res.clearCookie('refresh_token', {
      ...base,
      path: '/',
      domain: `.${domain}`,
    });
  }
}

export function extractCookieValues(req: Request, name: string): string[] {
  const rawHeader = req.headers?.cookie;
  const values: string[] = [];
  if (typeof rawHeader === 'string' && rawHeader.length > 0) {
    for (const part of rawHeader.split(';')) {
      const idx = part.indexOf('=');
      if (idx <= 0) continue;
      if (part.slice(0, idx).trim() !== name) continue;
      const rawVal = part.slice(idx + 1).trim();
      if (!rawVal) continue;
      try {
        values.push(decodeURIComponent(rawVal));
      } catch {
        values.push(rawVal);
      }
    }
  }
  if (values.length === 0 && typeof req.cookies?.[name] === 'string') {
    values.push(req.cookies[name]);
  }
  return values;
}

export function readJwtAlg(token: string): string | null {
  const headerSegment = token.split('.')[0];
  if (!headerSegment || headerSegment.length > 1024) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(headerSegment, 'base64url').toString('utf8'),
    ) as { alg?: unknown };
    return typeof parsed.alg === 'string' ? parsed.alg : null;
  } catch {
    return null;
  }
}

export function extractJwtByAlg(
  req: Request,
  name: string,
  alg: 'RS256' | 'HS256',
): string | null {
  const candidates = extractCookieValues(req, name);
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i];
    if (readJwtAlg(candidate) === alg) return candidate;
  }
  return null;
}

function hasValidJwtSignature(
  token: string,
  alg: 'RS256' | 'HS256',
  secretOrPublicKey: string,
): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) return false;
  if (readJwtAlg(token) !== alg) return false;
  const signingInput = `${headerB64}.${payloadB64}`;
  try {
    const sig = Buffer.from(sigB64, 'base64url');
    if (sig.length === 0) return false;
    if (alg === 'HS256') {
      const expected = createHmac('sha256', secretOrPublicKey)
        .update(signingInput)
        .digest();
      return sig.length === expected.length && timingSafeEqual(sig, expected);
    }
    const verifier = createVerify('RSA-SHA256');
    verifier.update(signingInput);
    verifier.end();
    return verifier.verify(secretOrPublicKey, sig);
  } catch {
    return false;
  }
}

export function extractVerifiedJwtByAlg(
  req: Request,
  name: string,
  alg: 'RS256' | 'HS256',
  secretOrPublicKey: string,
): string | null {
  const candidates = extractCookieValues(req, name);
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i];
    if (hasValidJwtSignature(candidate, alg, secretOrPublicKey)) {
      return candidate;
    }
  }
  return null;
}

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
