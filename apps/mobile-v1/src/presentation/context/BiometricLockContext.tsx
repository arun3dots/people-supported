import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import {
  verifyQuickPin,
  getAccessToken,
  getRefreshToken,
} from '../../data/security/secureStorage';
import { authenticateWithBiometrics } from '../../data/security/biometricAuth';
import { ensureFreshAccessToken } from '../../data/api/client';
import { safeLogger } from '../../data/security/safeLogger';

const DEFAULT_TIMEOUT_SECONDS = 900; // 15 minutes standard clinical inactivity timeout under UK DSPT

export interface BiometricLockContextType {
  isLocked: boolean;
  isPinConfigured: boolean;
  lockNow: () => void;
  resetLock: () => void;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  refreshPinStatus: () => Promise<void>;
}

const BiometricLockContext = createContext<BiometricLockContextType | null>(null);

export function BiometricLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  // Device screen lock / biometrics is used natively, so no separate in-app PIN setup is required
  const [isPinConfigured] = useState<boolean>(true);
  const lastActiveTimestamp = useRef<number>(Date.now());
  const appState = useRef<AppStateStatus>((AppState.currentState as AppStateStatus) ?? 'active');

  const refreshPinStatus = useCallback(async () => {
    // Kept for backwards compatibility with existing callers
  }, []);

  // AppState monitoring for backgrounding & silent session re-authentication
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        lastActiveTimestamp.current = Date.now();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const elapsedSeconds = (Date.now() - lastActiveTimestamp.current) / 1000;
        void (async () => {
          const [accessToken, refreshToken] = await Promise.all([
            getAccessToken(),
            getRefreshToken(),
          ]);
          const hasStoredSession = Boolean(accessToken || refreshToken);
          if (!hasStoredSession) return;

          if (elapsedSeconds >= DEFAULT_TIMEOUT_SECONDS && Platform.OS !== 'web') {
            safeLogger.info(`Inactivity timeout reached (${Math.round(elapsedSeconds)}s). Prompting device unlock.`);
            setIsLocked(true);
          } else {
            // Proactively refresh the access token when returning to the app
            void ensureFreshAccessToken();
          }
        })();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const lockNow = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    const isValid = await verifyQuickPin(pin);
    if (isValid) {
      setIsLocked(false);
      lastActiveTimestamp.current = Date.now();
      void ensureFreshAccessToken();
      return true;
    }
    return false;
  }, []);

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    const success = await authenticateWithBiometrics(
      'Unlock with your device password or biometrics to continue'
    );
    if (success) {
      setIsLocked(false);
      lastActiveTimestamp.current = Date.now();
      // Silently re-authenticate the backend session using the stored refresh token
      void ensureFreshAccessToken();
      return true;
    }
    return false;
  }, []);

  const resetLock = useCallback(() => {
    setIsLocked(false);
    lastActiveTimestamp.current = Date.now();
  }, []);

  return (
    <BiometricLockContext.Provider
      value={{
        isLocked,
        isPinConfigured,
        lockNow,
        resetLock,
        unlockWithPin,
        unlockWithBiometrics,
        refreshPinStatus,
      }}
    >
      {children}
    </BiometricLockContext.Provider>
  );
}

export function useBiometricLock(): BiometricLockContextType {
  const ctx = useContext(BiometricLockContext);
  if (!ctx) {
    throw new Error('useBiometricLock must be used within a BiometricLockProvider');
  }
  return ctx;
}
