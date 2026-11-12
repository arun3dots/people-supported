import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Resident, PrismaTransactionClient } from '@repo/db';
import { AdmitConfirmDTO, isUuid } from '@repo/schema';

import { CarePlanAutoDraftService } from '../../care-plan/care-plan-auto-draft.service';
import { toJsonValue } from '../../common/utils/json.util';

@Injectable()
export class ResidentAdmissionService {
  constructor(
    private readonly carePlanAutoDraftService: CarePlanAutoDraftService,
  ) {}

  async confirmAdmission(
    id: string,
    dto: AdmitConfirmDTO,
    creatorId: string,
    tenantId: string,
  ): Promise<Resident> {
    const resident = await prisma.resident.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    const currentPreAdmission = await prisma.residentPreAdmission.findFirst({
      where: { residentId: id, tenantId, isCurrent: true },
      select: { roomAllocation: true },
    });
    const roomAllocation = currentPreAdmission?.roomAllocation;
    const roomAllocationObj =
      roomAllocation &&
      typeof roomAllocation === 'object' &&
      !Array.isArray(roomAllocation)
        ? (roomAllocation as Record<string, unknown>)
        : null;
    const savedBedId =
      roomAllocationObj && typeof roomAllocationObj.bedId === 'string'
        ? roomAllocationObj.bedId
        : null;
    const savedLandlord =
      roomAllocationObj &&
      typeof roomAllocationObj.landlord === 'string' &&
      roomAllocationObj.landlord.trim()
        ? roomAllocationObj.landlord.trim()
        : null;
    const bedId = savedBedId || dto.bedId;
    if (bedId && isUuid(bedId)) {
      const bed = await prisma.bed.findFirst({
        where: { id: bedId, branchId: resident.branchId, deletedAt: null },
      });
      if (!bed) throw new NotFoundException('Bed not found');
      if (bed.status === 'Occupied' && bed.residentId !== id) {
        throw new ConflictException('Bed is already occupied');
      }
    }

    const existingSl =
      resident.supportedLivingDetails &&
      typeof resident.supportedLivingDetails === 'object' &&
      !Array.isArray(resident.supportedLivingDetails)
        ? (resident.supportedLivingDetails as Record<string, unknown>)
        : {};
    const existingTenancy =
      existingSl.tenancy &&
      typeof existingSl.tenancy === 'object' &&
      !Array.isArray(existingSl.tenancy)
        ? (existingSl.tenancy as Record<string, unknown>)
        : {};
    const nextSupportedLivingDetails =
      savedLandlord && !existingTenancy.landlord
        ? {
            ...existingSl,
            tenancy: {
              ...existingTenancy,
              landlord: savedLandlord,
            },
          }
        : undefined;

    const confirmedResident = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const updatedResident = await tx.resident.update({
          where: { id },
          data: {
            isDraft: false,
            status: 'Active',
            admissionStep: 11,
            admissionDate: new Date(),
            updatedById: creatorId,
            ...(nextSupportedLivingDetails
              ? {
                  supportedLivingDetails: toJsonValue(
                    nextSupportedLivingDetails,
                  ),
                }
              : {}),
          },
        });

        if (bedId && isUuid(bedId)) {
          await tx.bed.update({
            where: { id: bedId },
            data: {
              status: 'Occupied',
              residentId: id,
              updatedById: creatorId,
            },
          });
        }

        await tx.careTimeline.create({
          data: {
            residentId: id,
            eventType: 'RESIDENT_ADMITTED',
            summary: `Resident admission confirmed and linked to bed ${bedId || 'unassigned'}`,
            carerId: creatorId,
            createdById: creatorId,
            updatedById: creatorId,
          },
        });

        return updatedResident as Resident;
      },
    );

    try {
      await this.carePlanAutoDraftService.generateDraftFromAdmission(
        id,
        tenantId,
        creatorId,
      );
    } catch {
      // Non-blocking auto-draft
    }

    return confirmedResident;
  }
}
