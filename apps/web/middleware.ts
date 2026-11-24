import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractCookieValues,
  isPublicWebRoute,
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

  if (isPublicWebRoute(pathname)) {
    const isAuthEntry =
      pathname === "/login" ||
      pathname === "/login/mfa" ||
      pathname === "/signup" ||
      pathname === "/get-started";
    const keepOnLoginPage =
      pathname === "/login" &&
      (searchParams.get("cognito") === "complete" ||
        searchParams.get("cognito") === "failed" ||
        searchParams.has("reason"));

    if (tokens.length > 0 && isAuthEntry && !keepOnLoginPage) {
      const { verified } = await verifyAppTokenCandidates(tokens);
      if (verified) {
        const live = await verifyLiveSession(verified.token);
        const mfaVerified =
          live.ok &&
          live.user.mfaVerified === true &&
          verified.payload.mfaVerified === true;
        if (mfaVerified) {
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
    if (live.code === "MFA_REQUIRED") {
      return NextResponse.redirect(new URL("/login/mfa", req.url));
    }
    if (live.code === "MFA_SETUP_REQUIRED") {
      return NextResponse.redirect(new URL("/login/mfa?setup=1", req.url));
    }
    return loginRedirect(req, "session_expired", true);
  }

  if (live.user.mfaSetupRequired === true) {
    return NextResponse.redirect(new URL("/login/mfa?setup=1", req.url));
  }
  if (
    live.user.mfaVerified !== true ||
    verified.payload.mfaVerified !== true
  ) {
    return NextResponse.redirect(new URL("/login/mfa", req.url));
  }

  const role = live.user.roleName?.toUpperCase();
  const isCustomDashboardRole =
    ![
      "ADMIN",
      "SUPERADMIN",
      "MANAGER",
      "CARER",
      "NURSE",
      "RESIDENT",
    ].includes(role) && live.user.permissions?.dashboard?.read === true;

  if (pathname === "/dashboard") {
    if (role === "CARER")
      return NextResponse.redirect(new URL("/carer/dashboard", req.url));
    if (role === "NURSE")
      return NextResponse.redirect(new URL("/nurse/dashboard", req.url));
    if (role === "RESIDENT")
      return NextResponse.redirect(new URL("/resident/dashboard", req.url));
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  if (pathname === "/admin/dashboard" && isCustomDashboardRole) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/admin") &&
    role !== "ADMIN" &&
    role !== "SUPERADMIN" &&
    role !== "MANAGER"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (
    pathname.startsWith("/carer") &&
    role !== "CARER" &&
    role !== "ADMIN" &&
    role !== "SUPERADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (
    pathname.startsWith("/nurse") &&
    role !== "NURSE" &&
    role !== "ADMIN" &&
    role !== "SUPERADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
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
