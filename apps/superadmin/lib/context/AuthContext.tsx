"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { SessionLogoutDTO } from "@repo/schema";
import {
  getBrowserApiBaseUrl,
  resolveSafeSignOutDestination,
} from "../auth/apiBase";
import { isPublicSuperAdminRoute } from "../auth/middlewareAuth";
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
  tenantId?: string | null;
  mfaVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Interval for silent token refresh (12 minutes — before 15m access token expires) */
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

function isSuperAdminUser(user: User): boolean {
  return (
    user.roleName?.toUpperCase() === "SUPERADMIN" &&
    !user.tenantId &&
    user.mfaVerified === true
  );
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = getBrowserApiBaseUrl();

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

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const userData = (await res.json()) as User;
        if (!isSuperAdminUser(userData)) {
          setUser(null);
          stopRefreshTimer();
          return;
        }
        setUser(userData);
        resetSessionStatus();
        startRefreshTimer();
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
            if (!isSuperAdminUser(userData)) {
              setUser(null);
              stopRefreshTimer();
              return;
            }
            setUser(userData);
            resetSessionStatus();
            startRefreshTimer();
          } else {
            setUser(null);
            stopRefreshTimer();
          }
        } else {
          setUser(null);
          stopRefreshTimer();
          if (
            refreshResult === "invalid" &&
            typeof window !== "undefined" &&
            !isPublicSuperAdminRoute(window.location.pathname)
          ) {
            expireSession();
          }
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
    void refreshUser();
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

  const login = async (data: { email: string; password: string }) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(err.message || "Login failed");
    }

    await refreshUser();
  };

  const logout = async () => {
    beginLogout();
    stopRefreshTimer();
    let destination = "/login";
    try {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as Partial<SessionLogoutDTO>;
        destination = resolveSafeSignOutDestination(body.signOutUrl);
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    setUser(null);
    window.location.replace(destination);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser }}
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
