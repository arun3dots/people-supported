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
      "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET must be set to a strong secret of at least 32 characters.",
    );
  }

  return new TextEncoder().encode(rawSecret);
}

/**
 * Route gate for the SuperAdmin control panel. Mirrors `apps/web`'s middleware
 * but simplified to a single role: only a valid `access_token` whose role is
 * SuperAdmin may reach the protected app; everyone else is sent to /login.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const { pathname } = req.nextUrl;

  // 1. Public routes & asset paths
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".");

  if (isPublicRoute) {
    // Already-authenticated SuperAdmins skip the login screen.
    if (token && (pathname === "/login" || pathname === "/")) {
      try {
        const { payload } = await jwtVerify(token, getJwtSecretBytes());
        const role = (payload.roleName as string)?.toUpperCase();
        if (role === "SUPERADMIN") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      } catch {
        // Invalid/expired token — allow access to the public route.
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // 2. Protected routes — must carry a token.
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    const role = (payload.roleName as string)?.toUpperCase();

    // 3. Only SuperAdmins may access the control panel.
    if (role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
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
