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
  const isSuperAdmin =
    Boolean(user) &&
    user?.roleName?.toUpperCase() === "SUPERADMIN" &&
    !user?.tenantId &&
    user?.mfaVerified === true;
  const destination = resolveSafeNextPath(nextPath) ?? "/dashboard";

  useEffect(() => {
    if (!loading && isSuperAdmin) {
      window.location.replace(destination);
    }
  }, [loading, isSuperAdmin, destination]);

  if (!loading && !isSuperAdmin) {
    return (
      <p role="alert" className="text-xs font-medium text-red-700">
        {mode === "session_expired"
          ? "Your session has expired. Please sign in again."
          : "SuperAdmin session unavailable or unauthorised. Please sign in again."}
      </p>
    );
  }
  return (
    <p role="status" className="text-xs text-slate-600">
      {mode === "session_expired"
        ? "Restoring session…"
        : "Completing SuperAdmin sign-in…"}
    </p>
  );
}
