import {
  decodeProtectedHeader,
  importSPKI,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { COGNITO_APP_AUDIENCE, COGNITO_APP_ISSUER } from "@repo/schema";
import { getServerApiBaseUrl } from "./apiBase";

export interface VerifiedAppToken {
  token: string;
  payload: JWTPayload;
  cognito: boolean;
}

export interface LiveSessionUser {
  userId: string;
  email?: string;
  fullName?: string;
  roleName: string;
  tenantId?: string | null;
  mfaVerified?: boolean;
  mfaSetupRequired?: boolean;
}

export type LiveSessionResult =
  | { ok: true; user: LiveSessionUser }
  | { ok: false; status: number; code?: string };

export function isPublicSuperAdminRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  );
}

export function isVerifiedSuperAdmin(user: LiveSessionUser): boolean {
  return (
    user.roleName?.toUpperCase() === "SUPERADMIN" &&
    !user.tenantId &&
    user.mfaVerified === true
  );
}

export function extractCookieValues(
  cookieHeader: string | null,
  name: string,
): string[] {
  if (!cookieHeader) return [];
  const values: string[] = [];
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0 || part.slice(0, idx).trim() !== name) continue;
    const raw = part.slice(idx + 1).trim();
    if (!raw) continue;
    try {
      values.push(decodeURIComponent(raw));
    } catch {
      values.push(raw);
    }
  }
  return values;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getJwtSecretJwk(): { kty: "oct"; k: string } {
  const rawSecret = process.env.JWT_SECRET;
  if (
    !rawSecret ||
    rawSecret.trim() === "" ||
    rawSecret === "secretKey" ||
    rawSecret.length < 32
  ) {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET must be set to a strong secret of at least 32 characters.",
    );
  }
  return {
    kty: "oct",
    k: toBase64Url(new TextEncoder().encode(rawSecret)),
  };
}

function readTokenAlg(token: string): string | null {
  try {
    const alg = decodeProtectedHeader(token).alg;
    return typeof alg === "string" ? alg : null;
  } catch {
    return null;
  }
}

export async function verifySingleAppToken(
  token: string,
): Promise<VerifiedAppToken> {
  if (decodeProtectedHeader(token).alg === "RS256") {
    const encoded = process.env.COGNITO_APP_PUBLIC_KEY_B64;
    if (process.env.COGNITO_AUTH_ENABLED !== "true" || !encoded) {
      throw new Error("Cognito session unavailable");
    }
    const key = await importSPKI(atob(encoded), "RS256");
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["RS256"],
      issuer: COGNITO_APP_ISSUER,
      audience: COGNITO_APP_AUDIENCE,
      requiredClaims: ["exp", "sub", "sid"],
    });
    if (payload.mfaVerified !== true) {
      throw new Error("Cognito MFA verification claim missing");
    }
    return { token, payload, cognito: true };
  }
  const { payload } = await jwtVerify(token, getJwtSecretJwk(), {
    algorithms: ["HS256"],
  });
  return { token, payload, cognito: false };
}

export async function verifyAppTokenCandidates(
  tokens: readonly string[],
): Promise<{
  verified: VerifiedAppToken | null;
  hadExpired: boolean;
}> {
  let verifiedLegacy: VerifiedAppToken | null = null;
  let hadExpired = false;
  const hasRs256Candidate =
    process.env.COGNITO_AUTH_ENABLED === "true" &&
    tokens.some((candidate) => readTokenAlg(candidate) === "RS256");
  const legacyDisallowed =
    process.env.COGNITO_AUTH_ENABLED === "true" &&
    process.env.LEGACY_AUTH_ENABLED === "false";

  for (let i = tokens.length - 1; i >= 0; i--) {
    const candidate = tokens[i];
    if (!candidate) continue;
    const alg = readTokenAlg(candidate);
    if ((hasRs256Candidate || legacyDisallowed) && alg !== "RS256") {
      continue;
    }
    try {
      const verified = await verifySingleAppToken(candidate);
      if (verified.cognito) return { verified, hadExpired };
      verifiedLegacy ??= verified;
    } catch (error: unknown) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: unknown }).code)
          : "";
      if (code === "ERR_JWT_EXPIRED") {
        hadExpired = true;
      } else {
        console.error(
          "Middleware JWT Error:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }
  }

  return {
    verified: hasRs256Candidate || legacyDisallowed ? null : verifiedLegacy,
    hadExpired,
  };
}

export async function verifyLiveSession(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LiveSessionResult> {
  try {
    const res = await fetchImpl(`${getServerApiBaseUrl()}/auth/me`, {
      method: "POST",
      headers: { Cookie: `access_token=${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const raw = (await res.json()) as Partial<LiveSessionUser> | null;
      if (
        !raw ||
        typeof raw !== "object" ||
        typeof raw.userId !== "string" ||
        !raw.userId ||
        typeof raw.roleName !== "string" ||
        !raw.roleName
      ) {
        return { ok: false, status: 502 };
      }
      return { ok: true, user: raw as LiveSessionUser };
    }
    let code: string | undefined;
    try {
      const body = (await res.json()) as { code?: unknown };
      if (typeof body?.code === "string") code = body.code;
    } catch {
      // Ignore parse failures.
    }
    return { ok: false, status: res.status, code };
  } catch {
    return { ok: false, status: 503 };
  }
}
