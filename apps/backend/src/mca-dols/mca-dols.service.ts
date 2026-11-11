import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  CreateMentalCapacityAssessmentDTO,
  UpdateMentalCapacityAssessmentDTO,
  CreateDolsAuthorizationDTO,
  UpdateDolsAuthorizationDTO,
} from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class McaDolsService {
  constructor(private readonly auditService: AuditService) {}

  async createAssessment(
    tenantId: string,
    assessorId: string,
    dto: CreateMentalCapacityAssessmentDTO,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId },
      select: { id: true, fullName: true, branchId: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (dto.carePlanId) {
      const plan = await prisma.carePlan.findFirst({
        where: { id: dto.carePlanId, tenantId },
        select: { id: true },
      });
      if (!plan) {
        throw new NotFoundException('Associated Care Plan not found');
      }
    }

    const assessedAt = dto.assessedAt ? new Date(dto.assessedAt) : new Date();
    const reviewDate = dto.reviewDate ? new Date(dto.reviewDate) : null;

    const assessment = await prisma.mentalCapacityAssessment.create({
      data: {
        tenantId,
        branchId: resident.branchId,
        residentId: dto.residentId,
        assessorId,
        carePlanId: dto.carePlanId ?? null,
        decisionType: dto.decisionType,
        specificDecision: dto.specificDecision,
        hasImpairmentOrDisturbance: dto.hasImpairmentOrDisturbance,
        impairmentDetails: dto.impairmentDetails,
        canUnderstandInfo: dto.canUnderstandInfo,
        canRetainInfo: dto.canRetainInfo,
        canWeighOrUseInfo: dto.canWeighOrUseInfo,
        canCommunicateDecision: dto.canCommunicateDecision,
        hasCapacity: dto.hasCapacity,
        bestInterestsRequired: dto.bestInterestsRequired ?? false,
        ...(dto.consultedPersons && dto.consultedPersons.length > 0
          ? { consultedPersons: toJsonValue(dto.consultedPersons) }
          : {}),
        leastRestrictiveOptionConsidered:
          dto.leastRestrictiveOptionConsidered ?? null,
        notes: dto.notes ?? null,
        assessedAt,
        reviewDate,
      },
      include: {
        assessor: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
        carePlan: { select: { id: true, versionNumber: true } },
      },
    });

    await this.auditService.emitConsent({
      tenantId,
      userId: assessorId,
      residentId: resident.id,
      actionType: 'CONSENT_REVIEWED',
      entityId: assessment.id,
      description: `Mental capacity assessed for ${resident.fullName}: ${dto.specificDecision} (${dto.hasCapacity ? 'Has Capacity' : 'Lacks Capacity - Best Interests'}).`,
      newValue: {
        assessmentId: assessment.id,
        decisionType: dto.decisionType,
        hasCapacity: dto.hasCapacity,
      },
    });

    return assessment;
  }

  async getAssessmentsByResident(residentId: string, tenantId: string) {
    return prisma.mentalCapacityAssessment.findMany({
      where: { residentId, tenantId },
      include: {
        assessor: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
        carePlan: { select: { id: true, versionNumber: true } },
      },
      orderBy: { assessedAt: 'desc' },
    });
  }

  async getAssessmentById(id: string, tenantId: string) {
    const assessment = await prisma.mentalCapacityAssessment.findFirst({
      where: { id, tenantId },
      include: {
        assessor: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
        carePlan: { select: { id: true, versionNumber: true } },
        resident: { select: { id: true, fullName: true, nhsNumber: true } },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Mental Capacity Assessment not found');
    }

    return assessment;
  }

  async updateAssessment(
    id: string,
    tenantId: string,
    userId: string,
    dto: UpdateMentalCapacityAssessmentDTO,
  ) {
    const existing = await prisma.mentalCapacityAssessment.findFirst({
      where: { id, tenantId },
      include: { resident: { select: { id: true, fullName: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Mental Capacity Assessment not found');
    }

    const updated = await prisma.mentalCapacityAssessment.update({
      where: { id },
      data: {
        ...(dto.decisionType && { decisionType: dto.decisionType }),
        ...(dto.specificDecision && { specificDecision: dto.specificDecision }),
        ...(dto.hasImpairmentOrDisturbance !== undefined && {
          hasImpairmentOrDisturbance: dto.hasImpairmentOrDisturbance,
        }),
        ...(dto.impairmentDetails && {
          impairmentDetails: dto.impairmentDetails,
        }),
        ...(dto.canUnderstandInfo !== undefined && {
          canUnderstandInfo: dto.canUnderstandInfo,
        }),
        ...(dto.canRetainInfo !== undefined && {
          canRetainInfo: dto.canRetainInfo,
        }),
        ...(dto.canWeighOrUseInfo !== undefined && {
          canWeighOrUseInfo: dto.canWeighOrUseInfo,
        }),
        ...(dto.canCommunicateDecision !== undefined && {
          canCommunicateDecision: dto.canCommunicateDecision,
        }),
        ...(dto.hasCapacity !== undefined && { hasCapacity: dto.hasCapacity }),
        ...(dto.bestInterestsRequired !== undefined && {
          bestInterestsRequired: dto.bestInterestsRequired,
        }),
        ...(dto.consultedPersons && {
          consultedPersons: toJsonValue(dto.consultedPersons),
        }),
        ...(dto.leastRestrictiveOptionConsidered !== undefined && {
          leastRestrictiveOptionConsidered:
            dto.leastRestrictiveOptionConsidered,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.reviewDate && { reviewDate: new Date(dto.reviewDate) }),
      },
      include: {
        assessor: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
        carePlan: { select: { id: true, versionNumber: true } },
      },
    });

    await this.auditService.emitConsent({
      tenantId,
      userId,
      residentId: existing.residentId,
      actionType: 'CONSENT_REVIEWED',
      entityId: updated.id,
      description: `Mental capacity assessment updated for ${existing.resident.fullName}: ${updated.specificDecision}.`,
    });

    return updated;
  }

  async createDols(
    tenantId: string,
    userId: string,
    dto: CreateDolsAuthorizationDTO,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId },
      select: { id: true, fullName: true, branchId: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const appliedDate = new Date(dto.appliedDate);
    const authorizedDate = dto.authorizedDate
      ? new Date(dto.authorizedDate)
      : null;
    const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;

    const dols = await prisma.dolsAuthorization.create({
      data: {
        tenantId,
        branchId: resident.branchId,
        residentId: dto.residentId,
        supervisoryBody: dto.supervisoryBody,
        referenceNumber: dto.referenceNumber ?? null,
        status: dto.status ?? 'UrgentApplied',
        appliedDate,
        authorizedDate,
        expiryDate,
        conditions: dto.conditions ?? [],
        relevantPersonsRepresentative:
          dto.relevantPersonsRepresentative ?? null,
        rprContact: dto.rprContact ?? null,
        notes: dto.notes ?? null,
      },
    });

    await this.auditService.emitConsent({
      tenantId,
      userId,
      residentId: resident.id,
      actionType: 'CONSENT_GRANTED',
      entityId: dols.id,
      description: `DoLS authorization logged for ${resident.fullName}: ${dto.supervisoryBody} (${dto.status}).`,
      newValue: {
        dolsId: dols.id,
        status: dto.status,
        expiryDate,
      },
    });

    return dols;
  }

  async getDolsByResident(residentId: string, tenantId: string) {
    return prisma.dolsAuthorization.findMany({
      where: { residentId, tenantId },
      orderBy: { appliedDate: 'desc' },
    });
  }

  async getDolsById(id: string, tenantId: string) {
    const dols = await prisma.dolsAuthorization.findFirst({
      where: { id, tenantId },
      include: {
        resident: { select: { id: true, fullName: true, nhsNumber: true } },
      },
    });

    if (!dols) {
      throw new NotFoundException('DoLS Authorization not found');
    }

    return dols;
  }

  async getExpiringDols(tenantId: string, daysAhead = 30) {
    const now = new Date();
    const futureDate = new Date(
      now.getTime() + daysAhead * 24 * 60 * 60 * 1000,
    );

    return prisma.dolsAuthorization.findMany({
      where: {
        tenantId,
        status: 'Authorized',
        expiryDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        resident: { select: { id: true, fullName: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async updateDols(
    id: string,
    tenantId: string,
    userId: string,
    dto: UpdateDolsAuthorizationDTO,
  ) {
    const existing = await prisma.dolsAuthorization.findFirst({
      where: { id, tenantId },
      include: { resident: { select: { id: true, fullName: true } } },
    });

    if (!existing) {
      throw new NotFoundException('DoLS Authorization not found');
    }

    const updated = await prisma.dolsAuthorization.update({
      where: { id },
      data: {
        ...(dto.supervisoryBody && { supervisoryBody: dto.supervisoryBody }),
        ...(dto.referenceNumber !== undefined && {
          referenceNumber: dto.referenceNumber,
        }),
        ...(dto.status && { status: dto.status }),
        ...(dto.appliedDate && { appliedDate: new Date(dto.appliedDate) }),
        ...(dto.authorizedDate !== undefined && {
          authorizedDate: dto.authorizedDate
            ? new Date(dto.authorizedDate)
            : null,
        }),
        ...(dto.expiryDate !== undefined && {
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        }),
        ...(dto.conditions && { conditions: dto.conditions }),
        ...(dto.relevantPersonsRepresentative !== undefined && {
          relevantPersonsRepresentative: dto.relevantPersonsRepresentative,
        }),
        ...(dto.rprContact !== undefined && { rprContact: dto.rprContact }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    await this.auditService.emitConsent({
      tenantId,
      userId,
      residentId: existing.residentId,
      actionType: 'CONSENT_REVIEWED',
      entityId: updated.id,
      description: `DoLS authorization updated for ${existing.resident.fullName}: Status is now ${updated.status}.`,
    });

    return updated;
  }
}
