import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  prisma,
  Prisma,
  type PrismaTransactionClient,
  type ResidentAssessment,
  type ResidentNeedCarePlan,
} from '@repo/db';
import {
  CARE_AREAS,
  getCareArea,
  type AssessmentNeedDTO,
  type AssessmentToolResultDTO,
  type CreateNeedCarePlanDTO,
  type NeedCarePlanAgreementDTO,
  type NeedCarePlanContentDTO,
  type NeedCarePlanRecordDTO,
  type SaveNeedCarePlanDTO,
} from '@repo/schema';
import { AuditService } from '../../audit/audit.service';
import type { ClinicalDocAction } from '../../audit/audit.types';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';
import { ResidentAccessService } from '../services/resident-access.service';
import {
  draftPlanContent,
  riskForNeed,
  toNeedCarePlanDTO,
} from './care-journey.mapper';
import {
  DEFAULT_REVIEW_DAYS,
  addDays,
  assertCarePlanDraft,
  emitCareAudit,
  parseOptionalDate,
  requireTenant,
  syncDraftAssessmentNeed,
} from './care-task.util';

const json = (v: unknown): Prisma.InputJsonValue | undefined =>
  v === null || v === undefined ? undefined : (v as Prisma.InputJsonValue);

const areaOrder = (areaKey: string): number =>
  CARE_AREAS.findIndex((a) => a.key === areaKey);

@Injectable()
export class NeedCarePlanService {
  constructor(
    private readonly access: ResidentAccessService,
    private readonly auditService: AuditService,
  ) {}

  private audit(
    user: AuthenticatedUser,
    actionType: ClinicalDocAction,
    row: Pick<
      ResidentNeedCarePlan,
      'id' | 'residentId' | 'areaKey' | 'versionNumber'
    >,
  ): void {
    emitCareAudit(
      this.auditService,
      user,
      actionType,
      row.residentId,
      row.id,
      'ResidentNeedCarePlan',
      {
        areaKey: row.areaKey,
        versionNumber: row.versionNumber,
      },
    );
  }

  private async currentPlan(
    tx: PrismaTransactionClient,
    residentId: string,
    planId: string,
    tenantId: string,
  ): Promise<ResidentNeedCarePlan> {
    const row = await tx.residentNeedCarePlan.findFirst({
      where: { id: planId, residentId, tenantId, isCurrent: true },
    });
    if (!row) throw new NotFoundException('Care plan not found');
    return row as ResidentNeedCarePlan;
  }

  private async toPlanDTO(
    row: ResidentNeedCarePlan,
  ): Promise<NeedCarePlanRecordDTO> {
    const taskCount = await prisma.residentCareTask.count({
      where: { carePlanId: row.id },
    });
    return toNeedCarePlanDTO(row, taskCount);
  }

  async list(
    residentId: string,
    user: AuthenticatedUser,
  ): Promise<NeedCarePlanRecordDTO[]> {
    await this.access.assertCanAccessResident(user, residentId);
    const tenantId = requireTenant(user);
    const [rows, counts] = await Promise.all([
      prisma.residentNeedCarePlan.findMany({
        where: { residentId, tenantId, isCurrent: true },
      }),
      prisma.residentCareTask.groupBy({
        by: ['carePlanId'],
        where: { residentId, tenantId },
        _count: { _all: true },
      }),
    ]);
    const countByPlan = new Map(
      counts.map((c) => [c.carePlanId, c._count._all]),
    );
    return (rows as ResidentNeedCarePlan[])
      .sort((a, b) => areaOrder(a.areaKey) - areaOrder(b.areaKey))
      .map((r) => toNeedCarePlanDTO(r, countByPlan.get(r.id) ?? 0));
  }

  /** Creates (or updates the current draft of) a care plan for one area of need. */
  async create(
    residentId: string,
    dto: CreateNeedCarePlanDTO,
    user: AuthenticatedUser,
  ): Promise<NeedCarePlanRecordDTO> {
    const resident = await this.access.assertCanAccessResident(
      user,
      residentId,
    );
    const tenantId = requireTenant(user);
    if (!resident.branchId)
      throw new BadRequestException('Resident has no branch');
    const areaMeta = getCareArea(dto.areaKey);
    if (!areaMeta && !dto.area) {
      throw new BadRequestException('Custom care plans require an area name');
    }
    const reviewDate =
      parseOptionalDate(dto.reviewDate) ??
      addDays(new Date(), DEFAULT_REVIEW_DAYS);
    const areaTitle = dto.area?.trim() || areaMeta?.label;
    if (!areaTitle) throw new BadRequestException('Care plan area is required');

    const row = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const assessmentId = await syncDraftAssessmentNeed(
          tx,
          residentId,
          tenantId,
          dto,
          user.userId,
        );
        const existing = await tx.residentNeedCarePlan.findMany({
          where: { residentId, tenantId, areaKey: dto.areaKey },
          select: {
            id: true,
            status: true,
            agreedAt: true,
            versionNumber: true,
            isCurrent: true,
          },
        });
        const current = existing.find((p) => p.isCurrent);
        if (current) assertCarePlanDraft(current);
        if (current) {
          return tx.residentNeedCarePlan.update({
            where: { id: current.id },
            data: {
              area: areaTitle,
              supportLevel: dto.supportLevel ?? null,
              content: json(dto.content),
              ...(dto.risk !== undefined
                ? { risk: json(dto.risk) ?? Prisma.JsonNull }
                : {}),
              reviewDate,
              updatedById: user.userId,
            },
          });
        }
        const created = await tx.residentNeedCarePlan.create({
          data: {
            tenantId,
            branchId: resident.branchId!,
            residentId,
            assessmentId,
            areaKey: dto.areaKey,
            area: areaTitle,
            supportLevel: dto.supportLevel ?? null,
            risk: json(dto.risk ?? null),
            content: json(dto.content),
            status: 'Draft',
            versionNumber:
              Math.max(0, ...existing.map((p) => p.versionNumber)) + 1,
            isCurrent: true,
            reviewDate,
            createdById: user.userId,
            updatedById: user.userId,
          },
        });
        return created;
      },
    );

    this.audit(user, 'NEED_CARE_PLAN_UPDATED', row as ResidentNeedCarePlan);
    return this.toPlanDTO(row as ResidentNeedCarePlan);
  }

  /** Called inside the assessment-completion transaction. */
  async generateFromAssessment(
    tx: PrismaTransactionClient,
    assessment: ResidentAssessment,
    user: AuthenticatedUser,
  ): Promise<void> {
    const needs = ((assessment.needs ?? []) as AssessmentNeedDTO[]).filter(
      (n) => n.becomesCarePlan,
    );
    const tools = (assessment.tools ?? []) as AssessmentToolResultDTO[];
    const existing = await tx.residentNeedCarePlan.findMany({
      where: {
        residentId: assessment.residentId,
        tenantId: assessment.tenantId,
      },
      select: {
        id: true,
        areaKey: true,
        status: true,
        versionNumber: true,
        isCurrent: true,
      },
    });

    for (const need of needs) {
      const area = getCareArea(need.areaKey);
      const areaLabel = area?.label ?? need.customAreaLabel;
      if (!areaLabel) continue;
      const risk = riskForNeed(need, tools);
      const forArea = existing.filter((p) => p.areaKey === need.areaKey);
      const current = forArea.find((p) => p.isCurrent);

      if (current) {
        await tx.residentNeedCarePlan.update({
          where: { id: current.id },
          data: {
            assessmentId: assessment.id,
            risk: json(risk) ?? Prisma.JsonNull,
            ...(current.status === 'Draft'
              ? { supportLevel: need.supportLevel ?? null }
              : {}),
            updatedById: user.userId,
          },
        });
        continue;
      }

      await tx.residentNeedCarePlan.create({
        data: {
          tenantId: assessment.tenantId,
          branchId: assessment.branchId,
          residentId: assessment.residentId,
          assessmentId: assessment.id,
          areaKey: need.areaKey,
          area: areaLabel,
          supportLevel: need.supportLevel ?? null,
          risk: json(risk),
          content: json(draftPlanContent(need)),
          status: 'Draft',
          versionNumber:
            Math.max(0, ...forArea.map((p) => p.versionNumber)) + 1,
          isCurrent: true,
          reviewDate: addDays(new Date(), DEFAULT_REVIEW_DAYS),
          createdById: user.userId,
          updatedById: user.userId,
        },
      });
    }
  }

  async save(
    residentId: string,
    planId: string,
    dto: SaveNeedCarePlanDTO,
    user: AuthenticatedUser,
  ): Promise<NeedCarePlanRecordDTO> {
    await this.access.assertCanAccessResident(user, residentId);
    const tenantId = requireTenant(user);
    const reviewDate = parseOptionalDate(dto.reviewDate);

    const row = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const current = await this.currentPlan(
          tx,
          residentId,
          planId,
          tenantId,
        );
        const data = {
          ...(dto.area?.trim() ? { area: dto.area.trim() } : {}),
          supportLevel: dto.supportLevel ?? null,
          content: json(dto.content),
          ...(dto.risk !== undefined
            ? { risk: json(dto.risk) ?? Prisma.JsonNull }
            : {}),
          reviewDate,
          updatedById: user.userId,
        };
        assertCarePlanDraft(current);
        return tx.residentNeedCarePlan.update({
          where: { id: current.id },
          data,
        });
      },
    );
    this.audit(user, 'NEED_CARE_PLAN_UPDATED', row as ResidentNeedCarePlan);
    return this.toPlanDTO(row as ResidentNeedCarePlan);
  }

  async agree(
    residentId: string,
    planId: string,
    dto: NeedCarePlanAgreementDTO,
    user: AuthenticatedUser,
  ): Promise<NeedCarePlanRecordDTO> {
    await this.access.assertCanAccessResident(user, residentId);
    const tenantId = requireTenant(user);
    const current = await this.currentPlan(
      prisma,
      residentId,
      planId,
      tenantId,
    );
    if (current.status !== 'Draft') {
      throw new ConflictException(
        'This plan has no changes waiting for agreement',
      );
    }
    const content = (current.content ?? {}) as Partial<NeedCarePlanContentDTO>;
    if (!content.outcome?.trim() || !(content.steps?.length ?? 0)) {
      throw new BadRequestException(
        'Add the outcome and at least one support step before recording agreement',
      );
    }

    const agreedAt = new Date();
    const row = await prisma.residentNeedCarePlan.update({
      where: { id: current.id },
      data: {
        status: 'Agreed',
        agreement: json({ ...dto, agreedAt: agreedAt.toISOString() }),
        agreedAt,
        agreedById: user.userId,
        updatedById: user.userId,
      },
    });
    this.audit(user, 'NEED_CARE_PLAN_AGREED', row as ResidentNeedCarePlan);
    return this.toPlanDTO(row as ResidentNeedCarePlan);
  }
}
