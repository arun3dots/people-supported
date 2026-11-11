import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Prisma } from '@repo/db';
import type { UpdateCarePlanSectionDTO } from '@repo/schema';
import { toJsonValue } from '../common/utils/json.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CarePlanSectionService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves all person-centred domain sections for a care plan
   */
  async getSections(carePlanId: string, tenantId: string) {
    const plan = await prisma.carePlan.findFirst({
      where: { id: carePlanId, tenantId },
      select: { id: true, residentId: true },
    });

    if (!plan) {
      throw new NotFoundException(`Care Plan ${carePlanId} not found`);
    }

    return prisma.carePlanSection.findMany({
      where: { carePlanId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Updates or creates a person-centred domain section within a care plan
   */
  async updateSection(
    carePlanId: string,
    sectionName: string,
    dto: UpdateCarePlanSectionDTO,
    tenantId: string,
    userId: string,
  ) {
    const plan = await prisma.carePlan.findFirst({
      where: { id: carePlanId, tenantId },
      select: { id: true, residentId: true },
    });

    if (!plan) {
      throw new NotFoundException(`Care Plan ${carePlanId} not found`);
    }

    const existing = await prisma.carePlanSection.findFirst({
      where: { carePlanId, sectionName },
    });

    let updated;
    if (existing) {
      updated = await prisma.carePlanSection.update({
        where: { id: existing.id },
        data: {
          content: dto.content !== undefined ? dto.content : existing.content,
          sectionData:
            dto.sectionData !== undefined
              ? dto.sectionData
                ? toJsonValue(dto.sectionData)
                : Prisma.JsonNull
              : undefined,
          authorId: userId,
          updatedById: userId,
        },
      });
    } else {
      updated = await prisma.carePlanSection.create({
        data: {
          carePlanId,
          sectionName,
          content: dto.content || '',
          sectionData: dto.sectionData
            ? toJsonValue(dto.sectionData)
            : Prisma.JsonNull,
          authorId: userId,
          createdById: userId,
        },
      });
    }

    await this.auditService.emitCarePlan({
      tenantId,
      userId,
      entityId: plan.id,
      residentId: plan.residentId,
      actionType: 'CARE_PLAN_UPDATED',
      description: `Updated person-centred care plan domain "${sectionName}".`,
      newValue: { sectionName, updatedId: updated.id },
    });

    return updated;
  }
}
