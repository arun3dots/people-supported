import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, RiskTemplate } from '@repo/db';
import { toJsonValue } from '../common/utils/json.util';
import { AuditService } from '../audit/audit.service';
import type {
  CreateRiskTemplateDTO,
  UpdateRiskTemplateDTO,
} from '@repo/schema';

@Injectable()
export class RiskTemplatesService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Returns all templates available to the tenant — system templates
   * (tenantId = null) plus the tenant's own custom templates.
   */
  async findAll(tenantId: string): Promise<RiskTemplate[]> {
    return prisma.riskTemplate.findMany({
      where: {
        deletedAt: null,
        OR: [{ tenantId: null }, { tenantId }],
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string, tenantId: string): Promise<RiskTemplate> {
    const template = await prisma.riskTemplate.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ tenantId: null }, { tenantId }],
      },
    });
    if (!template) throw new NotFoundException('Risk template not found');
    return template;
  }

  async create(
    dto: CreateRiskTemplateDTO,
    tenantId: string,
    userId: string,
    userEmail: string,
    userFullName: string,
    roleName: string,
  ): Promise<RiskTemplate> {
    const created = await prisma.riskTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category,
        hazardDescription: dto.hazardDescription,
        tool: dto.tool ?? null,
        defaultLikelihood: dto.defaultLikelihood,
        defaultSeverity: dto.defaultSeverity,
        defaultControls: toJsonValue(dto.defaultControls ?? []),
        isActive: dto.isActive ?? true,
        isSystem: false,
        createdById: userId,
        updatedById: userId,
      },
    });

    await this.auditService.emitClinicalDoc({
      actionType: 'RISK_TEMPLATE_CREATED',
      tenantId,
      userId,
      userEmail,
      userFullName,
      userRoleName: roleName,
      entityType: 'RiskTemplate',
      entityId: created.id,
      entityLabel: created.name,
      newValue: toJsonValue(created) as Record<string, unknown>,
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateRiskTemplateDTO,
    tenantId: string,
    userId: string,
    userEmail: string,
    userFullName: string,
    roleName: string,
  ): Promise<RiskTemplate> {
    const existing = await this.findOne(id, tenantId);
    if (existing.isSystem) {
      throw new ForbiddenException(
        'System templates cannot be edited. Duplicate it to a tenant template first.',
      );
    }

    const updated = await prisma.riskTemplate.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        category: dto.category ?? undefined,
        hazardDescription: dto.hazardDescription ?? undefined,
        tool: dto.tool === undefined ? undefined : dto.tool,
        defaultLikelihood: dto.defaultLikelihood ?? undefined,
        defaultSeverity: dto.defaultSeverity ?? undefined,
        defaultControls:
          dto.defaultControls !== undefined
            ? toJsonValue(dto.defaultControls)
            : undefined,
        isActive: dto.isActive ?? undefined,
        updatedById: userId,
      },
    });

    await this.auditService.emitClinicalDoc({
      actionType: 'RISK_TEMPLATE_UPDATED',
      tenantId,
      userId,
      userEmail,
      userFullName,
      userRoleName: roleName,
      entityType: 'RiskTemplate',
      entityId: updated.id,
      entityLabel: updated.name,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    return updated;
  }

  async delete(
    id: string,
    tenantId: string,
    userId: string,
    userEmail: string,
    userFullName: string,
    roleName: string,
  ): Promise<{ success: true }> {
    const existing = await this.findOne(id, tenantId);
    if (existing.isSystem) {
      throw new ForbiddenException('System templates cannot be deleted.');
    }

    await prisma.riskTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: userId },
    });

    await this.auditService.emitClinicalDoc({
      actionType: 'RISK_TEMPLATE_DELETED',
      tenantId,
      userId,
      userEmail,
      userFullName,
      userRoleName: roleName,
      entityType: 'RiskTemplate',
      entityId: id,
      entityLabel: existing.name,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
    });

    return { success: true };
  }
}
