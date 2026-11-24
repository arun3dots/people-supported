import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { extractCookieValues, readJwtAlg } from './auth-cookie.util';

const DEFAULT_CORS_ORIGINS =
  'http://localhost:3000,http://localhost:3001,http://localhost:3002';

function normalizeOrigin(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === 'null') return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin.toLowerCase();
  } catch {
    return null;
  }
}

function collectAllowedOrigins(extraOrigins: readonly string[]): Set<string> {
  const allowed = new Set<string>();
  const rawCors = process.env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS;
  for (const item of rawCors.split(',')) {
    const normalized = normalizeOrigin(item);
    if (normalized) allowed.add(normalized);
  }
  const envUrls = [
    process.env.COGNITO_SIGN_OUT_URL,
    process.env.COGNITO_CALLBACK_URL,
    process.env.COGNITO_SUPERADMIN_SIGN_OUT_URL,
    process.env.COGNITO_SUPERADMIN_CALLBACK_URL,
    ...extraOrigins,
  ];
  for (const candidate of envUrls) {
    const normalized = normalizeOrigin(candidate);
    if (normalized) allowed.add(normalized);
  }
  return allowed;
}

function resolveRequestOrigin(req: Request): string | null {
  const host = (req.get('x-forwarded-host') || req.get('host'))
    ?.split(',')[0]
    ?.trim();
  if (!host) return null;
  const forwardedProto = req
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  const proto =
    forwardedProto === 'https' || forwardedProto === 'http'
      ? forwardedProto
      : req.secure
        ? 'https'
        : req.protocol || 'http';
  return normalizeOrigin(`${proto}://${host}`);
}

export function assertSafeBrowserOrigin(
  req: Request,
  extraOrigins: readonly string[] = [],
): void {
  const secFetchSite = req.get('sec-fetch-site')?.trim().toLowerCase();
  if (secFetchSite === 'cross-site') {
    throw new ForbiddenException('Cross-site browser request rejected.');
  }

  const rawOrigin = req.get('origin')?.trim();
  if (!rawOrigin) {
    if (secFetchSite === 'same-site') {
      throw new ForbiddenException(
        'Origin header required for browser request.',
      );
    }
    return;
  }

  const origin = normalizeOrigin(rawOrigin);
  if (!origin) {
    throw new ForbiddenException('Invalid request origin.');
  }

  const allowed = collectAllowedOrigins(extraOrigins);
  if (allowed.has(origin)) return;

  const sameRequestOrigin = resolveRequestOrigin(req);
  if (sameRequestOrigin && sameRequestOrigin === origin) return;

  throw new ForbiddenException('Cross-origin browser request rejected.');
}

export function hasRs256AccessCookie(req: Request): boolean {
  return extractCookieValues(req, 'access_token').some(
    (candidate) => readJwtAlg(candidate) === 'RS256',
  );
}
