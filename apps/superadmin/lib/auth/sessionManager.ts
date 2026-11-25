import { resolveApiUrl } from "./apiBase";

export type RefreshResult = "refreshed" | "invalid" | "temporary" | "cancelled";
export type SessionStatus = "active" | "reauthenticating" | "expired";

const RECOVERY_ATTEMPTS = 3;
const RECOVERY_DELAY_MS = 1500;
const ROTATION_RETRY_DELAYS_MS = [250, 500, 1000, 2000, 3000];

type RefreshAttemptResult = RefreshResult | "rotation-conflict";
type Listener = (status: SessionStatus) => void;

let status: SessionStatus = "active";
const listeners = new Set<Listener>();

let refreshPromise: Promise<RefreshResult> | null = null;
let recoveryPromise: Promise<RefreshResult> | null = null;
let loggingOut = false;

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
    const response = await fetch(resolveApiUrl("/auth/refresh").toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      credentials: "include",
    });

    if (response.ok) return "refreshed";
    if (response.status === 409) return "rotation-conflict";
    if (response.status === 401 || response.status === 403) return "invalid";
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

export function expireSession(): void {
  if (!loggingOut) setStatus("expired");
}

export function refreshSession(): Promise<RefreshResult> {
  if (loggingOut) return Promise.resolve("cancelled");
  if (!refreshPromise) {
    const refreshAcrossTabs = async (): Promise<RefreshResult> => {
      if (typeof navigator !== "undefined" && navigator.locks) {
        return navigator.locks.request("care-home-superadmin-refresh", () =>
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

export function recoverSession(): Promise<RefreshResult> {
  if (loggingOut) return Promise.resolve("cancelled");
  if (status === "expired") return Promise.resolve("invalid");
  if (!recoveryPromise) {
    recoveryPromise = (async (): Promise<RefreshResult> => {
      setStatus("reauthenticating");
      for (let attempt = 0; attempt < RECOVERY_ATTEMPTS; attempt++) {
        if (loggingOut) {
          setStatus("active");
          return "cancelled";
        }
        const result = await refreshSession();
        if (result === "refreshed") {
          setStatus("active");
          return result;
        }
        if (result === "invalid") {
          setStatus("expired");
          return result;
        }
        if (result === "cancelled") {
          setStatus("active");
          return result;
        }
        if (attempt < RECOVERY_ATTEMPTS - 1) {
          await delay(RECOVERY_DELAY_MS);
        }
      }
      setStatus(loggingOut ? "active" : "expired");
      return loggingOut ? "cancelled" : "temporary";
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
