import { Injectable, Logger, Optional } from '@nestjs/common';
import { prisma, RiskAlert } from '@repo/db';
import type { RiskAlertType } from '@repo/schema';
import { MailService } from '../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

interface DispatchParams {
  tenantId: string;
  recipientUserIds: string[];
  riskAssessmentId?: string;
  type: RiskAlertType;
  subject: string;
  message: string;
  actionUrl?: string;
}

/**
 * Single dispatch path for risk-related alerts. Always:
 *   1. Persists a RiskAlert row per recipient (in-app badge / list)
 *   2. Persists a main Notification row per recipient (for header bell dropdown)
 *   3. Sends an email if the recipient has an email
 */
@Injectable()
export class RiskAlertsService {
  private readonly logger = new Logger(RiskAlertsService.name);

  constructor(
    private readonly mailService: MailService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Matrix MH-001: Suicide/self-harm risk — Critical rating
   * Immediate Push + in-app alert to On-shift RN/SrC + RM + MHL.
   */
  async dispatchCriticalMentalHealthAlert(params: {
    tenantId: string;
    branchId?: string | null;
    residentId: string;
    residentName: string;
    riskAssessmentId: string;
    title: string;
    category: string;
    hazardDescription: string;
    score: number;
  }): Promise<void> {
    if (!this.notificationsService) return;
    await this.notificationsService.triggerMatrixAlert('MH-001', {
      tenantId: params.tenantId,
      branchId: params.branchId,
      residentId: params.residentId,
      title: `CRITICAL RISK (${params.category}): ${params.title}`,
      message: `Critical-rated risk assessment saved for ${params.residentName} (score ${params.score}): "${params.hazardDescription}". Immediate clinical & RM intervention required.`,
      actionUrl: `/admin/residents/${params.residentId}?tab=riskassessment`,
      metadata: {
        riskAssessmentId: params.riskAssessmentId,
        residentId: params.residentId,
        category: params.category,
        score: params.score,
      },
    });
  }

  async dispatch(params: DispatchParams): Promise<void> {
    if (!params.recipientUserIds.length) return;

    let branchId: string | undefined;
    let residentId: string | undefined;
    if (params.riskAssessmentId) {
      const assessment = await prisma.riskAssessment.findUnique({
        where: { id: params.riskAssessmentId },
        select: { branchId: true, residentId: true },
      });
      branchId = assessment?.branchId;
      residentId = assessment?.residentId;
    }

    if (!branchId) {
      this.logger.warn(
        `Skipping risk alert dispatch (type=${params.type}): unable to resolve branchId`,
      );
      return;
    }

    const recipients = await prisma.user.findMany({
      where: {
        id: { in: params.recipientUserIds },
        isActive: true,
      },
      select: { id: true, email: true, fullName: true },
    });

    const actionUrl =
      params.actionUrl ||
      (residentId
        ? `/admin/residents/${residentId}?tab=riskassessment`
        : undefined);

    // 1. Create RiskAlert rows
    await prisma.riskAlert.createMany({
      data: recipients.map((r) => ({
        tenantId: params.tenantId,
        branchId,
        recipientId: r.id,
        riskAssessmentId: params.riskAssessmentId,
        type: params.type,
        message: params.message,
      })),
    });

    // 2. Create main Notification rows for the header bell dropdown
    await Promise.allSettled(
      recipients.map((r) =>
        prisma.notification.create({
          data: {
            tenantId: params.tenantId,
            recipient: { connect: { id: r.id } },
            title: params.subject,
            message: params.message,
            category: 'CLINICAL',
            priority: 'High',
            actionUrl,
            metadata: residentId
              ? { residentId, tab: 'riskassessment' }
              : undefined,
            channels: ['WEB_PUSH'],
          },
        }),
      ),
    );

    // 3. Send email notifications
    await Promise.all(
      recipients
        .filter((r) => !!r.email)
        .map((r) =>
          this.mailService
            .sendNotification(
              r.email,
              params.subject,
              params.message,
              actionUrl,
            )
            .catch((err: unknown) => {
              this.logger.warn(
                `Risk alert email failed for ${r.id}: ${
                  err instanceof Error ? err.message : 'unknown'
                }`,
              );
            }),
        ),
    );
  }

  async findApproversForTenant(tenantId: string): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, role: { select: { name: true, permissions: true } } },
    });
    return users
      .filter((u) => {
        const roleName = u.role?.name || '';
        if (['Admin', 'SuperAdmin', 'Manager'].includes(roleName)) {
          return true;
        }
        const p = u.role?.permissions;
        if (!p || typeof p !== 'object') return false;
        const ra = (p as Record<string, unknown>)['riskAssessments'];
        if (!ra || typeof ra !== 'object') return false;
        return (ra as Record<string, unknown>)['approve'] === true;
      })
      .map((u) => u.id);
  }

  async listUnread(tenantId: string, userId: string): Promise<RiskAlert[]> {
    return prisma.riskAlert.findMany({
      where: { tenantId, recipientId: userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(
    alertId: string,
    tenantId: string,
    userId: string,
  ): Promise<RiskAlert> {
    const existing = await prisma.riskAlert.findFirst({
      where: { id: alertId, tenantId, recipientId: userId },
    });
    if (!existing) {
      throw new Error('Alert not found');
    }
    return prisma.riskAlert.update({
      where: { id: alertId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async handleTransitionAlerts(
    target: string,
    id: string,
    updatedTitle: string,
    existing: {
      createdById?: string | null;
      controls?: Array<{ assignedToId?: string | null }>;
    },
    actor: { tenantId: string; userFullName: string; userId: string },
  ): Promise<void> {
    if (target === 'PendingReview') {
      const approvers = await this.findApproversForTenant(actor.tenantId);
      await this.dispatch({
        tenantId: actor.tenantId,
        recipientUserIds: approvers,
        riskAssessmentId: id,
        type: 'PendingReview',
        subject: `Risk assessment awaiting review: ${updatedTitle}`,
        message: `${actor.userFullName} has submitted a risk assessment for review.`,
      });
    }
    if (target === 'Active') {
      const recipients = new Set<string>();
      if (existing.createdById && existing.createdById !== actor.userId) {
        recipients.add(existing.createdById);
      }
      (existing.controls ?? []).forEach((c) => {
        if (c.assignedToId) recipients.add(c.assignedToId);
      });
      await this.dispatch({
        tenantId: actor.tenantId,
        recipientUserIds: Array.from(recipients),
        riskAssessmentId: id,
        type: 'Activated',
        subject: `Risk assessment activated: ${updatedTitle}`,
        message: `${actor.userFullName} approved this risk assessment. Controls are now active.`,
      });
    }
  }
}
