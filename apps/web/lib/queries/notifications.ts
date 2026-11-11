import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResponse } from "@repo/schema";
import { makeAPICall } from "../api";

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  isRead: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * The current user's notification feed. GET /notifications now returns the
 * standard paginated envelope; `select` unwraps it to a flat array so callers
 * keep working with `data` as `NotificationRow[]`.
 */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      makeAPICall<PaginatedResponse<NotificationRow> | NotificationRow[]>(
        "getNotifications",
        undefined,
        { limit: 20 },
      ),
    refetchInterval: 5000, // Poll every 5 seconds for "live" feel
    staleTime: 0,
    select: (res) => (Array.isArray(res) ? res : (res?.data ?? [])),
  });
}

export interface NotificationHistoryParams {
  page: number;
  limit: number;
  search?: string;
  isRead?: boolean;
}

export function useNotificationHistory({
  page,
  limit,
  search,
  isRead,
}: NotificationHistoryParams) {
  return useQuery({
    queryKey: ["notifications", "history", { page, limit, search, isRead }],
    queryFn: () =>
      makeAPICall<PaginatedResponse<NotificationRow>>(
        "getNotifications",
        undefined,
        {
          page,
          limit,
          sortOrder: "desc",
          ...(search ? { search } : {}),
          ...(isRead !== undefined ? { isRead } : {}),
        },
      ),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      makeAPICall("markNotificationAsRead", {}, {}, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => makeAPICall("markAllNotificationsRead"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSubscribeToPush() {
  return useMutation({
    mutationFn: (subscription: PushSubscriptionJSON | Record<string, unknown>) =>
      makeAPICall("subscribeToPush", subscription as Record<string, unknown>),
  });
}

/**
 * Notification delivery-channel preferences, matching the `NotificationPreference`
 * model returned by GET /api/notifications/preferences.
 */
export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  webEnabled: boolean;
}

export type UpdateNotificationPreferences = Partial<
  Pick<
    NotificationPreferences,
    "emailEnabled" | "smsEnabled" | "pushEnabled" | "webEnabled"
  >
>;

const PREFERENCES_QUERY_KEY = ["notificationPreferences"];

export function useGetNotificationPreferencesQuery() {
  return useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: () => makeAPICall<NotificationPreferences>("getNotificationPreferences"),
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferences) =>
      makeAPICall<NotificationPreferences>(
        "updateNotificationPreferences",
        payload as Record<string, unknown>,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
    },
  });
}
