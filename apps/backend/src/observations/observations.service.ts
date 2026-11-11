import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Observation, PrismaTransactionClient } from '@repo/db';
import {
  ObservationDTO,
  CorrectObservationDTO,
  calculateNEWS2Score,
} from '@repo/schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ObservationsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async create(
    dto: ObservationDTO,
    userId: string,
    tenantId: string,
  ): Promise<Observation> {
    // D-07 & C-06: Strictly scope resident lookup by authenticated tenantId
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId, deletedAt: null },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    if (resident.status === 'Discharged') {
      throw new BadRequestException(
        'Observations cannot be recorded for discharged residents',
      );
    }
    if (resident.status === 'Draft') {
      throw new BadRequestException(
        'Observations cannot be recorded for draft residents',
      );
    }
    // B-07: Enforce read-only restriction when recordState is Archived, Restricted, or LegalHold
    if (resident.recordState && resident.recordState !== 'Active') {
      throw new BadRequestException(
        `Observations cannot be recorded when resident record state is "${resident.recordState}"`,
      );
    }

    // Auto-calculate score if not provided or to ensure correctness
    const { score, details } = calculateNEWS2Score(dto);

    // C-01: Contemporaneous record tracking (occurredAt vs recordedAt + late-entry flag)
    const recordedAt = new Date();
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : recordedAt;
    const diffMs = recordedAt.getTime() - occurredAt.getTime();
    const isLateEntry = diffMs > 2 * 60 * 60 * 1000; // > 2 hours per CQC / NMC contemporaneous recording rules

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const observation = await tx.observation.create({
        data: {
          residentId: dto.residentId,
          temp: dto.temp,
          pulse: dto.pulse,
          bpSystolic: dto.bpSystolic,
          bpDiastolic: dto.bpDiastolic,
          respiration: dto.respiration,
          spo2: dto.spo2,
          spo2Scale: dto.spo2Scale,
          airOrOxygen: dto.airOrOxygen,
          consciousness: dto.consciousness,
          news2Score: score,
          isAbnormal: dto.isAbnormal || score >= 5, // NEWS2 threshold for urgent response is 5
          notifyGP: dto.notifyGP,
          increaseMonitoring: dto.increaseMonitoring,
          notes: dto.notes,
          timestamp: recordedAt,
          occurredAt,
          isLateEntry,
          createdById: userId,
          updatedById: userId,
        },
      });

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      await tx.careTimeline.create({
        data: {
          residentId: dto.residentId,
          eventType: 'OBSERVATION',
          summary: `Took Observation @ ${timeStr}. NEWS2 Score: ${score}`,
          carerId: userId,
          createdById: userId,
          updatedById: userId,
        },
      });

      const hasSingleTriggerOf3 = Object.values(details || {}).some(
        (val) => val === 3,
      );

      if (score >= 5 || hasSingleTriggerOf3 || dto.isAbnormal) {
        this.triggerRiskAlert(
          resident,
          score,
          hasSingleTriggerOf3,
          userId,
          observation.id,
        ).catch(() => {});
      }

      return observation;
    });
  }

  /**
   * B-06: Clinical Rectification Strike-Through Workflow (UK GDPR Art 16 & CQC Reg 17).
   * Preserves the original observation with isSuperseded=true and links it to the corrected entry.
   */
  async correct(
    id: string,
    dto: CorrectObservationDTO,
    userId: string,
    tenantId: string,
  ): Promise<{ originalId: string; replacement: Observation }> {
    const original = await prisma.observation.findFirst({
      where: { id, resident: { tenantId }, deletedAt: null },
      include: { resident: true },
    });

    if (!original) {
      throw new NotFoundException('Observation not found');
    }
    if (original.isSuperseded) {
      throw new BadRequestException(
        'This observation has already been superseded by a prior correction',
      );
    }
    if (
      original.resident.recordState &&
      original.resident.recordState !== 'Active'
    ) {
      throw new BadRequestException(
        `Observations cannot be amended when resident record state is "${original.resident.recordState}"`,
      );
    }

    const merged: ObservationDTO = {
      residentId: original.residentId,
      temp: dto.temp !== undefined ? dto.temp : original.temp,
      pulse: dto.pulse !== undefined ? dto.pulse : original.pulse,
      bpSystolic:
        dto.bpSystolic !== undefined ? dto.bpSystolic : original.bpSystolic,
      bpDiastolic:
        dto.bpDiastolic !== undefined ? dto.bpDiastolic : original.bpDiastolic,
      respiration:
        dto.respiration !== undefined ? dto.respiration : original.respiration,
      spo2: dto.spo2 !== undefined ? dto.spo2 : original.spo2,
      spo2Scale:
        dto.spo2Scale !== undefined ? dto.spo2Scale : original.spo2Scale,
      airOrOxygen:
        dto.airOrOxygen !== undefined ? dto.airOrOxygen : original.airOrOxygen,
      consciousness:
        dto.consciousness !== undefined
          ? dto.consciousness
          : original.consciousness,
      isAbnormal:
        dto.isAbnormal !== undefined ? dto.isAbnormal : original.isAbnormal,
      notifyGP: dto.notifyGP !== undefined ? dto.notifyGP : original.notifyGP,
      increaseMonitoring:
        dto.increaseMonitoring !== undefined
          ? dto.increaseMonitoring
          : original.increaseMonitoring,
      notes: dto.notes !== undefined ? dto.notes : original.notes,
    };

    const { score } = calculateNEWS2Score(merged);

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const replacement = await tx.observation.create({
        data: {
          residentId: original.residentId,
          temp: merged.temp,
          pulse: merged.pulse,
          bpSystolic: merged.bpSystolic,
          bpDiastolic: merged.bpDiastolic,
          respiration: merged.respiration,
          spo2: merged.spo2,
          spo2Scale: merged.spo2Scale,
          airOrOxygen: merged.airOrOxygen,
          consciousness: merged.consciousness,
          news2Score: score,
          isAbnormal: merged.isAbnormal || score >= 5,
          notifyGP: merged.notifyGP,
          increaseMonitoring: merged.increaseMonitoring,
          notes: merged.notes,
          occurredAt: original.occurredAt ?? original.timestamp,
          isLateEntry: original.isLateEntry,
          createdById: userId,
          updatedById: userId,
        },
      });

      await tx.observation.update({
        where: { id: original.id },
        data: {
          isSuperseded: true,
          supersededById: replacement.id,
          correctionReason: dto.correctionReason,
          correctedAt: new Date(),
          correctedById: userId,
          updatedById: userId,
        },
      });

      await tx.careTimeline.create({
        data: {
          residentId: original.residentId,
          eventType: 'OBSERVATION_AMENDED',
          summary: `Observation amended (strike-through). Reason: ${dto.correctionReason}. Updated NEWS2 Score: ${score}`,
          carerId: userId,
          createdById: userId,
          updatedById: userId,
        },
      });

      return { originalId: original.id, replacement };
    });
  }

  private getResidentInitials(fullName: string, id: string): string {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return `Resident #${id.slice(0, 6)}`;
    const initials = parts.map((p) => p[0].toUpperCase()).join('.');
    return `${initials}. (#${id.slice(0, 6)})`;
  }

  private async triggerRiskAlert(
    resident: { id: string; fullName: string; tenantId: string },
    score: number,
    hasSingleTriggerOf3: boolean,
    carerId: string,
    observationId: string,
  ): Promise<void> {
    const carer = await prisma.user.findFirst({
      where: { id: carerId, tenantId: resident.tenantId },
      include: { profile: true },
    });

    const clinicians = await prisma.user.findMany({
      where: {
        tenantId: resident.tenantId,
        role: { name: { in: ['Nurse', 'Manager', 'Admin'] } },
        isActive: true,
      },
    });

    const isUrgent = score >= 7 || hasSingleTriggerOf3;
    const priority = isUrgent ? 'Urgent' : 'High';
    const carerName = carer?.fullName || 'Care Staff';

    const reason =
      score >= 7
        ? `Aggregate NEWS2 score ${score} (High Clinical Risk)`
        : hasSingleTriggerOf3
          ? `Extreme vital sign trigger (Parameter Score 3, Total: ${score})`
          : `NEWS2 score ${score}`;

    const pseudonymizedLabel = this.getResidentInitials(
      resident.fullName,
      resident.id,
    );

    for (const recipient of clinicians) {
      await this.notificationsService.triggerAlert({
        tenantId: resident.tenantId,
        recipientId: recipient.id,
        title: isUrgent
          ? 'URGENT: CLINICAL DETERIORATION ALERT'
          : 'RISKY OBSERVATION ALERT',
        message: `${reason} recorded for ${pseudonymizedLabel} by ${carerName}. Immediate clinical review required (advisory — confirm clinically).`,
        category: 'CLINICAL',
        priority,
        actionUrl: `/residents/${resident.id}/observations/${observationId}`,
        preferPushOverEmail: true,
        metadata: {
          residentId: resident.id,
          score,
          hasSingleTriggerOf3,
          carerName,
          observationId,
        },
      });
    }
  }

  async findAllByResident(
    residentId: string,
    tenantId: string,
  ): Promise<Observation[]> {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    return prisma.observation.findMany({
      where: { residentId, resident: { tenantId }, deletedAt: null },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Observation> {
    const observation = await prisma.observation.findFirst({
      where: { id, resident: { tenantId }, deletedAt: null },
    });
    if (!observation) throw new NotFoundException('Observation not found');
    return observation;
  }
}
