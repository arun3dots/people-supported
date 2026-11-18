import { GET_NOTIFICATIONS } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';

/** Unread notification surfaced on the dashboard as a critical alert. */
export interface DashboardAlert {
  id: string;
  title: string;
  message: string;
  priority: string;
  category: string;
  createdAt: string | null;
  actionUrl: string | null;
}

interface RawNotificationAlert {
  id?: string;
  title?: string;
  message?: string;
  priority?: string;
  category?: string;
  isRead?: boolean;
  actionUrl?: string | null;
  createdAt?: string | Date;
}

function toIsoOrNull(value?: string | Date): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

export async function loadDashboardAlerts(): Promise<DashboardAlert[]> {
  let urgentAlerts: DashboardAlert[] = [];
  try {
    const alertsRes = await makeMobileApiCall<
      { data?: RawNotificationAlert[] } | RawNotificationAlert[]
    >(GET_NOTIFICATIONS, undefined, { limit: 20, isRead: false });

    const list: RawNotificationAlert[] = Array.isArray(alertsRes)
      ? alertsRes
      : Array.isArray(alertsRes?.data)
        ? alertsRes.data
        : [];

    urgentAlerts = list.filter((a): a is RawNotificationAlert & { id: string } => typeof a.id === 'string' && Boolean(a.id)).map((a) => ({
      id: a.id,
      title: a.title?.trim() || a.message?.trim() || a.category?.trim() || 'Notification',
      message: a.message?.trim() || '',
      priority: a.priority?.trim() || 'Not recorded',
      category: a.category?.trim() || 'Uncategorized',
      createdAt: toIsoOrNull(a.createdAt),
      actionUrl: a.actionUrl ?? null,
    }));
  } catch (error) {
    throw error;
  }

  return urgentAlerts;
}
