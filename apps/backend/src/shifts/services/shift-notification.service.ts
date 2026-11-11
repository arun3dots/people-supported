import { Injectable, Logger, Optional } from '@nestjs/common';
import { prisma } from '@repo/db';
import { MailService } from '../../common/mail/mail.service';

export interface ShiftNotificationTarget {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  shift: {
    id: string;
    startTime: Date | string;
    endTime: Date | string;
    type?: { name?: string } | null;
    wing?: { name?: string } | null;
    tenantId?: string;
    branchId?: string | null;
  };
  tenantName?: string;
}

@Injectable()
export class ShiftNotificationService {
  private readonly logger = new Logger(ShiftNotificationService.name);

  constructor(@Optional() private readonly mailService?: MailService) {}

  private formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Dispatches an immediate email and in-app notification when a shift is assigned to a carer.
   */
  async sendAssignmentNotification(
    target: ShiftNotificationTarget,
  ): Promise<void> {
    const { user, shift, tenantName } = target;
    if (!user.email) return;

    const shiftType = shift.type?.name || 'Scheduled Shift';
    const dateStr = this.formatDate(shift.startTime);
    const startStr = this.formatTime(shift.startTime);
    const endStr = this.formatTime(shift.endTime);
    const location = shift.wing?.name ? `Wing: ${shift.wing.name}` : undefined;
    const organization = tenantName || 'Cantra Care';

    const subject = `New Shift Assigned: ${shiftType} on ${dateStr}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const actionUrl = `${frontendUrl}/carer/rota`;

    const htmlMessage =
      `Hello ${user.fullName},<br><br>` +
      `You have been assigned to a shift at <strong>${organization}</strong>.<br><br>` +
      `<strong>Shift:</strong> ${shiftType}<br>` +
      `<strong>Date:</strong> ${dateStr}<br>` +
      `<strong>Time:</strong> ${startStr} – ${endStr}<br>` +
      (location ? `<strong>Location:</strong> ${location}<br>` : '') +
      `<br>Please log in to your rota to view your assignments and schedule details.`;

    try {
      if (this.mailService) {
        await this.mailService.sendNotification(
          user.email,
          subject,
          htmlMessage,
          actionUrl,
        );
        this.logger.log(
          `Shift assignment email sent to ${user.email} for shift ${shift.id}`,
        );
      }

      if (shift.tenantId) {
        await prisma.notification.create({
          data: {
            tenantId: shift.tenantId,
            branchId: shift.branchId || null,
            recipientId: user.id,
            title: 'New Shift Assigned',
            message: `You have been assigned to a ${shiftType} on ${dateStr} (${startStr} - ${endStr}).`,
            category: 'ROTA',
            priority: 'Medium',
            actionUrl: '/carer/rota',
            channels: ['IN_APP', 'EMAIL'],
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to dispatch shift assignment notification for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Dispatches an immediate email and in-app notification when an assigned shift is extended or rescheduled.
   */
  async sendShiftUpdatedNotification(
    target: ShiftNotificationTarget & {
      previousEndTime?: Date | string;
      isExtended?: boolean;
    },
  ): Promise<void> {
    const { user, shift, tenantName, previousEndTime, isExtended } = target;
    if (!user.email) return;

    const shiftType = shift.type?.name || 'Scheduled Shift';
    const dateStr = this.formatDate(shift.startTime);
    const startStr = this.formatTime(shift.startTime);
    const endStr = this.formatTime(shift.endTime);
    const location = shift.wing?.name ? `Wing: ${shift.wing.name}` : undefined;
    const organization = tenantName || 'Cantra Care';

    const subject = isExtended
      ? `Shift Extended: ${shiftType} on ${dateStr}`
      : `Shift Schedule Updated: ${shiftType} on ${dateStr}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const actionUrl = `${frontendUrl}/carer/rota`;

    const prevEndStr = previousEndTime
      ? this.formatTime(previousEndTime)
      : undefined;
    const changeNotice =
      isExtended && prevEndStr
        ? `Your shift end time has been extended from <strong>${prevEndStr}</strong> to <strong>${endStr}</strong>.<br><br>`
        : `Your shift timings have been updated to <strong>${startStr} – ${endStr}</strong>.<br><br>`;

    const htmlMessage =
      `Hello ${user.fullName},<br><br>` +
      `Your shift schedule at <strong>${organization}</strong> has been updated.<br><br>` +
      changeNotice +
      `<strong>Shift:</strong> ${shiftType}<br>` +
      `<strong>Date:</strong> ${dateStr}<br>` +
      `<strong>Updated Time:</strong> ${startStr} – ${endStr}<br>` +
      (location ? `<strong>Location:</strong> ${location}<br>` : '') +
      `<br>Please log in to your rota to view your updated schedule details.`;

    try {
      if (this.mailService) {
        await this.mailService.sendNotification(
          user.email,
          subject,
          htmlMessage,
          actionUrl,
        );
        this.logger.log(
          `Shift update email sent to ${user.email} for shift ${shift.id}`,
        );
      }

      if (shift.tenantId) {
        await prisma.notification.create({
          data: {
            tenantId: shift.tenantId,
            branchId: shift.branchId || null,
            recipientId: user.id,
            title: isExtended ? 'Shift Extended' : 'Shift Schedule Updated',
            message:
              isExtended && prevEndStr
                ? `Your ${shiftType} on ${dateStr} has been extended to ${endStr} (previously ${prevEndStr}).`
                : `Your ${shiftType} on ${dateStr} has been updated to ${startStr} - ${endStr}.`,
            category: 'ROTA',
            priority: 'Medium',
            actionUrl: '/carer/rota',
            channels: ['IN_APP', 'EMAIL'],
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to dispatch shift update notification for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Dispatches an upcoming shift reminder 30 minutes before shift start.
   */
  async sendUpcomingReminderNotification(
    target: ShiftNotificationTarget,
  ): Promise<void> {
    const { user, shift, tenantName } = target;
    if (!user.email) return;

    const shiftType = shift.type?.name || 'Shift';
    const startStr = this.formatTime(shift.startTime);
    const endStr = this.formatTime(shift.endTime);
    const location = shift.wing?.name ? `Wing: ${shift.wing.name}` : undefined;
    const organization = tenantName || 'Cantra Care';

    const subject = `Reminder: Your Shift Starts in 30 Minutes (${startStr})`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const actionUrl = `${frontendUrl}/carer/tasks`;

    const htmlMessage =
      `Hello ${user.fullName},<br><br>` +
      `This is a reminder that your scheduled shift at <strong>${organization}</strong> starts in approximately 30 minutes.<br><br>` +
      `<strong>Shift:</strong> ${shiftType}<br>` +
      `<strong>Time:</strong> ${startStr} – ${endStr}<br>` +
      (location ? `<strong>Location:</strong> ${location}<br>` : '') +
      `<br>Please ensure you are ready and remember to clock in when your shift begins.`;

    const dedupeActionUrl = `/carer/rota?shiftId=${shift.id}&reminder=30min`;

    try {
      if (this.mailService) {
        await this.mailService.sendNotification(
          user.email,
          subject,
          htmlMessage,
          actionUrl,
        );
        this.logger.log(
          `Upcoming 30min shift reminder email sent to ${user.email} for shift ${shift.id}`,
        );
      }

      if (shift.tenantId) {
        await prisma.notification.create({
          data: {
            tenantId: shift.tenantId,
            branchId: shift.branchId || null,
            recipientId: user.id,
            title: 'Upcoming Shift in 30 Minutes',
            message: `Your ${shiftType} starts at ${startStr}. Please remember to clock in.`,
            category: 'ROTA',
            priority: 'High',
            actionUrl: dedupeActionUrl,
            channels: ['IN_APP', 'EMAIL'],
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to dispatch upcoming shift reminder for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Dispatches an email notification when a staff member's shift/leave request status is decided (e.g. Rejected).
   */
  async sendShiftRequestDecisionNotification(target: {
    user: { id: string; email: string; fullName: string };
    request: {
      id: string;
      type: string;
      status: string;
      startTime: Date | string;
      endTime: Date | string;
      adminNotes?: string | null;
    };
    tenantName?: string;
  }): Promise<void> {
    const { user, request, tenantName } = target;
    if (!user.email) return;

    const organization = tenantName || 'Cantra Care';
    const isRejected = request.status === 'Rejected';
    const startDateStr = this.formatDate(request.startTime);
    const endDateStr = this.formatDate(request.endTime);
    const periodStr =
      startDateStr === endDateStr
        ? `${startDateStr} (${this.formatTime(request.startTime)} – ${this.formatTime(request.endTime)})`
        : `${startDateStr} – ${endDateStr}`;

    const subject = isRejected
      ? `${request.type} Request Rejected - ${organization}`
      : `${request.type} Request Approved - ${organization}`;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const actionUrl = `${frontendUrl}/carer/rota`;

    const decisionText = isRejected
      ? `We regret to inform you that your request for <strong>${request.type}</strong> has been <strong>rejected</strong>.`
      : `Good news! Your request for <strong>${request.type}</strong> has been <strong>approved</strong>.`;

    const adminNoteHtml = request.adminNotes
      ? `<br><br><strong>Manager Notes / Reason:</strong><br>${request.adminNotes}`
      : '';

    const htmlMessage =
      `Hello ${user.fullName},<br><br>` +
      `${decisionText}<br><br>` +
      `<strong>Request Type:</strong> ${request.type}<br>` +
      `<strong>Period:</strong> ${periodStr}<br>` +
      adminNoteHtml +
      `<br><br>Please log in to your rota to check your updated schedule.`;

    try {
      if (this.mailService) {
        await this.mailService.sendNotification(
          user.email,
          subject,
          htmlMessage,
          actionUrl,
        );
        this.logger.log(
          `Shift request ${request.status} email sent to ${user.email} for request ${request.id}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to dispatch shift request email for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
