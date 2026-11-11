import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { toJsonValue } from '../common/utils/json.util';
import { AuditService } from '../audit/audit.service';
import { RiskAlertsService } from './risk-alerts.service';
import { RiskAssessmentSyncService } from './risk-assessment-sync.service';
import {
  calculateRiskScore,
  riskLevelFromScore,
  nextReviewDateFrom,
} from '@repo/schema';
import type {
  CreateRiskAssessmentDTO,
  UpdateRiskAssessmentDTO,
  TransitionRiskStatusDTO,
  RiskListFilters,
  RiskStatus,
  ReviewFrequency,
} from '@repo/schema';
import {
  type ActorContext,
  type RiskAssessmentWithRelations,
  ALLOWED_TRANSITIONS,
  HIGH_RISK_SCORE_THRESHOLD,
  RISK_RELATIONS_INCLUDE,
  actorAuditFields,
} from './risk.types';
import { resolveResidual } from './risk-score.helpers';

@Injectable()
export class RiskService {
  constructor(
    private readonly auditService: AuditService,
    private readonly alertsService: RiskAlertsService,
    private readonly syncService: RiskAssessmentSyncService,
  ) {}

  async findAll(
    tenantId: string,
    filters: RiskListFilters,
  ): Promise<RiskAssessmentWithRelations[]> {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.residentId) where.residentId = filters.residentId;
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.level) {
      where.OR = [
        { residualLevel: filters.level },
        { residualLevel: null, inherentLevel: filters.level },
      ];
    }
    if (filters.dueWithinDays !== undefined) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + filters.dueWithinDays);
      where.nextReviewDate = { lte: cutoff };
      where.status = where.status ?? 'Active';
    }
    return prisma.riskAssessment.findMany({
      where,
      include: RISK_RELATIONS_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    }) as Promise<RiskAssessmentWithRelations[]>;
  }

  async findOne(
    id: string,
    tenantId: string,
    actor?: ActorContext,
  ): Promise<RiskAssessmentWithRelations> {
    const a = await prisma.riskAssessment.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: RISK_RELATIONS_INCLUDE,
    });
    if (!a) throw new NotFoundException('Risk assessment not found');

    if (actor) {
      void this.auditService.emitClinicalDoc({
        ...actorAuditFields(actor),
        actionType: 'RISK_ASSESSMENT_VIEWED',
        entityType: 'RiskAssessment',
        entityId: id,
        entityLabel: a.title,
      });
    }

    return a as RiskAssessmentWithRelations;
  }

  async create(
    dto: CreateRiskAssessmentDTO,
    actor: ActorContext,
  ): Promise<RiskAssessmentWithRelations> {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId: actor.tenantId },
      select: { id: true, fullName: true, branchId: true, status: true },
    });
    if (!resident) throw new NotFoundException('Resident not found');
    if (resident.status === 'Discharged') {
      throw new BadRequestException(
        'Risk assessments cannot be created for discharged residents',
      );
    }

    const inherentScore = calculateRiskScore(dto.likelihood, dto.severity);
    const inherentLevel = riskLevelFromScore(inherentScore);
    const reviewFrequency: ReviewFrequency = dto.reviewFrequency ?? 'Quarterly';
    const nextReviewDate = nextReviewDateFrom(new Date(), reviewFrequency);
    const status: RiskStatus = dto.status ?? 'Active';

    const created = await prisma.riskAssessment.create({
      data: {
        tenantId: actor.tenantId,
        branchId: resident.branchId,
        residentId: dto.residentId,
        templateId: dto.templateId ?? null,
        category: dto.category,
        title: dto.title,
        hazardDescription: dto.hazardDescription,
        tool: dto.tool ?? null,
        likelihood: dto.likelihood,
        severity: dto.severity,
        inherentScore,
        inherentLevel,
        status,
        approvedById: status === 'Active' ? actor.userId : null,
        approvedAt: status === 'Active' ? new Date() : null,
        reviewFrequency,
        nextReviewDate,
        factors: dto.factors ? toJsonValue(dto.factors) : undefined,
        createdById: actor.userId,
        updatedById: actor.userId,
        controls: dto.controls?.length
          ? {
              create: dto.controls.map((c) => ({
                description: c.description,
                isExisting: c.isExisting ?? false,
                assignedToId: c.assignedToId ?? null,
                dueDate: c.dueDate ? new Date(c.dueDate) : null,
                notes: c.notes ?? null,
                createdById: actor.userId,
                updatedById: actor.userId,
              })),
            }
          : undefined,
      },
      include: RISK_RELATIONS_INCLUDE,
    });

    await this.auditService.emitClinicalDoc({
      ...actorAuditFields(actor),
      actionType: 'RISK_ASSESSMENT_CREATED',
      entityType: 'RiskAssessment',
      entityId: created.id,
      entityLabel: `${resident.fullName} — ${created.title}`,
      newValue: toJsonValue(created) as Record<string, unknown>,
    });

    await prisma.careTimeline.create({
      data: {
        residentId: dto.residentId,
        eventType: 'RISK_ASSESSMENT_CREATED',
        summary: `Risk assessment created: ${created.title} (${inherentLevel}, score ${inherentScore})`,
        carerId: actor.userId,
        createdById: actor.userId,
        updatedById: actor.userId,
      },
    });

    if (inherentLevel === 'Extreme') {
      void this.alertsService.dispatchCriticalMentalHealthAlert?.({
        tenantId: actor.tenantId,
        branchId: resident.branchId,
        residentId: dto.residentId,
        residentName: resident.fullName,
        riskAssessmentId: created.id,
        title: created.title,
        category: created.category,
        hazardDescription: created.hazardDescription,
        score: inherentScore,
      });
    }

    if (inherentScore >= HIGH_RISK_SCORE_THRESHOLD) {
      const approvers = await this.alertsService.findApproversForTenant(
        actor.tenantId,
      );
      await this.alertsService.dispatch({
        tenantId: actor.tenantId,
        recipientUserIds: approvers,
        riskAssessmentId: created.id,
        type: 'HighRiskCreated',
        subject: `HIGH RISK: ${created.title} (${inherentLevel}, score ${inherentScore})`,
        message: `${actor.userFullName} identified a high-risk factor for ${resident.fullName}: "${created.hazardDescription}"`,
      });
    }

    await this.syncService.syncRiskAssessment(created, actor);
    return created as RiskAssessmentWithRelations;
  }

  async update(
    id: string,
    dto: UpdateRiskAssessmentDTO,
    actor: ActorContext,
  ): Promise<RiskAssessmentWithRelations> {
    const existing = await this.findOne(id, actor.tenantId);

    const likelihood = dto.likelihood ?? existing.likelihood;
    const severity = dto.severity ?? existing.severity;
    const inherentScore = calculateRiskScore(likelihood, severity);
    const inherentLevel = riskLevelFromScore(inherentScore);

    const { residualScore, residualLevel } = resolveResidual(dto, existing);
    const reviewFrequency = dto.reviewFrequency ?? existing.reviewFrequency;
    const nextReviewDate =
      dto.reviewFrequency && dto.reviewFrequency !== existing.reviewFrequency
        ? nextReviewDateFrom(new Date(), reviewFrequency as ReviewFrequency)
        : existing.nextReviewDate;

    const status = dto.status ?? existing.status;
    const isActivating = status === 'Active' && existing.status !== 'Active';

    const updated = await prisma.riskAssessment.update({
      where: { id },
      data: {
        category: dto.category ?? undefined,
        title: dto.title ?? undefined,
        hazardDescription: dto.hazardDescription ?? undefined,
        tool: dto.tool === undefined ? undefined : dto.tool,
        likelihood,
        severity,
        inherentScore,
        inherentLevel,
        residualLikelihood:
          dto.residualLikelihood === undefined
            ? undefined
            : (dto.residualLikelihood ?? null),
        residualSeverity:
          dto.residualSeverity === undefined
            ? undefined
            : (dto.residualSeverity ?? null),
        residualScore,
        residualLevel,
        status: dto.status ?? undefined,
        approvedById: isActivating ? actor.userId : undefined,
        approvedAt: isActivating ? new Date() : undefined,
        reviewFrequency,
        nextReviewDate,
        factors:
          dto.factors === undefined ? undefined : toJsonValue(dto.factors),
        updatedById: actor.userId,
      },
      include: RISK_RELATIONS_INCLUDE,
    });

    const effectiveLevel = residualLevel ?? inherentLevel;
    await this.auditService.emitClinicalDoc({
      ...actorAuditFields(actor),
      actionType: 'RISK_ASSESSMENT_UPDATED',
      entityType: 'RiskAssessment',
      entityId: id,
      entityLabel: updated.title,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    await prisma.careTimeline.create({
      data: {
        residentId: existing.residentId,
        eventType: 'RISK_ASSESSMENT_UPDATED',
        summary: `Risk assessment updated: ${updated.title} (${effectiveLevel}, score ${residualScore ?? inherentScore})`,
        carerId: actor.userId,
        createdById: actor.userId,
        updatedById: actor.userId,
      },
    });

    if (effectiveLevel === 'Extreme') {
      void this.alertsService.dispatchCriticalMentalHealthAlert?.({
        tenantId: actor.tenantId,
        branchId: updated.branchId,
        residentId: updated.residentId,
        residentName: updated.resident?.fullName || 'Resident',
        riskAssessmentId: updated.id,
        title: updated.title,
        category: updated.category,
        hazardDescription: updated.hazardDescription,
        score: residualScore ?? inherentScore,
      });
    }

    await this.syncService.syncRiskAssessment(updated, actor);
    return updated as RiskAssessmentWithRelations;
  }

  async transitionStatus(
    id: string,
    dto: TransitionRiskStatusDTO,
    actor: ActorContext,
  ): Promise<RiskAssessmentWithRelations> {
    const existing = await this.findOne(id, actor.tenantId);
    const target = dto.status;

    const allowed = ALLOWED_TRANSITIONS[existing.status as RiskStatus] ?? [];
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Invalid transition: ${existing.status} → ${target}`,
      );
    }

    if (target === 'Active' && !actor.canApprove) {
      throw new ForbiddenException(
        'You do not have permission to approve risk assessments.',
      );
    }

    const data: Record<string, unknown> = {
      status: target,
      updatedById: actor.userId,
    };
    if (target === 'Active') {
      data.approvedById = actor.userId;
      data.approvedAt = new Date();
    }
    if (target === 'PendingReview') {
      data.reviewedById = actor.userId;
      data.reviewedAt = new Date();
    }

    const updated = await prisma.riskAssessment.update({
      where: { id },
      data,
      include: RISK_RELATIONS_INCLUDE,
    });

    await this.auditService.emitClinicalDoc({
      ...actorAuditFields(actor),
      actionType:
        target === 'Active'
          ? 'RISK_ASSESSMENT_APPROVED'
          : 'RISK_ASSESSMENT_TRANSITIONED',
      entityType: 'RiskAssessment',
      entityId: id,
      entityLabel: updated.title,
      oldValue: { status: existing.status },
      newValue: { status: target },
      metadata: dto.comment ? { comment: dto.comment } : undefined,
    });

    await this.alertsService.handleTransitionAlerts(
      target,
      id,
      updated.title,
      existing,
      actor,
    );
    await this.syncService.syncRiskAssessment(updated, actor);

    return updated as RiskAssessmentWithRelations;
  }

  async delete(id: string, actor: ActorContext): Promise<{ success: true }> {
    const existing = await this.findOne(id, actor.tenantId);

    await prisma.riskAssessment.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actor.userId },
    });

    await this.auditService.emitClinicalDoc({
      ...actorAuditFields(actor),
      actionType: 'RISK_ASSESSMENT_DELETED',
      entityType: 'RiskAssessment',
      entityId: id,
      entityLabel: existing.title,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
    });

    await this.syncService.handleDelete(existing, actor);
    return { success: true };
  }
}
