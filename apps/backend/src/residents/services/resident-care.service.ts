import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, PrismaTransactionClient } from '@repo/db';
import { CarePlanDTO } from '@repo/schema';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class ResidentCareService {
  constructor(private readonly auditService: AuditService) {}

  async addObservation(
    residentId: string,
    observationDto: {
      temp?: number;
      pulse?: number;
      bpSystolic?: number;
      bpDiastolic?: number;
      oxygen?: number;
      news2Score?: number;
      isAbnormal?: boolean;
    },
    creatorId: string,
    tenantId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const observation = await tx.observation.create({
        data: {
          residentId,
          ...observationDto,
          createdById: creatorId,
          updatedById: creatorId,
        },
      });

      await tx.careTimeline.create({
        data: {
          residentId,
          eventType: 'OBSERVATION_RECORDED',
          summary: `New clinical observation recorded. NEWS2 Score: ${observationDto.news2Score || 'N/A'}`,
          carerId: creatorId,
          createdById: creatorId,
          updatedById: creatorId,
        },
      });

      void this.auditService.emitClinicalDoc({
        userId: creatorId,
        tenantId,
        actionType: 'OBSERVATION_RECORDED',
        entityType: 'Resident',
        entityId: residentId,
        entityLabel: resident.fullName,
        newValue: toJsonValue(observationDto) as Record<string, unknown>,
      });

      return observation;
    });
  }

  async saveCarePlan(
    residentId: string,
    carePlanDto: CarePlanDTO,
    updaterId: string,
    tenantId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      let carePlan = await tx.carePlan.findFirst({
        where: { residentId, tenantId, status: 'Active' },
      });

      if (!carePlan) {
        carePlan = await tx.carePlan.create({
          data: {
            residentId,
            tenantId,
            branchId: resident.branchId,
            status: 'Active',
            authorId: updaterId,
            nextReviewDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1),
            ),
          },
        });
      }

      const lastVersion = await tx.carePlanSection.findFirst({
        where: {
          carePlanId: carePlan.id,
          sectionName: carePlanDto.sectionName,
        },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (lastVersion?.version || 0) + 1;

      await tx.carePlanSection.updateMany({
        where: {
          carePlanId: carePlan.id,
          sectionName: carePlanDto.sectionName,
          deletedAt: null,
        },
        data: { deletedAt: new Date(), deletedById: updaterId },
      });

      const newSection = await tx.carePlanSection.create({
        data: {
          carePlanId: carePlan.id,
          sectionName: carePlanDto.sectionName,
          content: JSON.stringify(carePlanDto.content),
          version: nextVersion,
          authorId: updaterId,
          createdById: updaterId,
          updatedById: updaterId,
        },
      });

      void this.auditService.emitCarePlan({
        userId: updaterId,
        tenantId,
        actionType: 'CARE_PLAN_UPDATED',
        entityType: 'CarePlan',
        entityId: newSection.id,
        entityLabel: `${resident.fullName} - ${carePlanDto.sectionName}`,
        oldValue: lastVersion
          ? (toJsonValue(lastVersion) as Record<string, unknown>)
          : undefined,
        newValue: toJsonValue(newSection) as Record<string, unknown>,
        metadata: {
          sectionName: carePlanDto.sectionName,
          version: nextVersion,
        },
      });

      return newSection;
    });
  }

  async addCareNote(
    residentId: string,
    dto: { category?: string; content: string },
    creatorId: string,
    tenantId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const created = await prisma.careTimeline.create({
      data: {
        residentId: resident.id,
        eventType: dto.category || 'General',
        summary: dto.content,
        carerId: creatorId,
        createdById: creatorId,
        updatedById: creatorId,
      },
      include: {
        carer: {
          select: {
            fullName: true,
            role: { select: { name: true } },
          },
        },
      },
    });

    await this.auditService.emitClinicalDoc({
      tenantId,
      userId: creatorId,
      residentId: resident.id,
      actionType: 'CARE_NOTE_ADDED',
      entityId: created.id,
      entityType: 'CareNote',
      entityLabel: `Care Note (${created.eventType})`,
      description: `Added care note for resident ${resident.fullName}: "${dto.content.slice(0, 100)}"`,
      newValue: {
        id: created.id,
        category: created.eventType,
        content: created.summary,
        timestamp: created.timestamp.toISOString(),
      },
    });

    return created;
  }

  async updateCareNote(
    residentId: string,
    noteId: string,
    dto: { category?: string; content?: string },
    userId: string,
    tenantId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const existing = await prisma.careTimeline.findFirst({
      where: {
        id: noteId,
        residentId: resident.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Care note not found');
    }

    const oldValue = {
      id: existing.id,
      category: existing.eventType,
      content: existing.summary,
      timestamp: existing.timestamp.toISOString(),
      updatedAt: existing.updatedAt?.toISOString() || null,
    };

    const updated = await prisma.careTimeline.update({
      where: { id: noteId },
      data: {
        ...(dto.category && { eventType: dto.category }),
        ...(dto.content && { summary: dto.content }),
        updatedById: userId,
      },
      include: {
        carer: {
          select: {
            fullName: true,
            role: { select: { name: true } },
          },
        },
      },
    });

    const newValue = {
      id: updated.id,
      category: updated.eventType,
      content: updated.summary,
      timestamp: updated.timestamp.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    await this.auditService.emitClinicalDoc({
      tenantId,
      userId,
      residentId: resident.id,
      actionType: 'CARE_NOTE_UPDATED',
      entityId: updated.id,
      entityType: 'CareNote',
      entityLabel: `Care Note (${updated.eventType})`,
      description: `Updated care note for resident ${resident.fullName}: "${(dto.content || existing.summary).slice(0, 100)}"`,
      oldValue,
      newValue,
    });

    return updated;
  }

  async deleteCareNote(
    residentId: string,
    noteId: string,
    userId: string,
    tenantId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const existing = await prisma.careTimeline.findFirst({
      where: {
        id: noteId,
        residentId: resident.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Care note not found');
    }

    const oldValue = {
      id: existing.id,
      category: existing.eventType,
      content: existing.summary,
      timestamp: existing.timestamp.toISOString(),
      deletedAt: null,
    };

    const now = new Date();
    await prisma.careTimeline.update({
      where: { id: noteId },
      data: {
        deletedAt: now,
        deletedById: userId,
        updatedById: userId,
      },
    });

    const newValue = {
      id: existing.id,
      category: existing.eventType,
      content: existing.summary,
      deletedAt: now.toISOString(),
      deletedById: userId,
    };

    await this.auditService.emitClinicalDoc({
      tenantId,
      userId,
      residentId: resident.id,
      actionType: 'CARE_NOTE_DELETED',
      entityId: existing.id,
      entityType: 'CareNote',
      entityLabel: `Care Note (${existing.eventType})`,
      description: `Soft-deleted care note for resident ${resident.fullName}: "${existing.summary.slice(0, 100)}"`,
      oldValue,
      newValue,
    });

    return { success: true, message: 'Care note deleted successfully' };
  }
}
