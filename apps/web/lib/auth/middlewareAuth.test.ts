import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { exportSPKI, generateKeyPair, SignJWT } from "jose";
import { COGNITO_APP_AUDIENCE, COGNITO_APP_ISSUER } from "@repo/schema";
import {
  resolveApiUrl,
  resolveSafeNextPath,
  resolveSafeSignOutDestination,
} from "./apiBase";
import {
  extractCookieValues,
  verifyAppTokenCandidates,
  verifyLiveSession,
} from "./middlewareAuth";

describe("web auth middleware helpers", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = "0123456789abcdef0123456789abcdef";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("prefers valid RS256 Cognito cookie over stale HS256 cookie", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256", {
      extractable: true,
    });
    const spki = await exportSPKI(publicKey);
    process.env.COGNITO_AUTH_ENABLED = "true";
    process.env.COGNITO_APP_PUBLIC_KEY_B64 = Buffer.from(spki).toString("base64");

    const legacyToken = await new SignJWT({
      sub: "11111111-1111-1111-1111-111111111111",
      roleName: "Carer",
      mfaVerified: true,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign({
        kty: "oct",
        k: Buffer.from(process.env.JWT_SECRET!).toString("base64url"),
      });

    const cognitoToken = await new SignJWT({
      sid: "22222222-2222-2222-2222-222222222222",
      roleName: "Admin",
      mfaVerified: true,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(COGNITO_APP_ISSUER)
      .setAudience(COGNITO_APP_AUDIENCE)
      .setSubject("33333333-3333-3333-3333-333333333333")
      .setExpirationTime("1h")
      .sign(privateKey);

    const parsed = extractCookieValues(
      `access_token=${cognitoToken}; other=1; access_token=${legacyToken}`,
      "access_token",
    );
    expect(parsed).toEqual([cognitoToken, legacyToken]);

    const result = await verifyAppTokenCandidates(parsed);
    expect(result.verified?.cognito).toBe(true);
    expect(result.verified?.token).toBe(cognitoToken);
    expect(result.verified?.payload.roleName).toBe("Admin");
  });

  it("flags expired tokens and rejects RS256 when Cognito is disabled", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256", {
      extractable: true,
    });
    const spki = await exportSPKI(publicKey);

    const expiredHs256 = await new SignJWT({ sub: "user-1", roleName: "Admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign({
        kty: "oct",
        k: Buffer.from(process.env.JWT_SECRET!).toString("base64url"),
      });

    const expiredResult = await verifyAppTokenCandidates([expiredHs256]);
    expect(expiredResult.verified).toBeNull();
    expect(expiredResult.hadExpired).toBe(true);

    process.env.COGNITO_AUTH_ENABLED = "false";
    process.env.COGNITO_APP_PUBLIC_KEY_B64 = Buffer.from(spki).toString("base64");
    const rs256 = await new SignJWT({
      sid: "22222222-2222-2222-2222-222222222222",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(COGNITO_APP_ISSUER)
      .setAudience(COGNITO_APP_AUDIENCE)
      .setSubject("33333333-3333-3333-3333-333333333333")
      .setExpirationTime("1h")
      .sign(privateKey);

    const disabledResult = await verifyAppTokenCandidates([rs256]);
    expect(disabledResult.verified).toBeNull();
  });

  it("validates live sessions via internal API and fails closed on 401/403", async () => {
    process.env.INTERNAL_API_URL = "http://127.0.0.1:4400/api";
    const okFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ userId: "u1", roleName: "Admin", mfaVerified: true }),
        { status: 200 },
      ),
    );
    const liveOk = await verifyLiveSession("tok-1", okFetch);
    expect(liveOk).toEqual({
      ok: true,
      user: { userId: "u1", roleName: "Admin", mfaVerified: true },
    });
    expect(okFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:4400/api/auth/me",
      expect.objectContaining({
        method: "POST",
        headers: { Cookie: "access_token=tok-1" },
      }),
    );

    const mfaFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: "MFA_REQUIRED" }), { status: 403 }),
    );
    expect(await verifyLiveSession("tok-2", mfaFetch)).toEqual({
      ok: false,
      status: 403,
      code: "MFA_REQUIRED",
    });
  });

  it("handles same-origin /api URLs and validates signOutUrl and next paths", () => {
    expect(resolveApiUrl("/api/auth/refresh", "/api").pathname).toBe(
      "/api/auth/refresh",
    );
    expect(resolveApiUrl("/auth/logout", "/api").pathname).toBe(
      "/api/auth/logout",
    );

    expect(
      resolveSafeSignOutDestination("https://auth.example.com/logout"),
    ).toBe("https://auth.example.com/logout");
    expect(
      resolveSafeSignOutDestination(
        "http://127.0.0.1:4999/logout",
        { protocol: "http:", hostname: "web.cantracare.test" },
      ),
    ).toBe("http://127.0.0.1:4999/logout");
    expect(
      resolveSafeSignOutDestination(
        "http://evil.example.com/logout",
        { protocol: "http:", hostname: "web.cantracare.test" },
      ),
    ).toBe("/login");
    expect(
      resolveSafeSignOutDestination("https://auth.example.com/authorize"),
    ).toBe("/login");
    expect(
      resolveSafeSignOutDestination("https://user:pass@auth.example.com/logout"),
    ).toBe("/login");

    expect(resolveSafeNextPath("/admin/dashboard?tab=1")).toBe(
      "/admin/dashboard?tab=1",
    );
    expect(resolveSafeNextPath("//evil.example.com")).toBeNull();
    expect(resolveSafeNextPath("/\\evil.example.com")).toBeNull();
    expect(resolveSafeNextPath("/login")).toBeNull();
  });

  it("blocks RS256->HS256 downgrade, skips forged RS256 duplicates, requires mfaVerified=true, and fails closed", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256", {
      extractable: true,
    });
    const { privateKey: forgedPrivate } = await generateKeyPair("RS256", {
      extractable: true,
    });
    const spki = await exportSPKI(publicKey);
    process.env.COGNITO_AUTH_ENABLED = "true";
    process.env.COGNITO_APP_PUBLIC_KEY_B64 = Buffer.from(spki).toString("base64");

    const validHs256 = await new SignJWT({
      sub: "11111111-1111-1111-1111-111111111111",
      roleName: "Admin",
      mfaVerified: true,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign({
        kty: "oct",
        k: Buffer.from(process.env.JWT_SECRET!).toString("base64url"),
      });

    const expiredRs256 = await new SignJWT({
      sid: "22222222-2222-2222-2222-222222222222",
      mfaVerified: true,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(COGNITO_APP_ISSUER)
      .setAudience(COGNITO_APP_AUDIENCE)
      .setSubject("33333333-3333-3333-3333-333333333333")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(privateKey);

    const downgradeAttempt = await verifyAppTokenCandidates([
      validHs256,
      expiredRs256,
    ]);
    expect(downgradeAttempt.verified).toBeNull();
    expect(downgradeAttempt.hadExpired).toBe(true);

    const missingMfaRs256 = await new SignJWT({
      sid: "22222222-2222-2222-2222-222222222222",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(COGNITO_APP_ISSUER)
      .setAudience(COGNITO_APP_AUDIENCE)
      .setSubject("33333333-3333-3333-3333-333333333333")
      .setExpirationTime("1h")
      .sign(privateKey);
    expect((await verifyAppTokenCandidates([missingMfaRs256])).verified).toBeNull();

    const validRs256 = await new SignJWT({
      sid: "22222222-2222-2222-2222-222222222222",
      mfaVerified: true,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(COGNITO_APP_ISSUER)
      .setAudience(COGNITO_APP_AUDIENCE)
      .setSubject("33333333-3333-3333-3333-333333333333")
      .setExpirationTime("1h")
      .sign(privateKey);
    const forgedRs256 = await new SignJWT({
      sid: "22222222-2222-2222-2222-222222222222",
      mfaVerified: true,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(COGNITO_APP_ISSUER)
      .setAudience(COGNITO_APP_AUDIENCE)
      .setSubject("33333333-3333-3333-3333-333333333333")
      .setExpirationTime("1h")
      .sign(forgedPrivate);
    const duplicate = await verifyAppTokenCandidates([validRs256, forgedRs256]);
    expect(duplicate.verified?.token).toBe(validRs256);

    process.env.LEGACY_AUTH_ENABLED = "false";
    expect((await verifyAppTokenCandidates([validHs256])).verified).toBeNull();

    const malformed = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    expect(await verifyLiveSession("tok-bad", malformed)).toEqual({
      ok: false,
      status: 502,
    });
  });
});
