import React from "react";
import Image from "next/image";
import { COGNITO_START_PATH } from "@repo/endpoints";
import { Button } from "@repo/ui/components/ui";
import { LoginForm } from "./components/LoginForm";
import { CognitoLoginContinuation } from "./components/CognitoLoginContinuation";

export const dynamic = "force-dynamic";

const FAILURE_MESSAGES: Record<string, string> = {
  mfa_failed:
    "Multi-factor authentication was not completed. Please try signing in again.",
  account_disabled:
    "Your account or organisation is disabled or unavailable. Please contact your administrator.",
  unauthorized: "Your account is not authorised to access this portal.",
};

function firstParam(val?: string | string[]): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    cognito?: string | string[];
    reason?: string | string[];
    next?: string | string[];
  }>;
}) {
  const enabled = process.env.COGNITO_AUTH_ENABLED === "true";
  const legacyEnabled =
    !enabled || process.env.LEGACY_AUTH_ENABLED !== "false";
  const params = await searchParams;
  const cognito = firstParam(params.cognito);
  const reason = firstParam(params.reason);
  const nextPath = firstParam(params.next);
  const failureMessage =
    enabled && cognito === "failed"
      ? (reason && FAILURE_MESSAGES[reason]) ||
        "Managed sign-in failed. Please try again."
      : null;

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans overflow-hidden">
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-xl border border-slate-100/80 max-w-md w-full space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-md sm:text-md font-medium text-slate-500">
              Sign in to continue to your account
            </p>
          </div>

          {enabled && (
            <div className="space-y-3">
              {cognito === "complete" && (
                <CognitoLoginContinuation mode="complete" nextPath={nextPath} />
              )}
              {failureMessage && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                >
                  {failureMessage}
                </p>
              )}
              <Button asChild variant="outline" size="lg" className="w-full">
                <a href={`/api${COGNITO_START_PATH}`}>
                  Sign in with Cognito
                </a>
              </Button>
            </div>
          )}

          {reason === "session_expired" && cognito !== "complete" && (
            <CognitoLoginContinuation
              mode="session_expired"
              nextPath={nextPath}
            />
          )}

          {enabled && legacyEnabled && (
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200" />
              <span className="mx-3 shrink-0 text-xs font-medium uppercase tracking-wider text-slate-400">
                Or continue with password
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>
          )}

          {legacyEnabled && <LoginForm />}
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative bg-slate-100">
        <Image
          unoptimized
          src="/images/common/signup-right-image.png"
          alt="Sign In banner"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
