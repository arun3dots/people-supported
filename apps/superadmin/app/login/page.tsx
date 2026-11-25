import { Button, Text } from "@repo/ui/components/ui";
import { CognitoLoginContinuation } from "./components/CognitoLoginContinuation";
import { LoginForm } from "./components/LoginForm";
import { LoginHero } from "./components/LoginHero";

export const dynamic = "force-dynamic";

const COGNITO_SUPERADMIN_START_PATH = "/auth/cognito/start?app=superadmin";

const REASON_MESSAGES: Record<string, string> = {
  unauthorized:
    "Your account does not have SuperAdmin privileges for this portal.",
  mfa_failed:
    "Multi-factor authentication was not completed. Please try signing in again.",
  account_disabled:
    "Your SuperAdmin account is disabled or unavailable.",
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
  const enabled =
    process.env.COGNITO_AUTH_ENABLED === "true" &&
    (process.env.COGNITO_SUPERADMIN_AUTH_ENABLED === "true" ||
      Boolean(process.env.COGNITO_SUPERADMIN_CALLBACK_URL));
  const legacyEnabled =
    !enabled || process.env.LEGACY_AUTH_ENABLED !== "false";
  const params = await searchParams;
  const cognito = firstParam(params.cognito);
  const reason = firstParam(params.reason);
  const nextPath = firstParam(params.next);

  let alertMessage: string | null = null;
  if (cognito === "failed") {
    alertMessage =
      (reason && REASON_MESSAGES[reason]) ||
      "Managed sign-in failed. Please try again.";
  } else if (reason && REASON_MESSAGES[reason]) {
    alertMessage = REASON_MESSAGES[reason];
  }

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* Left side - Login Form */}
      <div className="flex w-full flex-col justify-center lg:w-1/2 p-8 lg:p-16 xl:p-24 relative">
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <img
            src="/primary-logo.png"
            alt="Cantra Care"
            className="h-7 w-auto"
          />
          <span className="text-2xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
            SuperAdmin
          </span>
        </div>

        <div className="mx-auto w-full max-w-md space-y-5">
          <div className="text-left text-slate-900 mt-12">
            <Text
              as="h1"
              size="xl"
              weight="bold"
              className="text-slate-900 tracking-tight"
            >
              SuperAdmin Portal
            </Text>
            <Text size="xs" variant="subdued" className="mt-1">
              Enter your administrative credentials to access the system control
              panel.
            </Text>
          </div>

          {alertMessage && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              {alertMessage}
            </p>
          )}

          {enabled && (
            <div className="space-y-3">
              {cognito === "complete" && (
                <CognitoLoginContinuation
                  mode="complete"
                  nextPath={nextPath}
                />
              )}
              <Button asChild variant="outline" size="lg" className="w-full">
                <a href={`/api${COGNITO_SUPERADMIN_START_PATH}`}>
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

      {/* Right side - Graphic */}
      <LoginHero />
    </div>
  );
}
