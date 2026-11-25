import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractCookieValues,
  isPublicSuperAdminRoute,
  isVerifiedSuperAdmin,
  verifyAppTokenCandidates,
  verifyLiveSession,
} from "./lib/auth/middlewareAuth";

function loginRedirect(
  req: NextRequest,
  reason?: string,
  includeNext = false,
): NextResponse {
  const url = new URL("/login", req.url);
  if (reason) url.searchParams.set("reason", reason);
  if (includeNext) {
    url.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`);
  }
  const res = NextResponse.redirect(url);
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  );
  return res;
}

/**
 * Route gate for the SuperAdmin control panel. Only a live verified
 * `SuperAdmin` session with `tenantId == null` may reach protected routes.
 */
export async function middleware(req: NextRequest) {
  const headerTokens = extractCookieValues(
    req.headers.get("cookie"),
    "access_token",
  );
  const tokens =
    headerTokens.length > 0
      ? headerTokens
      : req.cookies.getAll("access_token").map((c) => c.value);
  const { pathname, searchParams } = req.nextUrl;

  if (isPublicSuperAdminRoute(pathname)) {
    const keepOnLogin =
      pathname === "/login" &&
      (searchParams.get("cognito") === "complete" ||
        searchParams.get("cognito") === "failed" ||
        searchParams.has("reason"));

    if (
      tokens.length > 0 &&
      !keepOnLogin &&
      (pathname === "/login" || pathname === "/")
    ) {
      const { verified } = await verifyAppTokenCandidates(tokens);
      if (verified) {
        const live = await verifyLiveSession(verified.token);
        if (
          live.ok &&
          verified.payload.mfaVerified === true &&
          isVerifiedSuperAdmin(live.user)
        ) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    }
    return NextResponse.next();
  }

  if (tokens.length === 0) {
    return loginRedirect(req);
  }

  const { verified, hadExpired } = await verifyAppTokenCandidates(tokens);
  if (!verified) {
    return loginRedirect(
      req,
      hadExpired ? "session_expired" : undefined,
      hadExpired,
    );
  }

  const live = await verifyLiveSession(verified.token);
  if (!live.ok) {
    return loginRedirect(req, "session_expired", true);
  }

  if (
    verified.payload.mfaVerified !== true ||
    !isVerifiedSuperAdmin(live.user)
  ) {
    return loginRedirect(req, "unauthorized");
  }

  const response = NextResponse.next();
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
