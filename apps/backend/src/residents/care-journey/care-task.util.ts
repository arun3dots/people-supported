import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type PrismaTransactionClient,
  type ResidentCareTask,
  type ResidentNeedCarePlan,
} from '@repo/db';
import {
  AssessmentNeedSchema,
  getCareArea,
  shiftForTime,
  type AssessmentNeedDTO,
  type CareTaskRecurrenceDTO,
  type CreateNeedCarePlanDTO,
} from '@repo/schema';
import type { AuditService } from '../../audit/audit.service';
import type { ClinicalDocAction } from '../../audit/audit.types';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';

export type TaskWithPlan = ResidentCareTask & {
  carePlan: ResidentNeedCarePlan;
};

export const DEFAULT_REVIEW_DAYS = 28;

export function assertCarePlanDraft(
  plan: Pick<ResidentNeedCarePlan, 'status' | 'agreedAt'>,
): void {
  if (plan.status !== 'Draft' || plan.agreedAt !== null) {
    throw new ConflictException(
      'Agreed care plans are read-only; create a formal amendment to make changes',
    );
  }
}

export const addDays = (d: Date, days: number): Date =>
  new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

export const parseOptionalDate = (
  raw: string | null | undefined,
): Date | null => {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Review date is not a valid date');
  }
  return parsed;
};

export const asDate = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

// Care homes record against the local calendar day, not UTC.
export const todayLocal = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(
    new Date(),
  );

export const runsOn = (
  rec: CareTaskRecurrenceDTO | null,
  date: string,
): boolean => {
  if (!rec || rec.type === 'daily') return true;
  return rec.days.includes(asDate(date).getUTCDay());
};

export function requireTenant(user: AuthenticatedUser): string {
  if (!user.tenantId) throw new BadRequestException('Tenant context required');
  return user.tenantId;
}

export async function findTaskOrThrow(
  tx: PrismaTransactionClient,
  residentId: string,
  taskId: string,
  tenantId: string,
): Promise<TaskWithPlan> {
  const task = await tx.residentCareTask.findFirst({
    where: { id: taskId, residentId, tenantId },
    include: { carePlan: true },
  });
  if (!task) throw new NotFoundException('Task not found');
  return task as TaskWithPlan;
}

/** Outcomes and ids only; free-text notes are never written to the audit log. */
export function emitCareAudit(
  auditService: AuditService,
  user: AuthenticatedUser,
  actionType: ClinicalDocAction,
  residentId: string,
  entityId: string,
  entityType: string,
  metadata: Record<string, unknown> = {},
): void {
  void auditService.emitClinicalDoc({
    actionType,
    entityType,
    entityId,
    residentId,
    tenantId: user.tenantId,
    userId: user.userId,
    metadata,
  });
}

/** Marks the matching area on a draft assessment as becoming a care plan. */
export async function syncDraftAssessmentNeed(
  tx: PrismaTransactionClient,
  residentId: string,
  tenantId: string,
  dto: CreateNeedCarePlanDTO,
  userId: string,
): Promise<string | null> {
  const assessment = await tx.residentAssessment.findFirst({
    where: { residentId, tenantId, isCurrent: true },
  });
  const isCustomArea = dto.areaKey.startsWith('custom:');
  if (!assessment) {
    if (isCustomArea) {
      throw new BadRequestException(
        'Custom care plans must be linked to an area in the resident assessment',
      );
    }
    return null;
  }
  const needs = Array.isArray(assessment.needs)
    ? [...(assessment.needs as AssessmentNeedDTO[])]
    : [];
  const idx = needs.findIndex((n) => n.areaKey === dto.areaKey);
  const existingNeed = idx >= 0 ? needs[idx] : undefined;
  const customAreaLabel = isCustomArea
    ? existingNeed?.customAreaLabel
    : undefined;
  if (isCustomArea && !customAreaLabel) {
    throw new BadRequestException(
      'Custom care plan area was not found in the resident assessment',
    );
  }
  if (assessment.status === 'Draft') {
    const areaMeta = getCareArea(dto.areaKey);
    const nextNeed = AssessmentNeedSchema.parse({
      ...(existingNeed ?? {}),
      areaKey: dto.areaKey,
      supportLevel: dto.supportLevel ?? existingNeed?.supportLevel ?? null,
      found: dto.content.found ?? existingNeed?.found ?? null,
      source:
        dto.content.source ?? existingNeed?.source ?? areaMeta?.source ?? null,
      toolKey: existingNeed?.toolKey ?? null,
      becomesCarePlan: true,
      ...(customAreaLabel ? { customAreaLabel } : {}),
    });
    if (idx >= 0) needs[idx] = nextNeed;
    else needs.push(nextNeed);
    await tx.residentAssessment.update({
      where: { id: assessment.id },
      data: {
        needs: needs as unknown as Prisma.InputJsonValue,
        updatedById: userId,
      },
    });
  }
  return assessment.id;
}

const DEFAULT_TASK_TIME = '08:00';
/** A step such as "Check pad and skin at 20:00" keeps that time on the task. */
export const timeFromStep = (step: string): string => {
  const match = /([01]?\d|2[0-3]):([0-5]\d)/.exec(step);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : DEFAULT_TASK_TIME;
};

/**
 * Ensures each agreed support step has a carer task, without overwriting
 * times or roles already configured by hand.
 */
export async function ensureAgreedStepTasks(
  tx: PrismaTransactionClient,
  plan: Pick<
    ResidentNeedCarePlan,
    'id' | 'tenantId' | 'branchId' | 'residentId'
  >,
  steps: string[],
  userId: string,
): Promise<void> {
  const existing = await tx.residentCareTask.findMany({
    where: { carePlanId: plan.id },
    select: { stepIndex: true, title: true },
  });
  const usedIndexes = new Set(
    existing.map((t) => t.stepIndex).filter((i): i is number => i !== null),
  );
  const usedTitles = new Set(existing.map((t) => t.title.trim().toLowerCase()));

  for (const [index, title] of steps.entries()) {
    if (usedIndexes.has(index) || usedTitles.has(title.toLowerCase())) {
      continue;
    }
    const time = timeFromStep(title);
    await tx.residentCareTask.create({
      data: {
        tenantId: plan.tenantId,
        branchId: plan.branchId,
        residentId: plan.residentId,
        carePlanId: plan.id,
        stepIndex: index,
        title,
        shift: shiftForTime(time),
        time,
        role: 'Carer',
        recurrence: { type: 'daily', days: [] },
        createdById: userId,
        updatedById: userId,
      },
    });
  }
}
