import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { getOfflineQueue, processOfflineQueue } from '../../data/api/offlineQueue';
import { safeLogger } from '../../data/security/safeLogger';
import { formatUkTime } from '../../lib/date';

export interface OfflineSyncContextType {
  pendingCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncTime: string | null;
  syncNow: () => Promise<{ succeeded: number; failed: number }>;
  refreshQueueCount: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | null>(null);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const wasOffline = useRef<boolean>(false);

  const refreshQueueCount = useCallback(async () => {
    try {
      const queue = await getOfflineQueue();
      setPendingCount(queue.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const syncNow = useCallback(async (): Promise<{ succeeded: number; failed: number }> => {
    setIsSyncing(true);
    try {
      const result = await processOfflineQueue();
      setPendingCount(result.remaining);
      setLastSyncTime(formatUkTime(new Date()));
      if (result.succeeded > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['residentTimeline'] }),
          queryClient.invalidateQueries({ queryKey: ['shift-resident-activity'] }),
          queryClient.invalidateQueries({ queryKey: ['resident-medication-rounds'] }),
          queryClient.invalidateQueries({ queryKey: ['foodFluidSummary'] }),
        ]);
      }
      return { succeeded: result.succeeded, failed: result.failed };
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  // 1. Initial queue check and periodic refresh
  useEffect(() => {
    refreshQueueCount();
    const interval = setInterval(refreshQueueCount, 15000); // Poll local queue status every 15s
    return () => clearInterval(interval);
  }, [refreshQueueCount]);

  // 2. NetInfo listener: automatically trigger sync when network reconnects
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      if (online && wasOffline.current) {
        safeLogger.info('Network connection restored. Initiating automatic offline queue sync.');
        void syncNow();
      }
      wasOffline.current = !online;
    });

    return () => unsubscribe();
  }, [syncNow]);

  return (
    <OfflineSyncContext.Provider
      value={{
        pendingCount,
        isSyncing,
        isOnline,
        lastSyncTime,
        syncNow,
        refreshQueueCount,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSync(): OfflineSyncContextType {
  const ctx = useContext(OfflineSyncContext);
  if (!ctx) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return ctx;
}
