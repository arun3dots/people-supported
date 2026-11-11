import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { prisma, PrismaTransactionClient } from '@repo/db';
import {
  AdministerMedicationDTO,
  AdministerAdHocMedicationDTO,
} from '@repo/schema';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class ResidentMedicationAdminService {
  constructor(
    private readonly auditService: AuditService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async administerMedication(
    data: AdministerMedicationDTO,
    carerId: string,
    tenantId: string,
  ) {
    const round = await prisma.medicationRound.findFirst({
      where: { id: data.roundId, resident: { id: data.residentId, tenantId } },
      include: { resident: true },
    });

    if (!round) {
      throw new NotFoundException('Medication round not found');
    }

    if (round.resident.recordState && round.resident.recordState !== 'Active') {
      throw new BadRequestException(
        `Medication cannot be administered when resident record state is "${round.resident.recordState}"`,
      );
    }

    // Controlled Drug Verification (Misuse of Drugs Act 1971 / NICE SC1)
    const isControlledDrug =
      round.instructions?.toLowerCase().includes('controlled') ||
      round.drugName.toLowerCase().includes('morphine') ||
      round.drugName.toLowerCase().includes('oxycodone') ||
      round.drugName.toLowerCase().includes('fentanyl') ||
      round.drugName.toLowerCase().includes('midazolam') ||
      round.drugName.toLowerCase().includes('lorazepam');

    if (isControlledDrug && data.status === 'Given') {
      if (!data.witnessName && !data.witnessId) {
        throw new BadRequestException(
          'Controlled Drugs (Schedule 2 & 3) require a second staff witness countersignature under NICE SC1.',
        );
      }
      if (data.witnessId && data.witnessId === carerId) {
        throw new BadRequestException(
          'The administering staff member cannot countersign as their own witness.',
        );
      }
    }

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const administration = await tx.medAdministration.create({
        data: {
          roundId: data.roundId,
          status: data.status,
          reason: data.reason,
          carerId,
          witnessId: data.witnessId ?? null,
          witnessName: data.witnessName ?? null,
          witnessRole: data.witnessRole ?? null,
          witnessSignature: data.witnessSignature ?? null,
          createdById: carerId,
          updatedById: carerId,
        },
      });

      await tx.medicationRound.update({
        where: { id: data.roundId },
        data: {
          status: data.status === 'Given' ? 'Administered' : 'Pending',
          updatedById: carerId,
        },
      });

      if (data.vitals) {
        const v = data.vitals;
        const observation = await tx.observation.create({
          data: {
            residentId: data.residentId,
            bpSystolic: v.bpSystolic ? Number(v.bpSystolic) : null,
            bpDiastolic: v.bpDiastolic ? Number(v.bpDiastolic) : null,
            bloodSugar: v.bloodSugar ? Number(v.bloodSugar) : null,
            pulse: v.pulse ? Number(v.pulse) : null,
            temp: v.temp ? Number(v.temp) : null,
            respiration: v.respiration ? Number(v.respiration) : null,
            spo2: v.spo2 ? Number(v.spo2) : null,
            notes: `Vitals taken during MAR administration of ${round.drugName}`,
            createdById: carerId,
            updatedById: carerId,
          },
        });
        await tx.medAdministration.update({
          where: { id: administration.id },
          data: { observationId: observation.id },
        });
      }

      await tx.careTimeline.create({
        data: {
          residentId: data.residentId,
          eventType: 'MEDICATION_ADMINISTERED',
          summary: `Medication ${round.drugName} marked as ${data.status}. ${data.reason ? `Reason: ${data.reason}` : ''}`,
          carerId,
          createdById: carerId,
          updatedById: carerId,
        },
      });

      let actionType:
        | 'DOSE_GIVEN'
        | 'DOSE_MISSED'
        | 'DOSE_REFUSED'
        | 'DOSE_WITHHELD' = 'DOSE_GIVEN';
      if (data.status === 'Refused') actionType = 'DOSE_REFUSED';
      if (data.status === 'Omitted' || data.status === 'NPO')
        actionType = 'DOSE_WITHHELD';

      void this.auditService.emitMedication({
        userId: carerId,
        tenantId,
        actionType,
        entityType: 'MedicationRound',
        entityId: data.roundId,
        entityLabel: `${round.drugName} for resident ${data.residentId}`,
        newValue: toJsonValue(administration) as Record<string, unknown>,
        metadata: {
          drugName: round.drugName,
          dose: round.dose,
          form: round.form || 'Unknown',
          scheduledTime: round.scheduledTime.toISOString(),
          administeredTime: administration.administeredAt.toISOString(),
          refusalReason: data.status === 'Refused' ? data.reason : undefined,
          withheldReason:
            data.status === 'Omitted' || data.status === 'NPO'
              ? data.reason
              : undefined,
        },
      });

      // Matrix EMAR-004 (Controlled drug discrepancy) & EMAR-007 (Medication error)
      if (this.notificationsService && data.status !== 'Given') {
        const reasonLower = (data.reason || '').toLowerCase();
        const isDiscrepancy =
          isControlledDrug &&
          (reasonLower.includes('discrepancy') ||
            reasonLower.includes('mismatch') ||
            reasonLower.includes('balance') ||
            data.status === 'Omitted');

        if (isDiscrepancy) {
          void this.notificationsService.triggerMatrixAlert('EMAR-004', {
            tenantId,
            residentId: data.residentId,
            title: `CONTROLLED DRUG DISCREPANCY: ${round.drugName}`,
            message: `Controlled drug (${round.drugName} ${round.dose}) recorded as ${data.status}${data.reason ? ` — ${data.reason}` : ''}. Immediate RM reconciliation required.`,
            actionUrl: `/residents/${data.residentId}/medication`,
            metadata: {
              roundId: round.id,
              drugName: round.drugName,
              status: data.status,
            },
          });
        }

        if (
          data.status === 'Omitted' ||
          reasonLower.includes('error') ||
          reasonLower.includes('wrong') ||
          reasonLower.includes('adverse')
        ) {
          void this.notificationsService.triggerMatrixAlert('EMAR-007', {
            tenantId,
            residentId: data.residentId,
            title: `MEDICATION ERROR / OMISSION: ${round.drugName}`,
            message: `eMAR medication error/omission recorded for ${round.drugName} (${round.dose}): ${data.status}${data.reason ? ` — ${data.reason}` : ''}.`,
            actionUrl: `/residents/${data.residentId}/medication`,
            metadata: {
              roundId: round.id,
              drugName: round.drugName,
              status: data.status,
            },
          });
        }
      }

      return administration;
    });
  }

  async administerAdHocMedication(
    residentId: string,
    data: AdministerAdHocMedicationDTO,
    carerId: string,
    tenantId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    if (resident.recordState && resident.recordState !== 'Active') {
      throw new BadRequestException(
        `Medication cannot be administered when resident record state is "${resident.recordState}"`,
      );
    }

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const round = await tx.medicationRound.create({
        data: {
          residentId,
          drugName: data.drugName,
          dose: data.dose,
          form: data.form,
          instructions: data.instructions,
          imageUrls: data.imageUrls || [],
          scheduledTime: new Date(),
          status: data.status === 'Given' ? 'Administered' : 'Pending',
          isAdhoc: true,
          createdById: carerId,
          updatedById: carerId,
        },
      });

      const administration = await tx.medAdministration.create({
        data: {
          roundId: round.id,
          status: data.status,
          reason: data.reason,
          carerId,
          createdById: carerId,
          updatedById: carerId,
        },
      });

      if (data.vitals) {
        const observation = await tx.observation.create({
          data: {
            residentId,
            bpSystolic: data.vitals.bpSystolic
              ? Number(data.vitals.bpSystolic)
              : null,
            bpDiastolic: data.vitals.bpDiastolic
              ? Number(data.vitals.bpDiastolic)
              : null,
            bloodSugar: data.vitals.bloodSugar
              ? Number(data.vitals.bloodSugar)
              : null,
            pulse: data.vitals.pulse ? Number(data.vitals.pulse) : null,
            temp: data.vitals.temp ? Number(data.vitals.temp) : null,
            respiration: data.vitals.respiration
              ? Number(data.vitals.respiration)
              : null,
            spo2: data.vitals.spo2 ? Number(data.vitals.spo2) : null,
            notes: `Vitals taken during ad-hoc MAR administration of ${round.drugName}`,
            createdById: carerId,
            updatedById: carerId,
          },
        });

        await tx.medAdministration.update({
          where: { id: administration.id },
          data: { observationId: observation.id },
        });
      }

      await tx.careTimeline.create({
        data: {
          residentId,
          eventType: 'MEDICATION_ADMINISTERED_ADHOC',
          summary: `Ad-Hoc Medication ${round.drugName} marked as ${data.status}. ${data.reason ? `Reason: ${data.reason}` : ''}`,
          carerId,
          createdById: carerId,
          updatedById: carerId,
        },
      });

      let actionType: 'DOSE_GIVEN' | 'DOSE_REFUSED' | 'DOSE_WITHHELD' =
        'DOSE_GIVEN';
      if (data.status === 'Refused') actionType = 'DOSE_REFUSED';
      if (data.status === 'Omitted') actionType = 'DOSE_WITHHELD';

      void this.auditService.emitMedication({
        userId: carerId,
        tenantId,
        actionType,
        entityType: 'MedicationRound',
        entityId: round.id,
        entityLabel: `Ad-Hoc ${round.drugName} for resident ${residentId}`,
        newValue: toJsonValue(administration) as Record<string, unknown>,
        metadata: {
          drugName: round.drugName,
          dose: round.dose,
          form: round.form,
          scheduledTime: round.scheduledTime.toISOString(),
          administeredTime: administration.administeredAt.toISOString(),
          isAdhoc: true,
          refusalReason: data.status === 'Refused' ? data.reason : undefined,
        },
      });

      const adminsAndManagers = await tx.user.findMany({
        where: {
          tenantId,
          role: {
            name: { in: ['Admin', 'Manager'] },
          },
        },
        select: { id: true },
      });

      if (adminsAndManagers.length > 0) {
        await tx.notification.createMany({
          data: adminsAndManagers.map((user) => ({
            tenantId,
            recipientId: user.id,
            title: 'Unlisted Medication Administered',
            message: `An unlisted medication (${round.drugName}) was recorded for ${resident.fullName}.`,
            category: 'MEDICATION',
            priority: 'High',
            channels: ['WEB_PUSH'],
          })),
        });
      }

      return administration;
    });
  }
}
