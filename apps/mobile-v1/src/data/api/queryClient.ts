import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: Platform.OS === 'web',
    },
  },
});

/**
 * Completely clears in-memory query cache upon logout or session expiration,
 * ensuring no resident health records or PII remain in RAM.
 */
export function clearQueryCache(): void {
  queryClient.clear();
}

