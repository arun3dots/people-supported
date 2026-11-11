import { NotificationsService } from '../../notifications/notifications.service';

export interface CarePlanNotificationPayload {
  tenantId: string;
  recipientId: string;
  title: string;
  message: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  actionUrl?: string;
}

export async function sendCarePlanAlert(
  notificationsService: NotificationsService,
  payload: CarePlanNotificationPayload,
): Promise<void> {
  try {
    await notificationsService.triggerAlert({
      tenantId: payload.tenantId,
      recipientId: payload.recipientId,
      title: payload.title,
      message: payload.message,
      category: 'CARE_PLAN',
      priority: payload.priority || 'Medium',
      actionUrl: payload.actionUrl,
    });
  } catch {
    // Non-blocking alert failure
  }
}
