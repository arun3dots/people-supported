import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateIncidentDTO, NotifyNextOfKinDTO } from '@repo/schema';
import { MailService } from '../../common/mail/mail.service';
import { toJsonValue } from '../../common/utils/json.util';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  buildNokEmailHtml,
  buildTaskAssignedEmailHtml,
} from './incident-email-templates.util';

export interface IncidentNotificationTarget {
  id: string;
  incidentNumber: string;
  category: string;
  incidentDate: Date;
  complianceItems: unknown;
  resident?: {
    fullName: string;
  } | null;
}

@Injectable()
export class IncidentNotificationService {
  private readonly logger = new Logger(IncidentNotificationService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async notifyNextOfKin(
    incident: IncidentNotificationTarget,
    dto: NotifyNextOfKinDTO,
  ) {
    const residentName = incident.resident?.fullName || 'Resident';
    const emailHtml = buildNokEmailHtml(
      residentName,
      dto.recipientName,
      incident.incidentNumber,
      incident.category,
      incident.incidentDate,
      dto.message,
    );

    try {
      await this.mailService.sendNotification(
        dto.recipientEmail,
        dto.subject,
        emailHtml,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Next of Kin email notification error: ${msg}`);
    }

    const existingCompliance = Array.isArray(incident.complianceItems)
      ? (incident.complianceItems as Array<{
          id: string;
          title: string;
          status: string;
          timestamp?: string;
        }>)
      : [];

    const nowTime = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    let found = false;
    const updatedCompliance = existingCompliance.map((item) => {
      if (item.title === 'Family Notified' || item.id === 'c-1') {
        found = true;
        return { ...item, status: 'Completed', timestamp: nowTime };
      }
      return item;
    });

    if (!found) {
      updatedCompliance.unshift({
        id: 'c-1',
        title: 'Family Notified',
        status: 'Completed',
        timestamp: nowTime,
      });
    }

    await prisma.incident.update({
      where: { id: incident.id },
      data: {
        complianceItems: toJsonValue(updatedCompliance),
      },
    });

    return {
      success: true,
      message: `Notification email sent to ${dto.recipientName} (${dto.recipientEmail})`,
      recipient: dto.recipientEmail,
    };
  }

  async notifyTaskAssigned(
    incident: { id: string; incidentNumber: string; tenantId: string },
    task: {
      title: string;
      description?: string;
      assignedToId?: string;
      assignedToName: string;
      assignedToEmail?: string;
      priority?: string;
      date?: string;
      time?: string;
      notifyEmail?: boolean;
    },
  ): Promise<void> {
    if (!task.notifyEmail) return;

    let email = task.assignedToEmail;
    if (!email && task.assignedToId) {
      const user = await prisma.user.findUnique({
        where: { id: task.assignedToId },
        select: { email: true, fullName: true },
      });
      email = user?.email;
    }

    if (!email) {
      const user = await prisma.user.findFirst({
        where: {
          tenantId: incident.tenantId,
          fullName: task.assignedToName,
          isActive: true,
        },
        select: { email: true, fullName: true },
      });
      email = user?.email;
    }

    if (!email) {
      this.logger.warn(
        `Cannot send task assignment email: No email found for staff ${task.assignedToName}`,
      );
      return;
    }

    const actionUrl = `/admin/incidents/review?id=${incident.id}`;
    const subject = `Task Assigned: ${task.title} (Incident ${incident.incidentNumber})`;
    const emailHtml = buildTaskAssignedEmailHtml(
      task.assignedToName,
      incident.incidentNumber,
      task.title,
      task.description || '',
      task.date || '',
      task.time || '',
      task.priority || 'Medium',
      actionUrl,
    );

    try {
      await this.mailService.sendNotification(email, subject, emailHtml);
      this.logger.log(`Task assignment email dispatched to ${email}`);
    } catch (err: unknown) {
      this.logger.error(
        `Failed to send task assignment email: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Evaluates and dispatches all statutory Notification Matrix alerts for a recorded incident:
   * - EMAR-007: Medication error
   * - EMAR-004: Controlled drug discrepancy
   * - MH-007: Restraint used
   * - INC-004: Safeguarding referral 24-hr countdown
   * - INC-003: RIDDOR threshold met
   * - INC-005: Duty of Candour 10-day deadline
   * - INC-006: CQC notification threshold met
   */
  async triggerIncidentAlert(
    incident: {
      id: string;
      incidentNumber: string;
      tenantId: string;
      branchId?: string | null;
      title: string;
      category: string;
      severity: string | null;
      harmLevel?: string | null;
      dutyOfCandourApplicable?: boolean;
      writtenNoticeDueAt?: Date | null;
      cqcNotificationRequired?: boolean;
      resident?: { id?: string; fullName: string } | null;
    },
    dto: CreateIncidentDTO,
  ): Promise<void> {
    const residentName = incident.resident?.fullName || 'Resident';
    const actionUrl = `/admin/incidents/${incident.id}`;
    const combinedText = [
      dto.category,
      dto.title,
      dto.initialAssessment,
      dto.notes,
      dto.managerNotes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const baseMeta = {
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      category: dto.category,
      severity: dto.severity,
    };

    // 1. EMAR-007: Medication error -> Push + in-app + email to RM + RN (Critical)
    if (dto.category === 'Medication') {
      await this.notificationsService.triggerMatrixAlert('EMAR-007', {
        tenantId: incident.tenantId,
        branchId: incident.branchId,
        residentId: incident.resident?.id,
        title: `MEDICATION ERROR: ${incident.incidentNumber}`,
        message: `Medication error recorded for ${residentName}: ${dto.title}. Immediate clinical & management review required.`,
        actionUrl,
        metadata: baseMeta,
      });

      // 2. EMAR-004: Controlled drug discrepancy -> Push + in-app + email to RM (Critical)
      const isCdDiscrepancy =
        combinedText.includes('controlled') ||
        combinedText.includes('discrepancy') ||
        combinedText.includes('balance') ||
        combinedText.includes('reconcil') ||
        combinedText.includes('morphine') ||
        combinedText.includes('oxycodone') ||
        combinedText.includes('fentanyl');

      if (isCdDiscrepancy) {
        await this.notificationsService.triggerMatrixAlert('EMAR-004', {
          tenantId: incident.tenantId,
          branchId: incident.branchId,
          residentId: incident.resident?.id,
          title: `CONTROLLED DRUG DISCREPANCY: ${incident.incidentNumber}`,
          message: `Controlled drug balance discrepancy reported for ${residentName}: ${dto.title}. Immediate Registered Manager reconciliation required.`,
          actionUrl,
          metadata: baseMeta,
        });
      }
    }

    // 3. MH-007: Restraint used -> Push + in-app + email, immediate to RM + MHL (Critical)
    if (
      dto.category === 'Restraint' ||
      combinedText.includes('restraint') ||
      combinedText.includes('physical intervention')
    ) {
      await this.notificationsService.triggerMatrixAlert('MH-007', {
        tenantId: incident.tenantId,
        branchId: incident.branchId,
        residentId: incident.resident?.id,
        title: `RESTRAINT USED: ${incident.incidentNumber}`,
        message: `Restraint documentation recorded for ${residentName}: ${dto.title}. Immediate RM & Mental Health Lead review required.`,
        actionUrl,
        metadata: baseMeta,
      });
    }

    // 4. INC-004: Safeguarding referral 24-hr countdown -> In-app countdown + email to RM (Critical)
    if (
      dto.category === 'Safeguarding' ||
      combinedText.includes('safeguard') ||
      combinedText.includes('abuse') ||
      combinedText.includes('neglect')
    ) {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const deadlineStr = deadline.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      await this.notificationsService.triggerMatrixAlert('INC-004', {
        tenantId: incident.tenantId,
        branchId: incident.branchId,
        residentId: incident.resident?.id,
        title: `SAFEGUARDING 24-HR COUNTDOWN: ${incident.incidentNumber}`,
        message: `Serious safeguarding concern recorded for ${residentName} (${dto.title}). Statutory local authority referral must be submitted within 24 hours (by ${deadlineStr}).`,
        actionUrl,
        metadata: {
          ...baseMeta,
          safeguardingDeadlineAt: deadline.toISOString(),
        },
      });
    }

    // 5. INC-003: RIDDOR threshold met -> In-app + email to Registered Manager (Critical)
    const isRiddor =
      dto.harmLevel === 'Level 4' ||
      dto.harmLevel === 'Level 5' ||
      dto.harmLevel === 'Severe' ||
      dto.harmLevel === 'Death' ||
      combinedText.includes('riddor') ||
      combinedText.includes('fracture') ||
      (dto.category === 'Equipment' && dto.severity === 'High');

    if (isRiddor) {
      await this.notificationsService.triggerMatrixAlert('INC-003', {
        tenantId: incident.tenantId,
        branchId: incident.branchId,
        residentId: incident.resident?.id,
        title: `RIDDOR THRESHOLD MET: ${incident.incidentNumber}`,
        message: `Incident ${incident.incidentNumber} (${dto.title}) for ${residentName} meets RIDDOR reporting criteria. Statutory HSE report required.`,
        actionUrl,
        metadata: baseMeta,
      });
    }

    // 6. INC-005: Duty of Candour 10-day deadline -> Email + in-app to Registered Manager (High)
    if (incident.dutyOfCandourApplicable) {
      const dueStr = incident.writtenNoticeDueAt
        ? incident.writtenNoticeDueAt.toLocaleDateString('en-GB')
        : '10 days';
      await this.notificationsService.triggerMatrixAlert('INC-005', {
        tenantId: incident.tenantId,
        branchId: incident.branchId,
        residentId: incident.resident?.id,
        title: `DUTY OF CANDOUR 10-DAY DEADLINE: ${incident.incidentNumber}`,
        message: `Qualifying Regulation 20 incident recorded for ${residentName} (${dto.title}). Written Duty of Candour notice due by ${dueStr}.`,
        actionUrl,
        metadata: {
          ...baseMeta,
          writtenNoticeDueAt: incident.writtenNoticeDueAt?.toISOString(),
        },
      });
    }

    // 7. INC-006: CQC notification threshold met -> In-app + email to Registered Manager (Critical)
    if (incident.cqcNotificationRequired) {
      await this.notificationsService.triggerMatrixAlert('INC-006', {
        tenantId: incident.tenantId,
        branchId: incident.branchId,
        residentId: incident.resident?.id,
        title: `CQC REG 18 NOTIFICATION REQUIRED: ${incident.incidentNumber}`,
        message: `Incident ${incident.incidentNumber} (${dto.title}) for ${residentName} meets CQC Regulation 18 criteria. Statutory notification required.`,
        actionUrl,
        metadata: baseMeta,
      });
    }
  }
}
