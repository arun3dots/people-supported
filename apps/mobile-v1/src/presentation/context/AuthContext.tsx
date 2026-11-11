import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  LoginDTO,
  LoginResponseDTO,
  MfaVerifyDTO,
} from '@repo/schema';
import { LOGIN, LOGOUT, MFA_VERIFY, AUTH_ME } from '@repo/endpoints';
import { User } from '../../domain/entities/User';
import {
  saveTokens,
  clearTokens,
  saveSessionUser,
  getSessionUser,
  getAccessToken,
  getAccessTokenSync,
  getRefreshToken,
} from '../../data/security/secureStorage';
import {
  setSessionExpiredHandler,
  makeMobileApiCall,
  ensureFreshAccessToken,
} from '../../data/api/client';
import { clearQueryCache } from '../../data/api/queryClient';
import { safeLogger } from '../../data/security/safeLogger';

export interface AdminPromptInfo {
  roleName: string;
  userEmail: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  successToast: string | null;
  requiresMfa: boolean;
  adminPrompt: AdminPromptInfo | null;
  login: (credentials: LoginDTO) => Promise<boolean>;
  verifyMfa: (mfaData: MfaVerifyDTO) => Promise<boolean>;
  dismissAdminPrompt: () => void;
  updateUserAvatar: (photoUrl: string) => Promise<void>;
  updateUserProfile: (profile: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthMeResponseDTO {
  userId?: string;
  id?: string;
  sub?: string;
  email: string;
  fullName: string;
  roleName: string;
  tenantId?: string | null;
  mfaVerified?: boolean;
  avatarUrl?: string | null;
  organizationName?: string | null;
  organizationContactName?: string | null;
}

async function loadOrganizationDetails(user: User): Promise<User> {
  try {
    const profile = await makeMobileApiCall<AuthMeResponseDTO>(AUTH_ME);
    return {
      ...user,
      avatarUrl: profile.avatarUrl ?? user.avatarUrl,
      roleName: profile.roleName ?? user.roleName,
      fullName: profile.fullName ?? user.fullName,
      organizationName: profile.organizationName ?? user.organizationName ?? null,
      organizationContactName:
        profile.organizationContactName ?? user.organizationContactName ?? null,
    };
  } catch (err) {
    safeLogger.warn('Failed to load organization profile details', err);
    return user;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAccessTokenSync());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [requiresMfa, setRequiresMfa] = useState<boolean>(false);
  const [adminPrompt, setAdminPrompt] = useState<AdminPromptInfo | null>(null);

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setToken(null);
    clearTokens();
    clearQueryCache();
    safeLogger.warn('Auth session expired, signed out user and purged query cache');
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  // Restore cached session user on cold start and revalidate from API
  useEffect(() => {
    async function restoreSession() {
      try {
        const [cached, storedToken, storedRefreshToken] = await Promise.all([
          getSessionUser<User>(),
          getAccessToken(),
          getRefreshToken(),
        ]);
        if (storedToken) {
          setToken(storedToken);
        }
        if (cached) {
          setUser(cached);
          void loadOrganizationDetails(cached)
            .then(async (updated) => {
              setUser(updated);
              await saveSessionUser(updated);
            })
            .catch((err: unknown) => {
              safeLogger.warn('Failed to save refreshed organization profile', err);
            });
        } else if (storedToken || storedRefreshToken) {
          if (!storedToken && storedRefreshToken) {
            await ensureFreshAccessToken();
          }
          const latestToken = await getAccessToken();
          if (latestToken) {
            setToken(latestToken);
            const profile = await makeMobileApiCall<AuthMeResponseDTO>(AUTH_ME).catch(() => null);
            if (profile?.email) {
              const restoredUser: User = {
                id: profile.id || profile.userId || profile.sub || '',
                email: profile.email,
                fullName: profile.fullName || profile.email,
                roleName: profile.roleName || 'Carer',
                tenantId: profile.tenantId ?? null,
                mfaVerified: Boolean(profile.mfaVerified),
                avatarUrl: profile.avatarUrl ?? null,
                organizationName: profile.organizationName ?? null,
                organizationContactName: profile.organizationContactName ?? null,
              };
              setUser(restoredUser);
              await saveSessionUser(restoredUser);
            }
          }
        }
      } catch (err) {
        safeLogger.error('Failed to restore session user', err);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (credentials: LoginDTO): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccessToast(null);
    setAdminPrompt(null);
    try {
      const res = await makeMobileApiCall<LoginResponseDTO>(LOGIN, credentials);

      if (res.requiresMfa) {
        setRequiresMfa(true);
        setLoading(false);
        return false;
      }

      if (res.user) {
        const role = res.user.roleName;
        if (role === 'Admin' || role === 'SuperAdmin') {
          await clearTokens();
          clearQueryCache();
          setUser(null);
          setAdminPrompt({
            roleName: role,
            userEmail: res.user.email,
          });
          return false;
        }

        if (res.accessToken && res.refreshToken) {
          await saveTokens(res.accessToken, res.refreshToken);
          setToken(res.accessToken);
        }
        const authenticatedUser = await loadOrganizationDetails(res.user);
        await saveSessionUser(authenticatedUser);
        setUser(authenticatedUser);
        setSuccessToast(`Welcome back, ${authenticatedUser.fullName || authenticatedUser.email}!`);
        return true;
      }

      return false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid clinical credentials';
      setError(msg);
      safeLogger.warn('Login attempt failed', msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async (mfaData: MfaVerifyDTO): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await makeMobileApiCall<LoginResponseDTO>(MFA_VERIFY, mfaData);
      if (res.user) {
        if (res.accessToken && res.refreshToken) {
          await saveTokens(res.accessToken, res.refreshToken);
          setToken(res.accessToken);
        }
        const authenticatedUser = await loadOrganizationDetails(res.user);
        await saveSessionUser(authenticatedUser);
        setUser(authenticatedUser);
        setRequiresMfa(false);
        return true;
      }
      return false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'MFA verification failed';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const dismissAdminPrompt = () => {
    setAdminPrompt(null);
  };

  const updateUserAvatar = useCallback(async (photoUrl: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: User = {
        ...prev,
        avatarUrl: photoUrl,
        profilePhotoUrl: photoUrl,
        photoUrl,
      };
      void saveSessionUser(next);
      return next;
    });
  }, []);

  const updateUserProfile = useCallback(async (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: User = {
        ...prev,
        ...partial,
      };
      void saveSessionUser(next);
      return next;
    });
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await makeMobileApiCall(LOGOUT).catch(() => {});
      await clearTokens();
      clearQueryCache();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        successToast,
        requiresMfa,
        adminPrompt,
        login,
        verifyMfa,
        dismissAdminPrompt,
        updateUserAvatar,
        updateUserProfile,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
