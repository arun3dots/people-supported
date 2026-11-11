import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma, Prisma } from '@repo/db';
import type {
  NotificationListQueryDTO,
  PushSubscriptionDTO,
  RegisterDeviceTokenDTO,
  UpdateNotificationPreferencesDTO,
} from '@repo/schema';
import {
  AlertTriggerParams,
  NotificationChannel,
  NotificationJobData,
  NotificationPriority,
} from './notifications.types';
import {
  MatrixSourceCode,
  NOTIFICATION_MATRIX,
  resolveMatrixRecipients,
} from './notification-matrix';
import { paginate, resolvePagination } from '../common/utils/pagination.util';

export interface MatrixAlertInput {
  tenantId: string;
  branchId?: string | null;
  title: string;
  message: string;
  actionUrl?: string;
  priorityOverride?: NotificationPriority;
  explicitRecipientIds?: string[];
  onlyExplicitRecipients?: boolean;
  residentId?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
  dedupeWindowHours?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  /**
   * Triggers a notification strictly following the canonical 20-row Notification Matrix.
   */
  async triggerMatrixAlert(
    code: MatrixSourceCode,
    input: MatrixAlertInput,
  ): Promise<void> {
    const rule = NOTIFICATION_MATRIX[code];
    const recipientIds = input.onlyExplicitRecipients
      ? Array.from(new Set(input.explicitRecipientIds ?? []))
      : await resolveMatrixRecipients({
          tenantId: input.tenantId,
          rule,
          explicitRecipientIds: input.explicitRecipientIds,
          residentId: input.residentId,
        });

    for (const recipientId of recipientIds) {
      await this.triggerAlert({
        tenantId: input.tenantId,
        branchId: input.branchId,
        recipientId,
        title: input.title,
        message: input.message,
        category: rule.category,
        priority: input.priorityOverride ?? rule.priority,
        channels: rule.channels,
        inApp: rule.inApp,
        sourceCode: rule.code,
        actionUrl: input.actionUrl,
        dedupeKey: input.dedupeKey,
        dedupeWindowHours: input.dedupeWindowHours,
        metadata: {
          ...input.metadata,
          sourceCode: rule.code,
          matrixNotification: rule.notification,
        },
      });
    }
  }

  async triggerAlert(params: AlertTriggerParams): Promise<void> {
    try {
      // 0. Optional deduplication check for cron/threshold alerts
      if (params.dedupeKey && prisma.notification?.findFirst) {
        const windowHours = params.dedupeWindowHours ?? 20;
        const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
        const existing = await prisma.notification.findFirst({
          where: {
            tenantId: params.tenantId,
            recipientId: params.recipientId,
            createdAt: { gte: since },
            metadata: {
              path: ['dedupeKey'],
              equals: params.dedupeKey,
            },
          },
          select: { id: true },
        });
        if (existing) {
          this.logger.debug(
            `Skipping duplicate notification (${params.dedupeKey}) for ${params.recipientId}`,
          );
          return;
        }
      }

      // 1. Fetch recipient data and preferences
      const recipient = await prisma.user.findUnique({
        where: { id: params.recipientId },
        include: {
          notificationPreference: true,
          pushSubscriptions: true,
          profile: true,
          deviceTokens: true,
        },
      });

      if (!recipient || !recipient.isActive) {
        this.logger.warn(
          `Recipient ${params.recipientId} not found or inactive. Skipping alert.`,
        );
        return;
      }

      // 2. Determine enabled external channels based on matrix config, preferences, and criticality
      const isCritical =
        params.priority === 'Critical' || params.priority === 'Urgent';
      const prefs = recipient.notificationPreference;

      const emailPref = isCritical || (prefs ? prefs.emailEnabled : true);
      const webPref = isCritical || (prefs ? prefs.webEnabled : true);
      const smsPref = isCritical || (prefs ? prefs.smsEnabled : false);
      const mobilePushPref = isCritical || (prefs ? prefs.pushEnabled : true);

      const hasWebPush = recipient.pushSubscriptions.length > 0;
      const hasMobileTokens =
        Boolean(recipient.deviceTokens) && recipient.deviceTokens.length > 0;
      const canSendPush =
        (webPref && hasWebPush) || (mobilePushPref && hasMobileTokens);

      const requested = params.channels;
      const wantsChannel = (ch: NotificationChannel) =>
        !requested || requested.includes(ch);

      const externalChannels: NotificationChannel[] = [];

      const shouldSendEmail = params.preferPushOverEmail
        ? !canSendPush
        : emailPref;

      if (wantsChannel('EMAIL') && shouldSendEmail && recipient.email) {
        externalChannels.push('EMAIL');
      }
      if (wantsChannel('WEB_PUSH') && webPref && hasWebPush) {
        externalChannels.push('WEB_PUSH');
      }
      if (
        wantsChannel('SMS') &&
        smsPref &&
        Boolean(recipient.profile?.phoneNumber)
      ) {
        externalChannels.push('SMS');
      }
      if (wantsChannel('MOBILE_PUSH') && mobilePushPref && hasMobileTokens) {
        externalChannels.push('MOBILE_PUSH');
      }

      const persistInApp =
        params.inApp !== false &&
        (!requested ||
          requested.includes('IN_APP') ||
          externalChannels.length > 0 ||
          params.inApp === true);

      if (!persistInApp && externalChannels.length === 0) {
        this.logger.debug(
          `No enabled channels for recipient ${params.recipientId}.`,
        );
        return;
      }

      const combinedMetadata: Record<string, unknown> = {
        ...(params.metadata ?? {}),
        ...(params.sourceCode ? { sourceCode: params.sourceCode } : {}),
        ...(params.dedupeKey ? { dedupeKey: params.dedupeKey } : {}),
      };

      // 3. Persist notification history in-app
      if (persistInApp) {
        const storedChannels: NotificationChannel[] = [
          'IN_APP',
          ...externalChannels,
        ];
        await prisma.notification.create({
          data: {
            tenantId: params.tenantId,
            ...(params.branchId ? { branchId: params.branchId } : {}),
            recipient: { connect: { id: params.recipientId } },
            title: params.title,
            message: params.message,
            category: params.category,
            priority: params.priority || 'Medium',
            actionUrl: params.actionUrl,
            metadata:
              Object.keys(combinedMetadata).length > 0
                ? (JSON.parse(
                    JSON.stringify(combinedMetadata),
                  ) as Prisma.InputJsonValue)
                : undefined,
            channels: storedChannels,
          },
        });
      }

      // 4. Enqueue external channels for background processing
      if (externalChannels.length > 0) {
        await this.notificationQueue.add(
          'send-notification',
          {
            ...params,
            metadata: combinedMetadata,
            channels: externalChannels,
          } as NotificationJobData,
          {
            priority: this.mapPriority(params.priority || 'Medium'),
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
      }

      this.logger.debug(
        `Alert triggered for ${params.recipientId}: ${params.title}`,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to trigger alert: ${msg}`, stack);
    }
  }

  private mapPriority(priority: string): number {
    switch (priority) {
      case 'Critical':
      case 'Urgent':
        return 1;
      case 'High':
        return 2;
      case 'Medium':
        return 3;
      case 'Low':
        return 4;
      default:
        return 3;
    }
  }

  async getNotifications(
    userId: string,
    activeBranchId: string | undefined,
    query: Partial<NotificationListQueryDTO> = {},
  ) {
    const slice = resolvePagination(query);
    const and: Prisma.NotificationWhereInput[] = [];

    if (activeBranchId) {
      and.push({ OR: [{ branchId: activeBranchId }, { branchId: null }] });
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      and.push({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { message: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.NotificationWhereInput = {
      recipientId: userId,
      ...(query.isRead !== undefined ? { isRead: query.isRead } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(and.length ? { AND: and } : {}),
    };

    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    return paginate(
      slice,
      (args) =>
        prisma.notification.findMany({
          where,
          ...args,
          orderBy: { createdAt: sortOrder },
        }),
      () => prisma.notification.count({ where }),
    );
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async upsertSubscription(
    userId: string,
    subscription: PushSubscriptionDTO,
    userAgent?: string,
  ) {
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;

    return prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, lastUsed: new Date(), userAgent },
      create: { userId, endpoint, p256dh, auth, userAgent },
    });
  }

  async getPreferences(userId: string) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return prefs;
  }

  async updatePreferences(
    userId: string,
    data: UpdateNotificationPreferencesDTO,
  ) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async registerDeviceToken(
    userId: string,
    tenantId: string,
    dto: RegisterDeviceTokenDTO,
  ) {
    return prisma.userDeviceToken.upsert({
      where: { token: dto.token },
      create: {
        userId,
        tenantId,
        token: dto.token,
        platform: dto.platform,
        deviceName: dto.deviceName,
        lastActiveAt: new Date(),
      },
      update: {
        userId,
        tenantId,
        platform: dto.platform,
        deviceName: dto.deviceName,
        lastActiveAt: new Date(),
      },
    });
  }
}
