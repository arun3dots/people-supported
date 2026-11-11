/**
 * Central session/refresh manager.
 *
 * This is the SINGLE source of truth for refreshing the access token. Both the
 * proactive timer in `AuthContext` and the reactive 401 handler in `makeAPICall`
 * MUST go through here.
 *
 * Why this matters: the backend rotates the refresh token on every
 * `/api/auth/refresh` call and treats an already-rotated (re-used) token as a
 * theft attempt — it then revokes the ENTIRE token family and logs the user out
 * (see `apps/backend/src/auth/refresh-token.service.ts`). If two callers fired a
 * refresh at the same time with the same refresh-token cookie, the first would
 * rotate it and the second would send the now-revoked one → instant logout.
 * Single-flighting every refresh through `refreshSession()` prevents that.
 *
 * It also drives the reauthentication UI: when a normal refresh fails,
 * `recoverSession()` flips the status to "reauthenticating" (the popup), retries
 * a few times in the background, and finally flips to "expired" (session timeout
 * → redirect to login) only if every retry fails.
 */

export type SessionStatus = "active" | "reauthenticating" | "expired";

/** Number of background refresh attempts made while the popup is shown. */
const RECOVERY_ATTEMPTS = 3;
/** Delay between background recovery attempts. */
const RECOVERY_DELAY_MS = 2000;

type Listener = (status: SessionStatus) => void;

let status: SessionStatus = "active";
const listeners = new Set<Listener>();

let refreshPromise: Promise<boolean> | null = null;
let recoveryPromise: Promise<boolean> | null = null;

/**
 * Set while the user is intentionally logging out. A logout clears the auth
 * cookies, so any in-flight request (or query refetch) that races the redirect
 * will 401 — but that is expected, not a session timeout. While this is true,
 * refresh/recovery short-circuit so the reauthentication popup never appears.
 * Cleared by `resetSessionStatus()` on the next successful login.
 */
let loggingOut = false;

function getApiBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setStatus(next: SessionStatus): void {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener(status));
}

export function getSessionStatus(): SessionStatus {
  return status;
}

/** Subscribe to session-status changes. Returns an unsubscribe function. */
export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Single-flight access-token refresh. All concurrent callers share one in-flight
 * request, so the refresh token is rotated exactly once. Resolves `true` if the
 * token was refreshed, `false` otherwise. Never throws.
 */
export function refreshSession(): Promise<boolean> {
  if (loggingOut) return Promise.resolve(false);
  if (!refreshPromise) {
    refreshPromise = fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Recovery flow shown to the user when a normal refresh has already failed.
 * Flips status to "reauthenticating" (drives the "Please wait while we
 * reauthenticate…" popup), retries the refresh a few times in the background,
 * and resolves:
 *   - `true`  → a retry succeeded; status returns to "active" and callers can
 *               safely retry their request.
 *   - `false` → every retry failed; status becomes "expired" so the UI shows the
 *               session-timeout message and redirects to login.
 *
 * Single-flighted: concurrent failures share one recovery attempt.
 */
export function recoverSession(): Promise<boolean> {
  if (loggingOut) return Promise.resolve(false);
  if (!recoveryPromise) {
    recoveryPromise = (async () => {
      setStatus("reauthenticating");
      for (let attempt = 1; attempt <= RECOVERY_ATTEMPTS; attempt++) {
        // A logout may have started mid-recovery — bail without flipping to
        // "expired" so the session-timeout dialog stays hidden.
        if (loggingOut) {
          setStatus("active");
          return false;
        }
        const ok = await refreshSession();
        if (ok) {
          setStatus("active");
          return true;
        }
        if (attempt < RECOVERY_ATTEMPTS) {
          await delay(RECOVERY_DELAY_MS);
        }
      }
      if (loggingOut) {
        setStatus("active");
        return false;
      }
      setStatus("expired");
      return false;
    })().finally(() => {
      recoveryPromise = null;
    });
  }
  return recoveryPromise;
}

/**
 * Reset the status back to "active". Call after a successful login or after the
 * user has been redirected to the login page, so a stale "expired" status does
 * not keep the popup on screen.
 */
export function resetSessionStatus(): void {
  loggingOut = false;
  setStatus("active");
}

/**
 * Mark the start of an intentional logout. Hides any session popup and makes
 * subsequent refresh/recovery attempts no-ops until the next login resets the
 * status. Call this before clearing the session / redirecting to /login.
 */
export function beginLogout(): void {
  loggingOut = true;
  setStatus("active");
}
