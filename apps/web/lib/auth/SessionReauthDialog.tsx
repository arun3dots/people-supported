"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
 * - status "expired" → show the timeout message, then redirect to /login.
 * - status "active"  → nothing rendered. Refresh retries remain in the background.
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

  const open = status === "expired";

  return (
    <Dialog open={open}>
      <DialogContent
        size="md"
        // Non-dismissible: the user must not close it mid-reauthentication.
        className="[&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Session timed out</DialogTitle>
          <DialogDescription>
            Your session has expired for security reasons. Redirecting you to
            the login page…
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
