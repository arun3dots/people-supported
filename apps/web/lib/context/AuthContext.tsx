"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { RolePermissions } from "@repo/schema";
import {
  beginLogout,
  expireSession,
  recoverSession,
  refreshSession,
  resetSessionStatus,
  subscribeSession,
  type RefreshResult,
} from "../auth/sessionManager";

interface User {
  userId: string;
  email: string;
  fullName: string;
  roleName: string;
  tenantId: string | null;
  mfaVerified?: boolean;
  permissions?: RolePermissions;
  subscriptionStatus?: string;
  paymentUrl?: string;
  emailVerified?: boolean;
  avatarUrl?: string | null;
  branchIds?: string[];
  activeBranchId?: string | null;
}

export interface LoginResult {
  requiresMfa?: boolean;
  mfaSetupRequired?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { email: string; password: string }) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes (before 15m access token expires)
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
const ACTIVITY_BROADCAST_INTERVAL_MS = 5000;
const ACTIVITY_CHANNEL_NAME = "care-home-auth-activity";

function getApiBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const API_URL = getApiBaseUrl();

  const silentRefresh = useCallback(
    (): Promise<RefreshResult> => refreshSession(),
    [],
  );

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    refreshTimerRef.current = setInterval(async () => {
      const result = await silentRefresh();
      if (result === "invalid") {
        expireSession();
      } else if (result === "temporary") {
        await recoverSession();
      }
    }, REFRESH_INTERVAL_MS);
  }, [silentRefresh]);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    beginLogout();
    stopRefreshTimer();
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    setUser(null);
    window.location.replace("/login");
  }, [API_URL, stopRefreshTimer]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const userData = (await res.json()) as User;
        setUser(userData);
        lastActivityRef.current = Date.now();
        resetSessionStatus();
        if (userData.mfaVerified === false) {
          stopRefreshTimer();
        } else {
          startRefreshTimer();
        }
      } else {
        let refreshResult = await silentRefresh();
        if (refreshResult === "temporary") {
          refreshResult = await recoverSession();
        }
        if (refreshResult === "refreshed") {
          const retryRes = await fetch(`${API_URL}/auth/me`, {
            method: "POST",
            credentials: "include",
          });
          if (retryRes.ok) {
            const userData = (await retryRes.json()) as User;
            setUser(userData);
            lastActivityRef.current = Date.now();
            resetSessionStatus();
            if (userData.mfaVerified === false) {
              stopRefreshTimer();
            } else {
              startRefreshTimer();
            }
          } else {
            setUser(null);
            stopRefreshTimer();
          }
        } else {
          setUser(null);
          stopRefreshTimer();
        }
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
      stopRefreshTimer();
    } finally {
      setLoading(false);
    }
  }, [API_URL, silentRefresh, startRefreshTimer, stopRefreshTimer]);

  useEffect(() => {
    refreshUser();
    return () => stopRefreshTimer();
  }, [refreshUser, stopRefreshTimer]);

  useEffect(
    () =>
      subscribeSession((status) => {
        if (status === "expired") {
          setUser(null);
          stopRefreshTimer();
        }
      }),
    [stopRefreshTimer],
  );

  // Client-side inactivity auto-logout
  useEffect(() => {
    if (!user) return;

    const activityChannel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(ACTIVITY_CHANNEL_NAME);
    let lastActivityBroadcast = 0;

    const updateActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (
        activityChannel &&
        now - lastActivityBroadcast >= ACTIVITY_BROADCAST_INTERVAL_MS
      ) {
        activityChannel.postMessage({ type: "activity", at: now });
        lastActivityBroadcast = now;
      }
    };

    const handleActivityMessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data !== "object" || event.data === null) return;
      const message = event.data as { type?: unknown; at?: unknown };
      if (
        message.type !== "activity" ||
        typeof message.at !== "number" ||
        !Number.isFinite(message.at)
      ) {
        return;
      }

      const now = Date.now();
      if (message.at <= now && now - message.at < IDLE_TIMEOUT_MS) {
        lastActivityRef.current = Math.max(lastActivityRef.current, message.at);
      }
    };

    activityChannel?.addEventListener("message", handleActivityMessage);
    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));
    window.addEventListener("focus", updateActivity);

    const idleChecker = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        console.warn("User session timed out due to 15 minutes of inactivity");
        void logout();
      }
    }, 15000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
      window.removeEventListener("focus", updateActivity);
      activityChannel?.removeEventListener("message", handleActivityMessage);
      activityChannel?.close();
      clearInterval(idleChecker);
    };
  }, [user, logout]);

  const login = async (data: {
    email: string;
    password: string;
  }): Promise<LoginResult> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Login failed");
    }

    const body = (await res.json()) as {
      requiresMfa?: boolean;
      mfaSetupRequired?: boolean;
    };
    const result = {
      requiresMfa: Boolean(body.requiresMfa),
      mfaSetupRequired: Boolean(body.mfaSetupRequired),
    };
    if (result.requiresMfa) {
      setUser(null);
      stopRefreshTimer();
      resetSessionStatus();
      return result;
    }

    await refreshUser();
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
