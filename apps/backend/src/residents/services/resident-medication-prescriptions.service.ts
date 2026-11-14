import { BadRequestException, Injectable } from '@nestjs/common';
import { MedicationPrescription, prisma } from '@repo/db';
import {
  ChangeMedicationPrescriptionDTO,
  CreateMedicationRoundBulkDTO,
  PauseMedicationPrescriptionDTO,
  StopMedicationPrescriptionDTO,
} from '@repo/schema';
import { toJsonValue } from '../../common/utils/json.util';
import { getUkDateString } from '../../common/utils/time.util';
import { AuditService } from '../../audit/audit.service';
import {
  buildPrescriptionRounds,
  cancelPrescriptionRounds,
} from './medication-prescription-rounds.util';
import {
  getActiveMedicationPrescription,
  getMedicationResidentOrThrow,
  listMedicationPrescriptions,
} from './medication-prescription-read.util';
import { MedicationAction } from '../../audit/audit.types';
import {
  assertBackdateReason,
  addUkDays,
  cutoffFor,
  listUkDays,
  minDay,
  ukDayOf,
  ukStartOf,
} from './medication-prescription-dates.util';
@Injectable()
export class ResidentMedicationPrescriptionsService {
  constructor(private readonly auditService: AuditService) {}

  async listPrescriptions(residentId: string, tenantId: string) {
    return listMedicationPrescriptions(residentId, tenantId);
  }

  async createPrescription(
    residentId: string,
    data: CreateMedicationRoundBulkDTO,
    creatorId: string,
    tenantId: string,
  ) {
    const resident = await getMedicationResidentOrThrow(residentId, tenantId);
    if (resident.status === 'Discharged') {
      throw new BadRequestException(
        'Medication cannot be prescribed for discharged residents',
      );
    }

    const startDay = ukDayOf(data.startDate);
    const endDay = ukDayOf(data.endDate);
    if (endDay < startDay) {
      throw new BadRequestException('End date must be on or after start date');
    }

    const times = [...new Set(data.times)];
    const days = listUkDays(startDay, endDay);

    const result = await prisma.$transaction(async (tx) => {
      const prescription = await tx.medicationPrescription.create({
        data: {
          residentId,
          drugName: data.drugName,
          dose: data.dose,
          form: data.form,
          instructions: data.instructions,
          imageUrls: data.imageUrls,
          times,
          startDate: ukStartOf(startDay),
          endDate: ukStartOf(endDay),
          allowLateAdministration: data.allowLateAdministration,
          mandatoryObservations: data.mandatoryObservations ?? [],
          status: 'Active',
          createdById: creatorId,
          updatedById: creatorId,
        },
      });
      const { count } = await tx.medicationRound.createMany({
        data: buildPrescriptionRounds(
          prescription,
          days,
          times,
          new Date(0),
          creatorId,
        ),
      });
      return { prescription, count };
    });

    this.emitAudit(
      'MEDICATION_PRESCRIPTION_CREATED',
      creatorId,
      tenantId,
      result.prescription,
      {
        startDate: startDay,
        endDate: endDay,
        roundsCreated: result.count,
      },
    );
    return result;
  }

  async stopPrescription(
    prescriptionId: string,
    dto: StopMedicationPrescriptionDTO,
    userId: string,
    tenantId: string,
  ) {
    const current = await getActiveMedicationPrescription(
      prescriptionId,
      tenantId,
    );
    const effectiveDay = ukDayOf(dto.effectiveDate);
    assertBackdateReason(effectiveDay, dto.backdateReason);
    const endDay = minDay(
      addUkDays(effectiveDay, -1),
      getUkDateString(current.endDate),
    );

    const stopped = await prisma.$transaction(async (tx) => {
      const updated = await tx.medicationPrescription.update({
        where: { id: current.id },
        data: {
          status: 'Stopped',
          stopReason: dto.reason,
          endDate: ukStartOf(endDay),
          updatedById: userId,
        },
      });
      await cancelPrescriptionRounds(
        tx,
        current.id,
        cutoffFor(effectiveDay),
        null,
        userId,
        tenantId,
      );
      return updated;
    });

    this.emitAudit(
      'MEDICATION_PRESCRIPTION_STOPPED',
      userId,
      tenantId,
      stopped,
      {
        effectiveDate: effectiveDay,
        reason: dto.reason,
        backdateReason: dto.backdateReason ?? null,
      },
    );
    return stopped;
  }

  async changePrescription(
    prescriptionId: string,
    dto: ChangeMedicationPrescriptionDTO,
    userId: string,
    tenantId: string,
  ) {
    const current = await getActiveMedicationPrescription(
      prescriptionId,
      tenantId,
    );
    const effectiveDay = ukDayOf(dto.effectiveDate);
    const newEndDay = ukDayOf(dto.endDate);
    assertBackdateReason(effectiveDay, dto.backdateReason);
    if (newEndDay < effectiveDay) {
      throw new BadRequestException(
        'End date must be on or after the effective date',
      );
    }

    const times = [...new Set(dto.times)];
    const cutoff = cutoffFor(effectiveDay);
    const oldEndDay = minDay(
      addUkDays(effectiveDay, -1),
      getUkDateString(current.endDate),
    );
    const days = listUkDays(effectiveDay, newEndDay);

    const result = await prisma.$transaction(async (tx) => {
      await tx.medicationPrescription.update({
        where: { id: current.id },
        data: {
          status: 'Superseded',
          // Reuses stopReason for the change reason; no separate column.
          stopReason: dto.reason,
          endDate: ukStartOf(oldEndDay),
          updatedById: userId,
        },
      });
      await cancelPrescriptionRounds(
        tx,
        current.id,
        cutoff,
        null,
        userId,
        tenantId,
      );

      const prescription = await tx.medicationPrescription.create({
        data: {
          residentId: current.residentId,
          drugName: dto.drugName,
          dose: dto.dose,
          form: dto.form,
          instructions: dto.instructions,
          imageUrls: dto.imageUrls,
          times,
          startDate: ukStartOf(effectiveDay),
          endDate: ukStartOf(newEndDay),
          allowLateAdministration: dto.allowLateAdministration,
          mandatoryObservations: dto.mandatoryObservations ?? [],
          status: 'Active',
          supersedesId: current.id,
          createdById: userId,
          updatedById: userId,
        },
      });
      const { count } = await tx.medicationRound.createMany({
        data: buildPrescriptionRounds(
          prescription,
          days,
          times,
          cutoff,
          userId,
        ),
      });
      return { prescription, count };
    });

    this.emitAudit(
      'MEDICATION_PRESCRIPTION_CHANGED',
      userId,
      tenantId,
      result.prescription,
      {
        supersedesId: current.id,
        effectiveDate: effectiveDay,
        reason: dto.reason,
        backdateReason: dto.backdateReason ?? null,
        roundsCreated: result.count,
      },
    );
    return result;
  }

  async pausePrescription(
    prescriptionId: string,
    dto: PauseMedicationPrescriptionDTO,
    userId: string,
    tenantId: string,
  ) {
    const current = await getActiveMedicationPrescription(
      prescriptionId,
      tenantId,
    );
    const fromDay = ukDayOf(dto.pauseFrom);
    const resumeDay = ukDayOf(dto.resumeOn);
    if (resumeDay <= fromDay) {
      throw new BadRequestException(
        'Resume date must be after the pause start date',
      );
    }
    assertBackdateReason(fromDay, dto.backdateReason);

    const pause = await prisma.$transaction(async (tx) => {
      const created = await tx.medicationPrescriptionPause.create({
        data: {
          prescriptionId: current.id,
          pauseFrom: ukStartOf(fromDay),
          resumeOn: ukStartOf(resumeDay),
          reason: dto.reason,
          createdById: userId,
        },
      });
      await cancelPrescriptionRounds(
        tx,
        current.id,
        cutoffFor(fromDay),
        ukStartOf(resumeDay),
        userId,
        tenantId,
      );
      return created;
    });

    this.emitAudit(
      'MEDICATION_PRESCRIPTION_PAUSED',
      userId,
      tenantId,
      current,
      {
        pauseFrom: fromDay,
        resumeOn: resumeDay,
        reason: dto.reason,
        backdateReason: dto.backdateReason ?? null,
      },
    );
    return pause;
  }

  private emitAudit(
    actionType: MedicationAction,
    userId: string,
    tenantId: string,
    prescription: MedicationPrescription,
    metadata: Record<string, string | number | null>,
  ): void {
    void this.auditService.emitMedication({
      userId,
      tenantId,
      actionType,
      entityType: 'MedicationPrescription',
      entityId: prescription.id,
      entityLabel: `${prescription.drugName} for resident ${prescription.residentId}`,
      newValue: toJsonValue(prescription) as Record<string, unknown>,
      metadata: {
        drugName: prescription.drugName,
        dose: prescription.dose,
        ...metadata,
      },
    });
  }
}
