import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, Resident, PrismaTransactionClient } from '@repo/db';
import {
  DischargeResidentDTO,
  UpdateResidentRecordStateDTO,
} from '@repo/schema';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class ResidentLifecycleService {
  constructor(private readonly auditService: AuditService) {}

  async dischargeResident(
    id: string,
    dischargeDto: DischargeResidentDTO,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    const resident = await prisma.resident.findFirst({
      where: { id, tenantId },
      include: { bed: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (resident.status === 'Discharged') {
      throw new ConflictException('Resident is already discharged');
    }

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const updatedResident = await tx.resident.update({
        where: { id: resident.id },
        data: {
          status: 'Discharged',
          updatedById: updaterId,
        },
      });

      if (resident.bed) {
        await tx.bed.update({
          where: { id: resident.bed.id },
          data: {
            status: 'Available',
            residentId: null,
            updatedById: updaterId,
          },
        });
      }

      await tx.councilPO.updateMany({
        where: { residentId: resident.id, endDate: null },
        data: { endDate: new Date(), updatedById: updaterId },
      });

      const reviewsSummary = `CarePlan: ${dischargeDto.carePlanReview || 'Completed'}, Risk: ${dischargeDto.riskAssessment || 'Low Risk'}, Meds: ${dischargeDto.medicationReview || 'Completed'}`;
      const notifSummary = `Notified: Family=${dischargeDto.familyNotified ? 'Yes' : 'No'}, GP=${dischargeDto.gpNotified ? 'Yes' : 'No'}`;
      await tx.careTimeline.create({
        data: {
          residentId: resident.id,
          eventType: 'RESIDENT_DISCHARGED',
          summary: `Discharge Type: ${dischargeDto.dischargeType}. Reason: ${dischargeDto.reason}. ${reviewsSummary}. ${notifSummary}`,
          carerId: updaterId,
          createdById: updaterId,
          updatedById: updaterId,
        },
      });

      void this.auditService.emit({
        categoryType: 'DATA_ACCESS',
        actionType: 'RESIDENT_RECORD_VIEWED',
        entityType: 'Resident',
        entityId: resident.id,
        tenantId,
        userId: updaterId,
        oldValue: toJsonValue({ status: resident.status }) as Record<
          string,
          unknown
        >,
        newValue: toJsonValue({
          status: 'Discharged',
          dischargeType: dischargeDto.dischargeType,
          reason: dischargeDto.reason,
          dischargeDate: dischargeDto.dischargeDate,
          dischargeTime: dischargeDto.dischargeTime,
          carePlanReview: dischargeDto.carePlanReview,
          riskAssessment: dischargeDto.riskAssessment,
          medicationReview: dischargeDto.medicationReview,
          familyNotified: dischargeDto.familyNotified,
          gpNotified: dischargeDto.gpNotified,
        }) as Record<string, unknown>,
      });

      return updatedResident as Resident;
    });
  }

  async suggestSuitableCarers(residentId: string, tenantId: string) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    const requiredCerts = resident.requiredCertifications || [];

    const staff = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      include: {
        certifications: {
          where: { status: 'Valid' },
        },
      },
    });

    if (requiredCerts.length === 0) {
      return staff.map((s) => ({
        ...s,
        matchPercentage: 100,
      }));
    }

    const rankedStaff = staff.map((s) => {
      const heldCerts = s.certifications.map((c) => c.name);
      let matched = 0;
      for (const req of requiredCerts) {
        if (heldCerts.includes(req)) {
          matched++;
        }
      }
      const matchPercentage = Math.round(
        (matched / requiredCerts.length) * 100,
      );
      return {
        ...s,
        matchPercentage,
      };
    });

    return rankedStaff.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  async assignCarerToResident(
    residentId: string,
    carerId: string,
    tenantId: string,
    assignerId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    const result = await prisma.resident.update({
      where: { id: residentId },
      data: {
        keyworkerId: carerId,
        staff: {
          connect: { id: carerId },
        },
        updatedById: assignerId,
      },
    });

    await prisma.careTimeline.create({
      data: {
        residentId,
        eventType: 'CARER_ASSIGNED',
        summary: `Carer explicitly assigned to resident`,
        carerId,
        createdById: assignerId,
        updatedById: assignerId,
      },
    });

    return result;
  }

  async assignResidentToBed(
    residentId: string,
    bedId: string,
    tenantId: string,
    assignerId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    await prisma.bed.updateMany({
      where: { residentId },
      data: { status: 'Available', residentId: null },
    });

    const result = await prisma.bed.update({
      where: { id: bedId },
      data: {
        status: 'Occupied',
        residentId,
        updatedById: assignerId,
      },
    });

    return result;
  }

  /**
   * B-07: Erasure Requests, Restriction of Processing & Legal Hold (UK GDPR Art 17/18 & CQC Reg 17).
   * Restricts or locks records when under LegalHold, Restricted processing, or Archived.
   */
  async updateRecordState(
    residentId: string,
    dto: UpdateResidentRecordStateDTO,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId, deletedAt: null },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    const updated = await prisma.resident.update({
      where: { id: residentId },
      data: {
        recordState: dto.recordState,
        recordStateReason: dto.reason,
        recordStateUpdatedAt: new Date(),
        recordStateUpdatedById: updaterId,
        updatedById: updaterId,
      },
    });

    await prisma.careTimeline.create({
      data: {
        residentId,
        eventType: 'RECORD_STATE_CHANGED',
        summary: `Record processing state changed to "${dto.recordState}". Reason: ${dto.reason}`,
        carerId: updaterId,
        createdById: updaterId,
        updatedById: updaterId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'RESIDENT_RECORD_VIEWED',
      entityType: 'Resident',
      entityId: residentId,
      tenantId,
      userId: updaterId,
      oldValue: toJsonValue({ recordState: resident.recordState }) as Record<
        string,
        unknown
      >,
      newValue: toJsonValue({
        recordState: dto.recordState,
        reason: dto.reason,
      }) as Record<string, unknown>,
    });

    return updated as unknown as Resident;
  }
}
