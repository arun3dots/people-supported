export type NotificationPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Urgent'
  | 'Critical';

export type NotificationCategory =
  | 'MEDICATION'
  | 'TASK'
  | 'SYSTEM'
  | 'CLINICAL'
  | 'CARE_PLAN'
  | 'INCIDENT'
  | 'SAFEGUARDING'
  | 'COMPLIANCE'
  | 'HR'
  | 'ROTA'
  | 'FINANCE'
  | 'OCCUPANCY';

export type NotificationChannel =
  | 'IN_APP'
  | 'EMAIL'
  | 'SMS'
  | 'MOBILE_PUSH'
  | 'WEB_PUSH';

export interface AlertTriggerParams {
  tenantId: string;
  branchId?: string | null;
  recipientId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  preferPushOverEmail?: boolean;
  /** Optional explicit channels from the Notification Matrix */
  channels?: NotificationChannel[];
  /** Whether to persist in the in-app notification feed (defaults to true) */
  inApp?: boolean;
  /** Matrix source feature code (e.g. EMAR-001, INC-004, CP-007) */
  sourceCode?: string;
  /** Optional deduplication key to prevent duplicate cron alerts */
  dedupeKey?: string;
  /** Deduplication lookback window in hours (defaults to 20 hours) */
  dedupeWindowHours?: number;
}

export interface NotificationJobData extends AlertTriggerParams {
  channels: NotificationChannel[];
}

export interface NotificationProvider {
  send(params: {
    recipient: {
      email?: string;
      phoneNumber?: string;
      pushSubscriptions?: Array<{
        endpoint: string;
        p256dh: string;
        auth: string;
      }>;
      fcmTokens?: string[];
    };
    title: string;
    message: string;
    priority: NotificationPriority;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; error?: string }>;
}
