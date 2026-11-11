"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Spinner,
} from "@repo/ui/components/ui";
import {
  getSessionStatus,
  resetSessionStatus,
  subscribeSession,
  type SessionStatus,
} from "./sessionManager";

/** How long the "session timed out" message is shown before redirecting. */
const EXPIRED_REDIRECT_DELAY_MS = 2000;

/**
 * Global, app-wide session dialog. Mounted once near the root (inside Providers).
 *
 * - status "reauthenticating" → non-dismissible "Please wait while we
 *   reauthenticate…" popup while the session manager retries in the background.
 * - status "expired"          → "Session timed out" message, then redirect to
 *   /login.
 * - status "active"           → nothing rendered.
 */
export function SessionReauthDialog() {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>(() => getSessionStatus());

  useEffect(() => subscribeSession(setStatus), []);

  useEffect(() => {
    if (status !== "expired") return;
    const timer = setTimeout(() => {
      resetSessionStatus();
      router.push("/login");
    }, EXPIRED_REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, router]);

  const open = status === "reauthenticating" || status === "expired";

  return (
    <Dialog open={open}>
      <DialogContent
        // Non-dismissible: the user must not close it mid-reauthentication.
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {status === "expired" ? (
          <DialogHeader>
            <DialogTitle>Session timed out</DialogTitle>
            <DialogDescription>
              Your session has expired for security reasons. Redirecting you to
              the login page…
            </DialogDescription>
          </DialogHeader>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reauthenticating</DialogTitle>
              <DialogDescription>
                Please wait while we securely reconnect your session…
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
