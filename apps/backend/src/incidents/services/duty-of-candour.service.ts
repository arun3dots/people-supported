import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { RecordDutyOfCandourDTO, RecordCqcNotificationDTO } from '@repo/schema';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class DutyOfCandourService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Evaluates statutory Duty of Candour applicability and 10-day notice SLA
   * under Health and Social Care Act 2008 (Regulated Activities) Regulation 20.
   */
  evaluateComplianceFlags(data: {
    severity?: string;
    harmLevel?: string | null;
    category?: string;
    title?: string;
    incidentDate: Date;
  }) {
    const isHighHarm =
      data.severity === 'High' ||
      data.harmLevel === 'Level 3' ||
      data.harmLevel === 'Level 4' ||
      data.harmLevel === 'Level 5' ||
      data.category?.toLowerCase().includes('death') ||
      data.title?.toLowerCase().includes('fracture') ||
      data.title?.toLowerCase().includes('severe');

    const dutyOfCandourApplicable = Boolean(isHighHarm);
    const writtenNoticeDueAt = dutyOfCandourApplicable
      ? new Date(data.incidentDate.getTime() + 10 * 24 * 60 * 60 * 1000)
      : null;

    const cqcNotificationRequired =
      dutyOfCandourApplicable ||
      data.category === 'Fall' ||
      data.category === 'Safeguarding' ||
      data.title?.toLowerCase().includes('hospital');

    return {
      dutyOfCandourApplicable,
      dutyOfCandourStatus: dutyOfCandourApplicable ? 'PendingApology' : null,
      writtenNoticeDueAt,
      cqcNotificationRequired,
    };
  }

  async recordDutyOfCandour(
    incidentId: string,
    tenantId: string,
    userId: string,
    dto: RecordDutyOfCandourDTO,
  ) {
    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, tenantId },
      include: { resident: { select: { fullName: true } } },
    });

    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status === 'Closed') {
      throw new BadRequestException(
        'Closed incidents are read-only and cannot be modified',
      );
    }

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        dutyOfCandourStatus: dto.dutyOfCandourStatus,
        apologyDate: new Date(dto.apologyDate),
        apologyMethod: dto.apologyMethod,
        writtenNoticeSentAt: dto.writtenNoticeSentAt
          ? new Date(dto.writtenNoticeSentAt)
          : undefined,
      },
    });

    await this.auditService.emitSafeguarding({
      tenantId,
      userId,
      entityType: 'Incident',
      entityId: incidentId,
      residentId: incident.residentId || undefined,
      actionType: 'INCIDENT_ACTIONED',
      description: `Duty of Candour record updated for ${incident.incidentNumber} (${incident.resident?.fullName || 'Resident'}). Status: ${dto.dutyOfCandourStatus}.`,
      metadata: {
        referralTarget: 'DutyOfCandour',
        dutyOfCandourStatus: dto.dutyOfCandourStatus,
      },
      newValue: {
        status: dto.dutyOfCandourStatus,
        apologyDate: dto.apologyDate,
        method: dto.apologyMethod,
      },
    });

    return updated;
  }

  async recordCqcNotification(
    incidentId: string,
    tenantId: string,
    userId: string,
    dto: RecordCqcNotificationDTO,
  ) {
    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, tenantId },
      include: { resident: { select: { fullName: true } } },
    });

    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status === 'Closed') {
      throw new BadRequestException(
        'Closed incidents are read-only and cannot be modified',
      );
    }

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        cqcReferenceNumber: dto.cqcReferenceNumber,
        cqcNotificationSubmittedAt: new Date(dto.cqcNotificationSubmittedAt),
        cqcNotificationRequired: true,
      },
    });

    await this.auditService.emitSafeguarding({
      tenantId,
      userId,
      entityType: 'Incident',
      entityId: incidentId,
      residentId: incident.residentId || undefined,
      actionType: 'REFERRAL_MADE',
      description: `CQC Statutory Regulation 18 notification submitted for ${incident.incidentNumber}. Ref: ${dto.cqcReferenceNumber}.`,
      metadata: {
        referralTarget: 'CQC',
        cqcRef: dto.cqcReferenceNumber,
      },
      newValue: {
        cqcRef: dto.cqcReferenceNumber,
        submittedAt: dto.cqcNotificationSubmittedAt,
      },
    });

    return updated;
  }

  /**
   * G-13: Retrieves pending Duty of Candour records approaching or exceeding the 10-day statutory SLA (CQC Reg 20).
   */
  async findPendingDutyOfCandourIncidents(tenantId: string) {
    const pendingIncidents = await prisma.incident.findMany({
      where: {
        tenantId,
        dutyOfCandourApplicable: true,
        dutyOfCandourStatus: { not: 'Completed' },
      },
      include: {
        resident: { select: { id: true, fullName: true } },
      },
      orderBy: { incidentDate: 'asc' },
    });

    const now = new Date();

    return pendingIncidents.map((inc) => {
      const writtenNoticeDueAt = inc.writtenNoticeDueAt
        ? new Date(inc.writtenNoticeDueAt)
        : new Date(inc.incidentDate.getTime() + 10 * 24 * 60 * 60 * 1000);

      const msRemaining = writtenNoticeDueAt.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

      let slaStatus: 'OnTrack' | 'DueSoon' | 'Overdue' = 'OnTrack';
      if (daysRemaining < 0) {
        slaStatus = 'Overdue';
      } else if (daysRemaining <= 2) {
        slaStatus = 'DueSoon';
      }

      return {
        id: inc.id,
        incidentNumber: inc.incidentNumber,
        category: inc.category,
        incidentDate: inc.incidentDate,
        dutyOfCandourStatus: inc.dutyOfCandourStatus,
        writtenNoticeDueAt,
        daysRemaining,
        slaStatus,
        resident: inc.resident,
      };
    });
  }
}
