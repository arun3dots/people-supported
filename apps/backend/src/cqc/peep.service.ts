import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { PeepRecordDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PeepService {
  constructor(private readonly auditService: AuditService) {}

  async upsertPeep(dto: PeepRecordDTO, userId: string, tenantId: string) {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId, deletedAt: null },
      select: { id: true, fullName: true },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    const nextReview = new Date(dto.nextReviewDue);

    const record = await prisma.peepRecord.upsert({
      where: { residentId: dto.residentId },
      create: {
        tenantId,
        residentId: dto.residentId,
        evacuationMobility: dto.evacuationMobility,
        daytimeLocation: dto.daytimeLocation || null,
        nighttimeLocation: dto.nighttimeLocation || null,
        staffAssistanceCount: dto.staffAssistanceCount,
        equipmentNeeded: dto.equipmentNeeded || null,
        hearingImpairment: dto.hearingImpairment,
        visualImpairment: dto.visualImpairment,
        cognitiveImpairment: dto.cognitiveImpairment,
        specificInstructions: dto.specificInstructions || null,
        reviewedById: userId,
        nextReviewDue: nextReview,
      },
      update: {
        evacuationMobility: dto.evacuationMobility,
        daytimeLocation: dto.daytimeLocation || null,
        nighttimeLocation: dto.nighttimeLocation || null,
        staffAssistanceCount: dto.staffAssistanceCount,
        equipmentNeeded: dto.equipmentNeeded || null,
        hearingImpairment: dto.hearingImpairment,
        visualImpairment: dto.visualImpairment,
        cognitiveImpairment: dto.cognitiveImpairment,
        specificInstructions: dto.specificInstructions || null,
        reviewedAt: new Date(),
        reviewedById: userId,
        nextReviewDue: nextReview,
      },
    });

    void this.auditService.emit({
      categoryType: 'CLINICAL_DOC',
      actionType: 'PEEP_UPDATED',
      entityType: 'PeepRecord',
      entityId: record.id,
      tenantId,
      userId,
      newValue: {
        evacuationMobility: record.evacuationMobility,
        staffAssistanceCount: record.staffAssistanceCount,
      },
    });

    return record;
  }

  async getByResident(residentId: string, tenantId: string) {
    const record = await prisma.peepRecord.findFirst({
      where: { residentId, tenantId },
      include: {
        resident: { select: { id: true, fullName: true, status: true } },
      },
    });
    if (!record) {
      throw new NotFoundException('PEEP record not found for resident');
    }
    return record;
  }

  async getAllTenantPeeps(tenantId: string) {
    return prisma.peepRecord.findMany({
      where: { tenantId },
      include: {
        resident: {
          select: { id: true, fullName: true, status: true, bed: true },
        },
      },
      orderBy: { nextReviewDue: 'asc' },
    });
  }
}
