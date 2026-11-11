"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MailWarning, Mail, LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import { useAuth } from "../context/AuthContext";
import { makeAPICall } from "../api";
import { RESEND_VERIFICATION } from "@repo/endpoints";

/** Same exempt routes as the payment overlay (auth/payment pages). */
const OVERLAY_EXEMPT_PREFIXES = [
  "/pay",
  "/billing",
  "/onboarding",
  "/login",
  "/verify",
];

/**
 * Full-screen gate for logged-in users whose email isn't verified yet. They can
 * resend the verification email or log out — nothing else. Polls /auth/me so the
 * gate lifts automatically once they click the link in their inbox.
 */
export function EmailVerificationOverlay() {
  const { user, loading, logout, refreshUser } = useAuth();
  const pathname = usePathname();

  const isExemptRoute = OVERLAY_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const gated =
    !isExemptRoute &&
    !loading &&
    !!user?.tenantId &&
    user.emailVerified === false;

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Poll for verification completed in another tab/inbox.
  useEffect(() => {
    if (!gated) return;
    const id = setInterval(() => void refreshUser(), 8000);
    return () => clearInterval(id);
  }, [gated, refreshUser]);

  if (!gated) return null;

  const resend = async () => {
    setSending(true);
    setError("");
    try {
      await makeAPICall(RESEND_VERIFICATION);
      setSent(true);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <MailWarning className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Verify your email
        </h2>
        <p className="mt-3 text-ms text-muted-foreground">
          Your email{user?.email ? ` (${user.email})` : ""} isn&apos;t verified
          yet. Please verify it to access your account. Check your inbox for the
          verification link.
        </p>

        {sent && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Verification email sent — check your inbox.
          </div>
        )}
        {error && (
          <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={resend}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Mail className="h-5 w-5" />
            )}
            Resend verification email
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            onClick={() => void logout()}
          >
            <LogOut className="h-5 w-5" />
            Log out
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Already verified? This will update automatically.
        </p>
      </div>
    </div>
  );
}
