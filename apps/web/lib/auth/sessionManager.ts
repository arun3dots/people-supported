/**
 * Central session/refresh manager. All proactive and reactive refreshes share
 * this single-flight path and serialize across tabs when Web Locks are present.
 */

export type RefreshResult = "refreshed" | "invalid" | "temporary" | "cancelled";
export type SessionStatus = "active" | "expired";

/** Additional attempts after a transient refresh failure. */
const RECOVERY_ATTEMPTS = 3;
const RECOVERY_DELAY_MS = 1000;
const ROTATION_RETRY_DELAYS_MS = [250, 500, 1000, 2000, 3000];

type RefreshAttemptResult = RefreshResult | "rotation-conflict";
type Listener = (status: SessionStatus) => void;

let status: SessionStatus = "active";
const listeners = new Set<Listener>();

let refreshPromise: Promise<RefreshResult> | null = null;
let recoveryPromise: Promise<RefreshResult> | null = null;
let loggingOut = false;

function getApiBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";
  return baseUrl.endsWith("/api") ? baseUrl : baseUrl + "/api";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setStatus(next: SessionStatus): void {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener(status));
}

async function requestRefresh(): Promise<RefreshAttemptResult> {
  if (loggingOut) return "cancelled";
  try {
    const response = await fetch(getApiBaseUrl() + "/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) return "refreshed";
    if (response.status === 409) return "rotation-conflict";
    if (response.status === 401) return "invalid";
    return "temporary";
  } catch {
    return "temporary";
  }
}

async function refreshWithRotationRetry(): Promise<RefreshResult> {
  for (let attempt = 0; ; attempt++) {
    const result = await requestRefresh();
    if (result !== "rotation-conflict") return result;

    const retryDelay = ROTATION_RETRY_DELAYS_MS[attempt];
    if (retryDelay === undefined) return "invalid";
    await delay(retryDelay);
  }
}

export function getSessionStatus(): SessionStatus {
  return status;
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Refresh the access token. Invalid credentials and temporary service/network
 * failures are kept distinct so temporary outages never force a logout.
 */
export function refreshSession(): Promise<RefreshResult> {
  if (loggingOut) return Promise.resolve("cancelled");
  if (!refreshPromise) {
    const refreshAcrossTabs = async (): Promise<RefreshResult> => {
      if (typeof navigator !== "undefined" && navigator.locks) {
        return navigator.locks.request("care-home-auth-refresh", () =>
          refreshWithRotationRetry(),
        );
      }
      return refreshWithRotationRetry();
    };

    refreshPromise = refreshAcrossTabs()
      .catch((): RefreshResult => "temporary")
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function expireSession(): void {
  if (!loggingOut) setStatus("expired");
}

/**
 * Retry temporary refresh failures quietly. Only an explicit invalid-token
 * response ends the session; transient errors leave the user signed in.
 */
export function recoverSession(): Promise<RefreshResult> {
  if (loggingOut) return Promise.resolve("cancelled");
  if (status === "expired") return Promise.resolve("invalid");
  if (!recoveryPromise) {
    recoveryPromise = (async (): Promise<RefreshResult> => {
      for (let attempt = 0; attempt < RECOVERY_ATTEMPTS; attempt++) {
        if (loggingOut) return "cancelled";

        const result = await refreshSession();
        if (result === "refreshed") {
          setStatus("active");
          return result;
        }
        if (result === "invalid") {
          expireSession();
          return result;
        }
        if (result === "cancelled") return result;

        if (attempt < RECOVERY_ATTEMPTS - 1) {
          await delay(RECOVERY_DELAY_MS * (attempt + 1));
        }
      }
      return "temporary";
    })().finally(() => {
      recoveryPromise = null;
    });
  }
  return recoveryPromise;
}

export function resetSessionStatus(): void {
  loggingOut = false;
  setStatus("active");
}

export function beginLogout(): void {
  loggingOut = true;
  setStatus("active");
}
