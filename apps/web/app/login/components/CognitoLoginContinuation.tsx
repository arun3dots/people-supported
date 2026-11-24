"use client";

import { useEffect } from "react";
import { resolveSafeNextPath } from "../../../lib/auth/apiBase";
import { useAuth } from "../../../lib/context/AuthContext";

export function CognitoLoginContinuation({
  mode = "complete",
  nextPath,
}: {
  mode?: "complete" | "session_expired";
  nextPath?: string | null;
}) {
  const { user, loading } = useAuth();
  const destination = resolveSafeNextPath(nextPath) ?? "/dashboard";

  useEffect(() => {
    if (!loading && user?.mfaVerified) {
      // Start a same-site navigation so the browser sends Strict session cookies.
      window.location.replace(destination);
    }
  }, [loading, user, destination]);

  if (!loading && !user?.mfaVerified) {
    return (
      <p role="alert" className="text-sm font-medium text-red-700">
        {mode === "session_expired"
          ? "Your session has expired. Please sign in again."
          : "Session unavailable. Please sign in again."}
      </p>
    );
  }
  return (
    <p role="status" className="text-sm text-slate-600">
      {mode === "session_expired"
        ? "Restoring session…"
        : "Completing sign-in…"}
    </p>
  );
}
