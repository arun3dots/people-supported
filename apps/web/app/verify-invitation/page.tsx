"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VERIFY_MANAGED_INVITATION } from "@repo/endpoints";
import { managedAccountVerificationSchema } from "@repo/schema";
import { Button } from "@repo/ui/components/ui";
import { makeAPICall } from "../../lib/api";

export default function VerifyInvitationPage() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<
    "loading" | "ready" | "sending" | "verified" | "invalid" | "error"
  >("loading");

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    const parsed = managedAccountVerificationSchema.safeParse({ token: value });
    if (parsed.success) {
      setToken(parsed.data.token);
      setState("ready");
    } else setState("invalid");
  }, []);

  async function confirm() {
    if (!token || state === "sending") return;
    setState("sending");
    try {
      await makeAPICall(VERIFY_MANAGED_INVITATION, { token });
      window.history.replaceState(null, "", window.location.pathname);
      setToken(null);
      setState("verified");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-100 bg-white p-6 sm:p-10">
      <h1 className="text-2xl font-bold">Verify your invitation</h1>
      {state === "loading" && <p role="status">Checking invitation…</p>}
      {state === "invalid" && (
        <p role="alert">
          This invitation link is incomplete. Ask your administrator to resend
          it.
        </p>
      )}
      {state === "error" && (
        <p role="alert">
          Verification could not be confirmed. Try again or ask your
          administrator to check the invitation status.
        </p>
      )}
      {token && (
        <Button
          size="lg"
          disabled={state === "sending"}
          onClick={() => void confirm()}
        >
          Verify email address
        </Button>
      )}
      {state === "verified" && (
        <>
          <p role="status">
            Email confirmed. Check your inbox for the Managed Login invitation.
            If it does not arrive, contact your administrator.
          </p>
          <Link href="/login" className="font-medium text-slate-800 underline">
            Back to sign in
          </Link>
        </>
      )}
    </main>
  );
}
