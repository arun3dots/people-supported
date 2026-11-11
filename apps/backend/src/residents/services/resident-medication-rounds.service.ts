import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Prisma } from '@repo/db';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class ResidentMedicationRoundsService {
  constructor(private readonly auditService: AuditService) {}

  async getMedicationRounds(residentId: string, tenantId: string) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    return prisma.medicationRound.findMany({
      where: { residentId, deletedAt: null },
      orderBy: { scheduledTime: 'asc' },
      include: {
        administrations: {
          orderBy: { administeredAt: 'desc' },
          take: 1,
          include: { observation: true },
        },
      },
    });
  }

  async createMedicationRound(
    residentId: string,
    data: Prisma.MedicationRoundUncheckedCreateInput,
    creatorId: string,
    tenantId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    if (resident.status === 'Discharged') {
      throw new BadRequestException(
        'Medication cannot be prescribed for discharged residents',
      );
    }
    if (resident.recordState && resident.recordState !== 'Active') {
      throw new BadRequestException(
        `Medication cannot be created when resident record state is "${resident.recordState}"`,
      );
    }

    const round = await prisma.medicationRound.create({
      data: {
        ...data,
        residentId,
        createdById: creatorId,
        updatedById: creatorId,
      },
    });

    void this.auditService.emitMedication({
      userId: creatorId,
      tenantId,
      actionType: 'MEDICATION_ROUND_CREATED',
      entityType: 'MedicationRound',
      entityId: round.id,
      entityLabel: `${round.drugName} for resident ${residentId}`,
      newValue: toJsonValue(round) as Record<string, unknown>,
      metadata: {
        drugName: round.drugName,
        dose: round.dose,
        form: round.form || 'Unknown',
        scheduledTime: round.scheduledTime.toISOString(),
      },
    });

    return round;
  }

  async updateMedicationRound(
    roundId: string,
    data: Prisma.MedicationRoundUpdateInput,
    updaterId: string,
    tenantId: string,
  ) {
    const round = await prisma.medicationRound.findFirst({
      where: { id: roundId, resident: { tenantId } },
      include: { resident: true },
    });

    if (!round) {
      throw new NotFoundException('Medication round not found');
    }
    if (round.resident.recordState && round.resident.recordState !== 'Active') {
      throw new BadRequestException(
        `Medication round cannot be updated when resident record state is "${round.resident.recordState}"`,
      );
    }

    return prisma.medicationRound.update({
      where: { id: roundId },
      data: {
        ...data,
        updatedById: updaterId,
      },
    });
  }

  /**
   * C-07: Prevent deletion of MedicationRound if doses/administrations have already been recorded.
   * Under NICE SC1 and CQC Regulations, recorded dose administrations form immutable clinical history.
   */
  async deleteMedicationRound(
    roundId: string,
    deleterId: string,
    tenantId: string,
    reason: string,
  ) {
    const round = await prisma.medicationRound.findFirst({
      where: { id: roundId, resident: { tenantId } },
      include: {
        administrations: { select: { id: true } },
        resident: true,
      },
    });

    if (!round) {
      throw new NotFoundException('Medication round not found');
    }

    if (round.administrations.length > 0) {
      throw new BadRequestException(
        'Cannot delete a medication round that already has recorded administrations. Under NICE SC1 guidelines, amend the administration record instead.',
      );
    }

    if (round.resident.recordState && round.resident.recordState !== 'Active') {
      throw new BadRequestException(
        `Medication round cannot be deleted when resident record state is "${round.resident.recordState}"`,
      );
    }

    const updated = await prisma.medicationRound.update({
      where: { id: roundId },
      data: {
        deletedAt: new Date(),
        deletedById: deleterId,
      },
    });

    void this.auditService.emitMedication({
      userId: deleterId,
      tenantId,
      actionType: 'MEDICATION_ROUND_DELETED',
      entityType: 'MedicationRound',
      entityId: roundId,
      entityLabel: `${round.drugName} for resident ${round.residentId}`,
      oldValue: toJsonValue(round) as Record<string, unknown>,
      metadata: {
        drugName: round.drugName,
        dose: round.dose,
        deletionReason: reason,
      },
    });

    return updated;
  }
}
