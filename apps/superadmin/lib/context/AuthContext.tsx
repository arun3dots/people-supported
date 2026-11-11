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
import { useRouter } from "next/navigation";
import {
  beginLogout,
  recoverSession,
  refreshSession,
  resetSessionStatus,
  subscribeSession,
} from "../auth/sessionManager";

/**
 * The platform admin behind this app. Unlike the tenant web app, a SuperAdmin
 * has no tenant, permissions, subscription or MFA state — so this is the
 * trimmed-down mirror of `apps/web`'s `AuthContext` user.
 */
interface User {
  userId: string;
  email: string;
  fullName: string;
  roleName: string;
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

function getApiBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = getApiBaseUrl();

  /**
   * Silently refresh the access token. Delegates to the shared session manager
   * so this and `makeAPICall`'s 401 handler never fire two refreshes at once
   * (which the backend would treat as token reuse and revoke the whole family).
   */
  const silentRefresh = useCallback(
    (): Promise<boolean> => refreshSession(),
    [],
  );

  /** Start the automatic refresh timer */
  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    refreshTimerRef.current = setInterval(async () => {
      const success = await silentRefresh();
      if (!success) {
        // Proactive refresh failed — hand off to the visible recovery flow
        // (popup + background retries). The SessionReauthDialog owns the
        // session-timeout message and redirect if recovery ultimately fails.
        await recoverSession();
      }
    }, REFRESH_INTERVAL_MS);
  }, [silentRefresh]);

  /** Stop the refresh timer */
  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /** Fetch the current user from the /auth/me endpoint */
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const userData: User = await res.json();
        setUser(userData);
        resetSessionStatus();
        startRefreshTimer();
      } else {
        // Access token expired — try silent refresh, then retry once.
        const refreshed = await silentRefresh();
        if (refreshed) {
          const retryRes = await fetch(`${API_URL}/auth/me`, {
            method: "POST",
            credentials: "include",
          });
          if (retryRes.ok) {
            const userData: User = await retryRes.json();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the session manager gives up (every refresh retry failed), clear the
  // user and stop the timer. The SessionReauthDialog handles the redirect.
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Login failed");
    }

    await refreshUser();
  };

  const logout = async () => {
    // Suppress the reauth popup: clearing cookies will 401 any racing request,
    // but that is an intentional logout, not a session timeout.
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
    router.push("/login");
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
