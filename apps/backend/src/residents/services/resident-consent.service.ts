import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, ResidentConsentItem } from '@repo/db';
import {
  CreateResidentConsentItemDTO,
  WithdrawResidentConsentItemDTO,
} from '@repo/schema';
import { AuditService } from '../../audit/audit.service';
import { toJsonValue } from '../../common/utils/json.util';

@Injectable()
export class ResidentConsentService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * B-03: Granular Per-Purpose Consent Tracking (UK GDPR Art 6/7/9, MCA 2005 & CQC Reg 11).
   */
  async createConsentItem(
    dto: CreateResidentConsentItemDTO,
    userId: string,
    tenantId: string,
  ): Promise<ResidentConsentItem> {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId, deletedAt: null },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    if (resident.recordState && resident.recordState !== 'Active') {
      throw new BadRequestException(
        `Consent cannot be recorded when resident record state is "${resident.recordState}"`,
      );
    }

    const consentItem = await prisma.residentConsentItem.create({
      data: {
        tenantId,
        residentId: dto.residentId,
        purpose: dto.purpose,
        lawfulBasis: dto.lawfulBasis,
        specialCategoryBasis: dto.specialCategoryBasis,
        capacityStatus: dto.capacityStatus,
        isGranted: dto.isGranted,
        signedByName: dto.signedByName,
        signedByRelationship: dto.signedByRelationship,
        evidenceUrl: dto.evidenceUrl ?? null,
        reviewDueAt: dto.reviewDueAt ? new Date(dto.reviewDueAt) : null,
        notes: dto.notes ?? null,
        createdById: userId,
      },
    });

    await prisma.careTimeline.create({
      data: {
        residentId: dto.residentId,
        eventType: 'CONSENT_RECORDED',
        summary: `Granular Consent recorded: ${dto.purpose} (${dto.isGranted ? 'Granted' : 'Refused'}). Signatory: ${dto.signedByName} (${dto.signedByRelationship}). Capacity: ${dto.capacityStatus}`,
        carerId: userId,
        createdById: userId,
        updatedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'CONSENT',
      actionType: 'CARE_NOTE_CREATED',
      entityType: 'ResidentConsentItem',
      entityId: consentItem.id,
      tenantId,
      userId,
      newValue: toJsonValue(consentItem) as Record<string, unknown>,
    });

    return consentItem;
  }

  async listConsentItems(
    residentId: string,
    tenantId: string,
  ): Promise<ResidentConsentItem[]> {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    return prisma.residentConsentItem.findMany({
      where: { tenantId, residentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async withdrawConsentItem(
    consentItemId: string,
    dto: WithdrawResidentConsentItemDTO,
    userId: string,
    tenantId: string,
  ): Promise<ResidentConsentItem> {
    const existing = await prisma.residentConsentItem.findFirst({
      where: { id: consentItemId, tenantId },
      include: { resident: true },
    });
    if (!existing) {
      throw new NotFoundException('Consent item not found');
    }
    if (!existing.isGranted) {
      throw new BadRequestException('This consent item is already not granted');
    }
    if (existing.withdrawnAt) {
      throw new BadRequestException(
        'This consent item has already been withdrawn',
      );
    }

    const updated = await prisma.residentConsentItem.update({
      where: { id: consentItemId },
      data: {
        isGranted: false,
        withdrawnAt: new Date(),
        withdrawalReason: dto.withdrawalReason,
        withdrawnById: userId,
      },
    });

    await prisma.careTimeline.create({
      data: {
        residentId: existing.residentId,
        eventType: 'CONSENT_WITHDRAWN',
        summary: `Consent withdrawn for ${existing.purpose}. Reason: ${dto.withdrawalReason}`,
        carerId: userId,
        createdById: userId,
        updatedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'CONSENT',
      actionType: 'CARE_NOTE_AMENDED',
      entityType: 'ResidentConsentItem',
      entityId: consentItemId,
      tenantId,
      userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    return updated;
  }
}
