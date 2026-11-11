import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

export interface OTAUpdateState {
  isEnabled: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  isPromptVisible: boolean;
  lastCheckedTime: Date | null;
  error: string | null;
  checkAndDownloadUpdate: () => Promise<void>;
  reloadToApplyUpdate: () => Promise<void>;
  dismissUpdatePrompt: () => void;
}

/**
 * Hook to manage Over-The-Air (OTA) updates safely in CareHome Point-of-Care.
 * In development or Expo Go, it safely no-ops without throwing exceptions.
 * In release builds, it checks and fetches updates in the background,
 * alerting staff without abruptly interrupting active clinical logging.
 */
export function useOTAUpdates(): OTAUpdateState {
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [isUpdateReady, setIsUpdateReady] = useState<boolean>(false);
  const [isPromptVisible, setIsPromptVisible] = useState<boolean>(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEnabled = !__DEV__ && Boolean(Updates.isEnabled);
  const isCheckingRef = useRef(false);

  const checkAndDownloadUpdate = useCallback(async () => {
    if (!isEnabled || isCheckingRef.current) {
      return;
    }

    try {
      isCheckingRef.current = true;
      setIsChecking(true);
      setError(null);

      const checkResult = await Updates.checkForUpdateAsync();
      setLastCheckedTime(new Date());

      if (checkResult.isAvailable) {
        setIsUpdateAvailable(true);
        setIsDownloading(true);

        const fetchResult = await Updates.fetchUpdateAsync();
        setIsDownloading(false);

        if (fetchResult.isNew) {
          setIsUpdateReady(true);
          setIsPromptVisible(true);
        }
      } else {
        setIsUpdateAvailable(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to check for updates';
      setError(message);
    } finally {
      setIsChecking(false);
      setIsDownloading(false);
      isCheckingRef.current = false;
    }
  }, [isEnabled]);

  const reloadToApplyUpdate = useCallback(async () => {
    if (!isEnabled) {
      setIsPromptVisible(false);
      return;
    }
    try {
      await Updates.reloadAsync();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reload app';
      setError(message);
    }
  }, [isEnabled]);

  const dismissUpdatePrompt = useCallback(() => {
    setIsPromptVisible(false);
  }, []);

  // Initial check on app start with small delay to avoid blocking startup renders
  useEffect(() => {
    if (!isEnabled) return;

    const timer = setTimeout(() => {
      checkAndDownloadUpdate();
    }, 4000);

    return () => clearTimeout(timer);
  }, [isEnabled, checkAndDownloadUpdate]);

  // Check when returning from background (throttled to at most once every 30 minutes)
  useEffect(() => {
    if (!isEnabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        if (!lastCheckedTime || lastCheckedTime.getTime() < thirtyMinutesAgo) {
          checkAndDownloadUpdate();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isEnabled, lastCheckedTime, checkAndDownloadUpdate]);

  return {
    isEnabled,
    isChecking,
    isDownloading,
    isUpdateAvailable,
    isUpdateReady,
    isPromptVisible,
    lastCheckedTime,
    error,
    checkAndDownloadUpdate,
    reloadToApplyUpdate,
    dismissUpdatePrompt,
  };
}
