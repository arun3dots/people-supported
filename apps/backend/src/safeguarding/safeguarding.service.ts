import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, SafeguardingReferral } from '@repo/db';
import {
  CreateSafeguardingReferralDTO,
  UpdateSafeguardingReferralDTO,
} from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class SafeguardingService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * C-08 & G-06: Safeguarding Referrals Register (CQC Reg 13 & Care Act 2014 s.42).
   */
  async createReferral(
    dto: CreateSafeguardingReferralDTO,
    userId: string,
    tenantId: string,
  ): Promise<SafeguardingReferral> {
    if (dto.residentId) {
      const resident = await prisma.resident.findFirst({
        where: { id: dto.residentId, tenantId, deletedAt: null },
      });
      if (!resident) {
        throw new NotFoundException('Resident not found');
      }
    }

    const count = await prisma.safeguardingReferral.count({
      where: { tenantId },
    });
    const year = new Date().getFullYear();
    const referralNumber = `SG-${year}-${String(count + 1).padStart(4, '0')}`;

    const referral = await prisma.safeguardingReferral.create({
      data: {
        tenantId,
        branchId: dto.branchId ?? null,
        residentId: dto.residentId ?? null,
        linkedIncidentId: dto.linkedIncidentId ?? null,
        referralNumber,
        abuseCategory: dto.abuseCategory,
        allegationSummary: dto.allegationSummary,
        immediateProtectionPlan: dto.immediateProtectionPlan,
        localAuthorityName: dto.localAuthorityName,
        section42Referred: dto.section42Referred,
        section42ReferredAt: dto.section42Referred ? new Date() : null,
        section42ReferenceNo: dto.section42ReferenceNo ?? null,
        cqcNotified: dto.cqcNotified,
        cqcNotifiedAt: dto.cqcNotified ? new Date() : null,
        cqcReferenceNo: dto.cqcReferenceNo ?? null,
        policeNotified: dto.policeNotified,
        policeCrimeReference: dto.policeCrimeReference ?? null,
        familyInformed: dto.familyInformed,
        familyInformedAt: dto.familyInformed ? new Date() : null,
        status: 'Open',
        raisedById: userId,
      },
    });

    if (dto.residentId) {
      await prisma.careTimeline.create({
        data: {
          residentId: dto.residentId,
          eventType: 'SAFEGUARDING_REFERRAL',
          summary: `Safeguarding Referral raised (${referralNumber}): ${dto.abuseCategory} abuse reported to ${dto.localAuthorityName}. Immediate protection plan active.`,
          carerId: userId,
          createdById: userId,
          updatedById: userId,
        },
      });
    }

    void this.auditService.emit({
      categoryType: 'SAFEGUARDING',
      actionType: 'REFERRAL_MADE',
      entityType: 'SafeguardingReferral',
      entityId: referral.id,
      tenantId,
      userId,
      newValue: toJsonValue(referral) as Record<string, unknown>,
    });

    return referral;
  }

  async listReferrals(
    tenantId: string,
    status?: string,
  ): Promise<SafeguardingReferral[]> {
    return prisma.safeguardingReferral.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      include: {
        resident: { select: { id: true, fullName: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReferral(
    id: string,
    tenantId: string,
  ): Promise<SafeguardingReferral> {
    const referral = await prisma.safeguardingReferral.findFirst({
      where: { id, tenantId },
      include: {
        resident: { select: { id: true, fullName: true, status: true } },
      },
    });
    if (!referral) {
      throw new NotFoundException('Safeguarding referral not found');
    }
    return referral;
  }

  async updateReferral(
    id: string,
    dto: UpdateSafeguardingReferralDTO,
    userId: string,
    tenantId: string,
  ): Promise<SafeguardingReferral> {
    const existing = await prisma.safeguardingReferral.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Safeguarding referral not found');
    }

    const updated = await prisma.safeguardingReferral.update({
      where: { id },
      data: {
        ...dto,
        section42ReferredAt:
          dto.section42Referred && !existing.section42ReferredAt
            ? new Date()
            : existing.section42ReferredAt,
        cqcNotifiedAt:
          dto.cqcNotified && !existing.cqcNotifiedAt
            ? new Date()
            : existing.cqcNotifiedAt,
        familyInformedAt:
          dto.familyInformed && !existing.familyInformedAt
            ? new Date()
            : existing.familyInformedAt,
        closedAt: dto.status === 'Closed' ? new Date() : existing.closedAt,
        closedById: dto.status === 'Closed' ? userId : existing.closedById,
      },
    });

    void this.auditService.emit({
      categoryType: 'SAFEGUARDING',
      actionType: 'INCIDENT_REVIEWED',
      entityType: 'SafeguardingReferral',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    return updated;
  }
}
