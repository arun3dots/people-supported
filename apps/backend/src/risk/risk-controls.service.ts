import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, RiskControl } from '@repo/db';
import { toJsonValue } from '../common/utils/json.util';
import { AuditService } from '../audit/audit.service';
import { RiskAlertsService } from './risk-alerts.service';
import type {
  CreateRiskControlDTO,
  UpdateRiskControlDTO,
  CompleteRiskControlDTO,
} from '@repo/schema';
import type { ActorContext } from './risk.types';

@Injectable()
export class RiskControlsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly alertsService: RiskAlertsService,
  ) {}

  private async loadAssessmentScoped(assessmentId: string, tenantId: string) {
    const a = await prisma.riskAssessment.findFirst({
      where: { id: assessmentId, tenantId, deletedAt: null },
      select: { id: true, residentId: true, title: true },
    });
    if (!a) throw new NotFoundException('Risk assessment not found');
    return a;
  }

  private async loadControlScoped(
    id: string,
    tenantId: string,
  ): Promise<RiskControl> {
    const control = await prisma.riskControl.findFirst({
      where: {
        id,
        deletedAt: null,
        assessment: { tenantId },
      },
    });
    if (!control) throw new NotFoundException('Risk control not found');
    return control;
  }

  async create(
    assessmentId: string,
    dto: CreateRiskControlDTO,
    actor: ActorContext,
  ): Promise<RiskControl> {
    const assessment = await this.loadAssessmentScoped(
      assessmentId,
      actor.tenantId,
    );

    const created = await prisma.riskControl.create({
      data: {
        riskAssessmentId: assessment.id,
        description: dto.description,
        isExisting: dto.isExisting ?? false,
        assignedToId: dto.assignedToId ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes ?? null,
        createdById: actor.userId,
        updatedById: actor.userId,
      },
    });

    await this.auditService.emitClinicalDoc({
      actionType: 'RISK_CONTROL_CREATED',
      tenantId: actor.tenantId,
      userId: actor.userId,
      userEmail: actor.userEmail,
      userFullName: actor.userFullName,
      userRoleName: actor.roleName,
      entityType: 'RiskControl',
      entityId: created.id,
      entityLabel: created.description.slice(0, 80),
      newValue: toJsonValue(created) as Record<string, unknown>,
      metadata: { riskAssessmentId: assessmentId },
    });

    if (created.assignedToId) {
      await this.alertsService.dispatch({
        tenantId: actor.tenantId,
        recipientUserIds: [created.assignedToId],
        riskAssessmentId: assessmentId,
        type: 'ControlAssigned',
        subject: `Control assigned: ${assessment.title}`,
        message: `You have been assigned a new risk control: ${created.description}`,
      });
    }

    return created;
  }

  async update(
    id: string,
    dto: UpdateRiskControlDTO,
    actor: ActorContext,
  ): Promise<RiskControl> {
    const existing = await this.loadControlScoped(id, actor.tenantId);

    const previousAssignee = existing.assignedToId;

    const updated = await prisma.riskControl.update({
      where: { id },
      data: {
        description: dto.description ?? undefined,
        isExisting: dto.isExisting ?? undefined,
        assignedToId:
          dto.assignedToId === undefined
            ? undefined
            : (dto.assignedToId ?? null),
        dueDate:
          dto.dueDate === undefined
            ? undefined
            : dto.dueDate === null
              ? null
              : new Date(dto.dueDate),
        notes: dto.notes === undefined ? undefined : (dto.notes ?? null),
        status: dto.status ?? undefined,
        updatedById: actor.userId,
      },
    });

    await this.auditService.emitClinicalDoc({
      actionType: 'RISK_CONTROL_UPDATED',
      tenantId: actor.tenantId,
      userId: actor.userId,
      userEmail: actor.userEmail,
      userFullName: actor.userFullName,
      userRoleName: actor.roleName,
      entityType: 'RiskControl',
      entityId: id,
      entityLabel: updated.description.slice(0, 80),
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    if (updated.assignedToId && updated.assignedToId !== previousAssignee) {
      await this.alertsService.dispatch({
        tenantId: actor.tenantId,
        recipientUserIds: [updated.assignedToId],
        riskAssessmentId: updated.riskAssessmentId,
        type: 'ControlAssigned',
        subject: 'Risk control reassigned to you',
        message: `You have been assigned a risk control: ${updated.description}`,
      });
    }

    return updated;
  }

  async complete(
    id: string,
    dto: CompleteRiskControlDTO,
    actor: ActorContext,
  ): Promise<RiskControl> {
    const existing = await this.loadControlScoped(id, actor.tenantId);

    const updated = await prisma.riskControl.update({
      where: { id },
      data: {
        status: 'Completed',
        completedAt: new Date(),
        completedById: actor.userId,
        notes: dto.notes ?? existing.notes,
        updatedById: actor.userId,
      },
    });

    await this.auditService.emitClinicalDoc({
      actionType: 'RISK_CONTROL_COMPLETED',
      tenantId: actor.tenantId,
      userId: actor.userId,
      userEmail: actor.userEmail,
      userFullName: actor.userFullName,
      userRoleName: actor.roleName,
      entityType: 'RiskControl',
      entityId: id,
      entityLabel: updated.description.slice(0, 80),
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    return updated;
  }

  async delete(id: string, actor: ActorContext): Promise<{ success: true }> {
    const existing = await this.loadControlScoped(id, actor.tenantId);

    await prisma.riskControl.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actor.userId },
    });

    await this.auditService.emitClinicalDoc({
      actionType: 'RISK_CONTROL_UPDATED',
      tenantId: actor.tenantId,
      userId: actor.userId,
      userEmail: actor.userEmail,
      userFullName: actor.userFullName,
      userRoleName: actor.roleName,
      entityType: 'RiskControl',
      entityId: id,
      entityLabel: existing.description.slice(0, 80),
      metadata: { deleted: true },
    });

    return { success: true };
  }
}
