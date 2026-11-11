import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GET_NOTIFICATIONS,
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_READ,
} from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { formatUkTime } from '../../lib/date';

export interface MobileNotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'TASK' | 'MEDICATION' | 'CLINICAL' | 'INCIDENT' | 'SYSTEM' | string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low' | string;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
  formattedTime: string;
}

interface RawNotificationItem {
  id: string;
  title?: string;
  message?: string;
  category?: string;
  priority?: string;
  isRead?: boolean;
  actionUrl?: string | null;
  createdAt?: string | Date;
}

function formatNotificationTime(rawDate?: string | Date): string {
  if (!rawDate) return 'Just now';
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  const timeStr = formatUkTime(date);
  return `${date.getDate()} ${date.toLocaleString('en-GB', { month: 'short' })}, ${timeStr}`;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading: loading,
    isRefetching: refreshing,
    error: queryError,
    refetch,
  } = useQuery<MobileNotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await makeMobileApiCall<
          { data?: RawNotificationItem[] } | RawNotificationItem[]
        >(GET_NOTIFICATIONS, undefined, { limit: 50 });

        const rawList: RawNotificationItem[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        return rawList.map((item) => ({
          id: item.id,
          title: item.title || 'Notification',
          message: item.message || '',
          category: item.category || 'SYSTEM',
          priority: item.priority || 'Medium',
          isRead: Boolean(item.isRead),
          actionUrl: item.actionUrl || null,
          createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
          formattedTime: formatNotificationTime(item.createdAt),
        }));
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 20,
  });

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await makeMobileApiCall(MARK_NOTIFICATION_AS_READ, undefined, undefined, { id });
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<MobileNotificationItem[]>(['notifications']);

      queryClient.setQueryData<MobileNotificationItem[]>(['notifications'], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
  });

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await makeMobileApiCall(MARK_ALL_NOTIFICATIONS_READ);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<MobileNotificationItem[]>(['notifications']);

      queryClient.setQueryData<MobileNotificationItem[]>(['notifications'], (old = []) =>
        old.map((n) => ({ ...n, isRead: true }))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
  });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const urgentCount = useMemo(
    () =>
      notifications.filter(
        (n) => !n.isRead && (n.priority === 'Urgent' || n.priority === 'High')
      ).length,
    [notifications]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      await markReadMutation.mutateAsync(id);
    },
    [markReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    await markAllReadMutation.mutateAsync();
  }, [markAllReadMutation]);

  return {
    notifications,
    unreadCount,
    urgentCount,
    loading,
    refreshing,
    error: queryError instanceof Error ? queryError.message : null,
    refreshNotifications: () => refetch(),
    markAsRead,
    markAllAsRead,
  };
}

