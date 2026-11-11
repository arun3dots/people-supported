import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  TriageClinicalEscalationDTO,
  calculateNEWS2Score,
  ObservationDTO,
} from '@repo/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { formatPseudonymizedResident } from '../common/utils/pseudonymize.util';
import { toJsonValue } from '../common/utils/json.util';

export interface ActionTakenLog {
  role: string;
  staffName: string;
  action: string;
  timestamp: string;
  notes?: string;
}

@Injectable()
export class EscalationsTriageService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async triage(
    id: string,
    dto: TriageClinicalEscalationDTO,
    tenantId: string,
    nurseId: string,
    userBranchId?: string,
  ) {
    const escalation = await prisma.clinicalEscalation.findFirst({
      where: {
        id,
        tenantId,
        ...(userBranchId ? { branchId: userBranchId } : {}),
      },
    });

    if (!escalation) {
      throw new NotFoundException('Clinical escalation record not found');
    }

    const nurse = await prisma.user.findUnique({
      where: { id: nurseId },
      select: { fullName: true, email: true },
    });
    const nurseName = nurse?.fullName || nurse?.email || 'Nurse';

    let nextStatus = 'Triaged';
    let assignedToRole = escalation.assignedToRole;
    let resolvedAt: Date | null = null;
    let resolvedById: string | null = null;

    switch (dto.decision) {
      case 'ResolveOnSite':
        nextStatus = 'Resolved';
        resolvedAt = new Date();
        resolvedById = nurseId;
        break;
      case 'IncreaseMonitoring':
        nextStatus = 'ActionTaken';
        break;
      case 'CallGP':
        nextStatus = 'EscalatedToGP';
        break;
      case 'Call111':
        nextStatus = 'ActionTaken';
        break;
      case 'Call999':
        nextStatus = 'EscalatedTo999';
        assignedToRole = 'Manager';
        break;
      case 'EscalateToManager':
        nextStatus = 'EscalatedToManager';
        assignedToRole = 'Manager';
        break;
    }

    let createdObsId: string | undefined = undefined;
    if (dto.vitals && Object.keys(dto.vitals).length > 0) {
      const v = dto.vitals;
      const partialObs: Partial<ObservationDTO> = {
        residentId: escalation.residentId,
        temp: v.temp,
        pulse: v.pulse,
        bpSystolic: v.bpSystolic,
        bpDiastolic: v.bpDiastolic,
        respiration: v.respiration,
        spo2: v.spo2,
        spo2Scale: 1,
        consciousness: v.consciousness || 'Alert',
      };

      const { score } = calculateNEWS2Score(partialObs);

      const newObs = await prisma.observation.create({
        data: {
          residentId: escalation.residentId,
          temp: v.temp,
          pulse: v.pulse,
          bpSystolic: v.bpSystolic,
          bpDiastolic: v.bpDiastolic,
          respiration: v.respiration,
          bloodSugar: v.bloodSugar,
          spo2: v.spo2,
          spo2Scale: 1,
          consciousness: v.consciousness || 'Alert',
          news2Score: score,
          isAbnormal: score >= 5,
          notes: `Recorded during SBAR triage of escalation #${escalation.id.slice(0, 8)}: ${dto.sbarAssessment}`,
          createdById: nurseId,
          updatedById: nurseId,
        },
      });
      createdObsId = newObs.id;
    }

    const previousActions: ActionTakenLog[] = Array.isArray(
      escalation.actionsTaken,
    )
      ? (escalation.actionsTaken as unknown as ActionTakenLog[])
      : [];

    const updatedActions: ActionTakenLog[] = [
      ...previousActions,
      {
        role: 'Nurse',
        staffName: nurseName,
        action: dto.decision,
        timestamp: new Date().toISOString(),
        notes: dto.nurseNotes || dto.sbarRecommendation,
      },
    ];

    const updated = await prisma.clinicalEscalation.update({
      where: { id: escalation.id },
      data: {
        status: nextStatus,
        assignedToRole,
        sbarSituation: dto.sbarSituation,
        sbarBackground: dto.sbarBackground,
        sbarAssessment: dto.sbarAssessment,
        sbarRecommendation: dto.sbarRecommendation,
        observationId: createdObsId || escalation.observationId,
        actionsTaken: toJsonValue(updatedActions),
        resolvedAt: resolvedAt || escalation.resolvedAt,
        resolvedById: resolvedById || escalation.resolvedById,
      },
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            bed: { select: { room: { select: { roomNumber: true } } } },
          },
        },
        raisedBy: { select: { id: true, fullName: true } },
        resolvedBy: { select: { id: true, fullName: true } },
      },
    });

    if (
      nextStatus === 'EscalatedTo999' ||
      nextStatus === 'EscalatedToManager'
    ) {
      const managers = await prisma.user.findMany({
        where: {
          tenantId,
          role: { name: { in: ['Manager', 'Admin', 'SuperAdmin'] } },
        },
        select: { id: true },
      });

      const pseudonymizedResident = formatPseudonymizedResident(
        updated.resident?.fullName,
        escalation.residentId,
      );

      for (const m of managers) {
        await this.notificationsService.triggerAlert({
          tenantId,
          recipientId: m.id,
          title: `URGENT GOVERNANCE ALERT: ${pseudonymizedResident}`,
          message: `Clinical escalation escalated to Manager/999 by ${nurseName}. Decision: ${dto.decision}. Reason: ${dto.sbarRecommendation}`,
          category: 'CLINICAL',
          priority: 'Urgent',
          actionUrl: `/admin/escalations`,
          preferPushOverEmail: true,
          metadata: {
            branchId: escalation.branchId,
            escalationId: updated.id,
            residentId: escalation.residentId,
            action: dto.decision,
          },
        });
      }
    }

    return updated;
  }
}
