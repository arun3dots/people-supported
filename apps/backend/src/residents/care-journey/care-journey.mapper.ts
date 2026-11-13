import type {
  ResidentAssessment,
  ResidentCareTask,
  ResidentCareTaskRecord,
  ResidentNeedCarePlan,
  ResidentShiftNote,
} from '@repo/db';
import {
  ASSESSMENT_TOOLS,
  CARE_AREAS,
  cleanAreaSource,
  formatToolValue,
  getCareArea,
  type AssessmentDolsDTO,
  type AssessmentAreaKey,
  type AssessmentNeedDTO,
  type AssessmentRating,
  type AssessmentRecordDTO,
  type AssessmentStatus,
  type AssessmentToolResultDTO,
  type CareAreaKey,
  type CareTaskDefinitionDTO,
  type CareTaskRecordSummaryDTO,
  type CareTaskRecurrenceDTO,
  type CareTaskRole,
  type CareTaskShift,
  type NeedCarePlanAgreementDTO,
  type NeedCarePlanContentDTO,
  type NeedCarePlanRecordDTO,
  type NeedCarePlanRiskDTO,
  type NeedCarePlanStatus,
  type PreAdmissionPartDDTO,
  type ShiftNoteDTO,
  type SupportLevel,
} from '@repo/schema';

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);
export const dateOnly = (d: Date): string => d.toISOString().slice(0, 10);

export function toAssessmentDTO(row: ResidentAssessment): AssessmentRecordDTO {
  const needs = ((row.needs ?? []) as AssessmentNeedDTO[]).map((need) => ({
    ...need,
    source: cleanAreaSource(need.areaKey, need.source),
  })) as AssessmentNeedDTO[];
  return {
    id: row.id,
    residentId: row.residentId,
    preAdmissionId: row.preAdmissionId,
    versionNumber: row.versionNumber,
    status: row.status as AssessmentStatus,
    isCurrent: row.isCurrent,
    tools: (row.tools ?? []) as AssessmentToolResultDTO[],
    needs,
    dols: (row.dols ?? null) as AssessmentDolsDTO | null,
    assessedAt: iso(row.assessedAt),
    assessedByName: row.assessedByName,
    completedAt: iso(row.completedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toNeedCarePlanDTO(
  row: ResidentNeedCarePlan,
  taskCount: number,
): NeedCarePlanRecordDTO {
  const agreement = row.agreement as
    | (NeedCarePlanAgreementDTO & { agreedAt: string })
    | null;
  const rawContent = (row.content ?? { steps: [] }) as NeedCarePlanContentDTO;
  const content: NeedCarePlanContentDTO = {
    ...rawContent,
    source: cleanAreaSource(row.areaKey, rawContent.source),
  };
  return {
    id: row.id,
    residentId: row.residentId,
    assessmentId: row.assessmentId,
    areaKey: row.areaKey as AssessmentAreaKey,
    area: row.area,
    supportLevel: row.supportLevel as SupportLevel | null,
    risk: (row.risk ?? null) as NeedCarePlanRiskDTO | null,
    content,
    agreement: agreement ?? null,
    status: row.status as NeedCarePlanStatus,
    versionNumber: row.versionNumber,
    isCurrent: row.isCurrent,
    reviewDate: iso(row.reviewDate),
    agreedAt: iso(row.agreedAt),
    taskCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toTaskDefinitionDTO(
  row: ResidentCareTask,
  plan: Pick<ResidentNeedCarePlan, 'areaKey' | 'area'>,
): CareTaskDefinitionDTO {
  return {
    id: row.id,
    carePlanId: row.carePlanId,
    areaKey: plan.areaKey as AssessmentAreaKey,
    area: plan.area,
    stepIndex: row.stepIndex,
    title: row.title,
    description: row.description,
    shift: row.shift as CareTaskShift,
    time: row.time,
    role: row.role as CareTaskRole,
    recurrence: (row.recurrence ?? {
      type: 'daily',
      days: [],
    }) as CareTaskRecurrenceDTO,
    isActive: row.isActive,
    startsOn: row.startsOn ? dateOnly(row.startsOn) : null,
    endsOn: row.endsOn ? dateOnly(row.endsOn) : null,
  };
}

export function toRecordSummary(
  row: ResidentCareTaskRecord,
): CareTaskRecordSummaryDTO {
  return {
    id: row.id,
    outcome: row.outcome as CareTaskRecordSummaryDTO['outcome'],
    note: row.note,
    recordedAt: row.recordedAt.toISOString(),
    recordedByName: row.recordedByName,
  };
}

export function toShiftNoteDTO(row: ResidentShiftNote): ShiftNoteDTO {
  return {
    id: row.id,
    date: dateOnly(row.date),
    shift: row.shift as CareTaskShift,
    text: row.text,
    authorName: row.authorName,
    createdAt: row.createdAt.toISOString(),
  };
}

// Pre-admission Part D area -> care area it informs.
const PART_D_AREA_FOR_CARE_AREA: Partial<
  Record<CareAreaKey, keyof PreAdmissionPartDDTO['areas']>
> = {
  mobility: 'mobility',
  skin: 'skin',
  nutrition: 'eating',
  continence: 'continence',
};

const FALLS_RATING: Record<string, AssessmentRating> = {
  High: 'high',
  Medium: 'med',
  Low: 'low',
};

export interface AssessmentPrefill {
  tools: AssessmentToolResultDTO[];
  needs: AssessmentNeedDTO[];
}

/** Starting point for a new assessment, taken from the pre-admission Part D. */
export function prefillAssessment(
  partD: PreAdmissionPartDDTO | null,
): AssessmentPrefill {
  const fallsLevel = partD?.fallsRiskLevel ?? null;
  const tools: AssessmentToolResultDTO[] = ASSESSMENT_TOOLS.map((t) => ({
    toolKey: t.key,
    score: null,
    label: t.key === 'falls' ? fallsLevel : null,
    rating:
      t.key === 'falls' && fallsLevel
        ? (FALLS_RATING[fallsLevel] ?? 'none')
        : ('none' as const),
    answers: {},
  }));
  const needs: AssessmentNeedDTO[] = CARE_AREAS.map((a) => {
    const partArea = PART_D_AREA_FOR_CARE_AREA[a.key];
    const fromPart = partArea ? partD?.areas?.[partArea] : undefined;
    return {
      areaKey: a.key,
      supportLevel: fromPart?.supportLevel ?? null,
      found: fromPart?.summary ?? null,
      source: a.source,
      toolKey: null,
      becomesCarePlan: true,
    };
  });
  return { tools, needs };
}

/** The risk shown on a care plan comes from the assessment tool linked to the need. */
export function riskForNeed(
  need: AssessmentNeedDTO,
  tools: AssessmentToolResultDTO[],
): NeedCarePlanRiskDTO | null {
  if (!need.toolKey) return null;
  const tool = tools.find((t) => t.toolKey === need.toolKey);
  if (!tool || (tool.score == null && !tool.label)) return null;
  const meta = ASSESSMENT_TOOLS.find((t) => t.key === tool.toolKey);
  return {
    toolKey: tool.toolKey,
    name: meta?.name ?? tool.toolKey,
    value: formatToolValue(tool),
    rating: tool.rating ?? 'none',
  };
}

export function draftPlanContent(
  need: AssessmentNeedDTO,
): NeedCarePlanContentDTO {
  return {
    source:
      cleanAreaSource(need.areaKey, need.source) ??
      getCareArea(need.areaKey)?.source ??
      null,
    found: need.found ?? null,
    needs: null,
    prefs: null,
    strengths: null,
    outcome: null,
    steps: [],
    monitor: null,
    escalation: null,
    consent: null,
    restrictions: null,
  };
}
