import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, PrismaTransactionClient } from '@repo/db';
import { AmendMedAdministrationDTO } from '@repo/schema';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class ResidentMedicationAmendService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * B-06: Clinical Rectification Strike-Through Workflow for eMAR administration.
   * Under UK GDPR Art 16 & CQC Reg 17, preserves original administration with isSuperseded=true.
   */
  async amendMedicationAdministration(
    administrationId: string,
    dto: AmendMedAdministrationDTO,
    userId: string,
    tenantId: string,
  ) {
    const original = await prisma.medAdministration.findFirst({
      where: {
        id: administrationId,
        round: { resident: { tenantId } },
        deletedAt: null,
      },
      include: {
        round: {
          include: { resident: true },
        },
      },
    });

    if (!original) {
      throw new NotFoundException('Medication administration record not found');
    }
    if (original.isSuperseded) {
      throw new BadRequestException(
        'This administration record has already been superseded by a prior amendment',
      );
    }
    if (
      original.round.resident.recordState &&
      original.round.resident.recordState !== 'Active'
    ) {
      throw new BadRequestException(
        `Administration record cannot be amended when resident record state is "${original.round.resident.recordState}"`,
      );
    }

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const replacement = await tx.medAdministration.create({
        data: {
          roundId: original.roundId,
          status: dto.status,
          reason: dto.reason ?? original.reason,
          carerId: original.carerId,
          witnessId: dto.witnessId ?? original.witnessId,
          witnessName: dto.witnessName ?? original.witnessName,
          witnessRole: dto.witnessRole ?? original.witnessRole,
          witnessSignature: dto.witnessSignature ?? original.witnessSignature,
          observationId: original.observationId,
          createdById: userId,
          updatedById: userId,
        },
      });

      await tx.medAdministration.update({
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

      await tx.medicationRound.update({
        where: { id: original.roundId },
        data: {
          status: dto.status === 'Given' ? 'Administered' : 'Pending',
          updatedById: userId,
        },
      });

      await tx.careTimeline.create({
        data: {
          residentId: original.round.residentId,
          eventType: 'MEDICATION_ADMINISTRATION_AMENDED',
          summary: `eMAR administration for ${original.round.drugName} amended from ${original.status} to ${dto.status} (strike-through). Reason: ${dto.correctionReason}`,
          carerId: userId,
          createdById: userId,
          updatedById: userId,
        },
      });

      void this.auditService.emitMedication({
        userId,
        tenantId,
        actionType: 'DOSE_GIVEN',
        entityType: 'MedAdministration',
        entityId: replacement.id,
        entityLabel: `Amended ${original.round.drugName} for resident ${original.round.residentId}`,
        oldValue: toJsonValue(original) as Record<string, unknown>,
        newValue: toJsonValue(replacement) as Record<string, unknown>,
        metadata: {
          drugName: original.round.drugName,
          dose: original.round.dose,
          supersededAdministrationId: original.id,
          correctionReason: dto.correctionReason,
          oldStatus: original.status,
          newStatus: dto.status,
        },
      });

      return { originalId: original.id, replacement };
    });
  }
}
