import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecretBytes(): Uint8Array {
  const rawSecret = process.env.JWT_SECRET;
  if (
    !rawSecret ||
    rawSecret.trim() === "" ||
    rawSecret === "secretKey" ||
    rawSecret.length < 32
  ) {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR (D-04): JWT_SECRET environment variable must be set to a cryptographically strong secret (>= 32 characters) and must not use 'secretKey'.",
    );
  }
  return new TextEncoder().encode(rawSecret);
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const { pathname } = req.nextUrl;

  // 1. Public routes & Asset paths
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/terms" ||
    pathname === "/privacy-policy" ||
    pathname === "/dpa" ||
    pathname === "/accessibility" ||
    pathname === "/get-started" ||
    pathname === "/verify" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password") ||
    pathname === "/login/mfa" ||
    pathname === "/onboarding" ||
    pathname === "/billing" ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".");

  if (isPublicRoute) {
    if (token) {
      try {
        const secret = getJwtSecretBytes();
        const { payload } = await jwtVerify(token, secret);
        const mfaVerified = payload.mfaVerified as boolean;

        // Redirect away from auth pages if already logged in & verified
        if (
          mfaVerified &&
          (pathname === "/login" ||
            pathname === "/login/mfa" ||
            pathname === "/signup" ||
            pathname === "/get-started")
        ) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      } catch {
        // Token is invalid or expired, allow access to public routes
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // 2. Protected routes - check for token
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = getJwtSecretBytes();
    const { payload } = await jwtVerify(token, secret);
    const mfaVerified = payload.mfaVerified as boolean;

    // D-02: Enforce MFA verification before allowing access to protected routes
    if (mfaVerified === false) {
      return NextResponse.redirect(new URL("/login/mfa", req.url));
    }

    const role = (payload.roleName as string)?.toUpperCase();
    const permissions = payload.permissions as
      | { dashboard?: { read?: boolean } }
      | undefined;
    const isCustomDashboardRole =
      ![
        "ADMIN",
        "SUPERADMIN",
        "MANAGER",
        "CARER",
        "NURSE",
        "RESIDENT",
      ].includes(role) && permissions?.dashboard?.read === true;

    if (pathname === "/dashboard") {
      if (role === "CARER")
        return NextResponse.redirect(new URL("/carer/dashboard", req.url));
      if (role === "NURSE")
        return NextResponse.redirect(new URL("/nurse/dashboard", req.url));
      if (role === "RESIDENT")
        return NextResponse.redirect(new URL("/resident/dashboard", req.url));
      if (isCustomDashboardRole)
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (pathname === "/admin/dashboard" && isCustomDashboardRole) {
      return NextResponse.next();
    }

    // Role-based path protection
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

    // Disable browser memory cache for protected routes
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (error: unknown) {
    const isErrorWithCode =
      error && typeof error === "object" && "code" in error;
    const errorCode = isErrorWithCode ? (error as { code: string }).code : "";

    if (errorCode !== "ERR_JWT_EXPIRED") {
      console.error(
        "Middleware JWT Error:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
