import { z } from "zod";
import { SupportLevelEnum } from "./pre-admission-parts";

const text = z.string().trim().nullable().optional();

// Standard areas default to plans; custom areas become plans when explicitly selected.
export const CARE_AREAS = [
  { key: "mobility", label: "Mobility and falls", source: "Mobility, Falls" },
  { key: "skin", label: "Skin and pressure care", source: "Skin" },
  { key: "nutrition", label: "Eating, drinking and diabetes", source: "Nutrition" },
  { key: "continence", label: "Continence", source: "Continence" },
  { key: "personalCare", label: "Personal care and dressing", source: "Personal care" },
  { key: "medicines", label: "Medicines and pain", source: "Medicines" },
  { key: "cognition", label: "Memory, mood and communication", source: "Cognition" },
  { key: "sleep", label: "Sleep and night care", source: "Sleep" },
  { key: "social", label: "Social life and faith", source: "About me" },
  { key: "capacity", label: "Capacity, DoLS and advance care", source: "" },
] as const;
export const CARE_AREA_KEYS = CARE_AREAS.map((a) => a.key) as [
  (typeof CARE_AREAS)[number]["key"],
  ...(typeof CARE_AREAS)[number]["key"][],
];
export const CareAreaKeyEnum = z.enum(CARE_AREA_KEYS);
export type CareAreaKey = z.infer<typeof CareAreaKeyEnum>;
export type CustomAssessmentAreaKey = `custom:${string}`;
export const CustomAssessmentAreaKeySchema = z
  .string()
  .regex(/^custom:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  .transform((value): CustomAssessmentAreaKey => value as CustomAssessmentAreaKey);
export const AssessmentAreaKeySchema = z.union([
  CareAreaKeyEnum,
  CustomAssessmentAreaKeySchema,
]);
export type AssessmentAreaKey = CareAreaKey | CustomAssessmentAreaKey;

export const getCareArea = (key: string) =>
  CARE_AREAS.find((a) => a.key === key);

const LEGACY_PART_SEGMENT =
  /^Part\s+[A-Z](?:\s*,\s*[A-Z])*\s*(?:·\s*)?|\s*·\s*Part\s+[A-Z](?:\s*,\s*[A-Z])*/gi;

export function cleanAreaSource(
  areaKey: string,
  source?: string | null,
): string | null {
  const canonical = getCareArea(areaKey)?.source;
  if (!source) return canonical ?? null;
  const trimmed = source.trim();
  if (/^Part\s+[A-Z]/i.test(trimmed) && canonical !== undefined) {
    return canonical;
  }
  const cleaned = trimmed.replace(LEGACY_PART_SEGMENT, "").trim();
  return cleaned || (canonical ?? null);
}

export const ASSESSMENT_TOOLS = [
  { key: "waterlow", name: "Waterlow", kind: "scored" },
  { key: "falls", name: "Falls risk", kind: "category" },
  { key: "must", name: "MUST", kind: "scored" },
  { key: "abbey", name: "Abbey Pain Scale", kind: "scored" },
  { key: "continence", name: "Continence assessment", kind: "category" },
  { key: "abc", name: "Distress (ABC chart)", kind: "category" },
  { key: "dols", name: "DoLS screen", kind: "category" },
] as const;
export const ASSESSMENT_TOOL_KEYS = ASSESSMENT_TOOLS.map((t) => t.key) as [
  (typeof ASSESSMENT_TOOLS)[number]["key"],
  ...(typeof ASSESSMENT_TOOLS)[number]["key"][],
];
export const AssessmentToolKeyEnum = z.enum(ASSESSMENT_TOOL_KEYS);
export type AssessmentToolKey = z.infer<typeof AssessmentToolKeyEnum>;

export const ASSESSMENT_RATINGS = ["none", "low", "med", "high"] as const;
export const AssessmentRatingEnum = z.enum(ASSESSMENT_RATINGS);
export type AssessmentRating = z.infer<typeof AssessmentRatingEnum>;

/** The risk tool whose result feeds each area's "what the assessment found". */
export const CARE_AREA_TOOL: Partial<Record<CareAreaKey, AssessmentToolKey>> = {
  mobility: "falls",
  skin: "waterlow",
  nutrition: "must",
  continence: "continence",
  medicines: "abbey",
  cognition: "abc",
  capacity: "dols",
};

export const ASSESSMENT_STATUSES = ["Draft", "Completed"] as const;
export const AssessmentStatusEnum = z.enum(ASSESSMENT_STATUSES);
export type AssessmentStatus = z.infer<typeof AssessmentStatusEnum>;

export const AssessmentToolResultSchema = z.object({
  toolKey: AssessmentToolKeyEnum,
  score: z.number().int().min(0).nullable().optional(),
  label: text,
  rating: AssessmentRatingEnum.optional(),
  answers: z.record(z.string(), z.unknown()).default({}),
  notes: text,
});
export type AssessmentToolResultDTO = z.infer<typeof AssessmentToolResultSchema>;

const AssessmentNeedFields = {
  supportLevel: SupportLevelEnum.nullable().optional(),
  found: text,
  source: text,
  toolKey: AssessmentToolKeyEnum.nullable().optional(),
};

export const AssessmentNeedSchema = z.union([
  z.object({
    ...AssessmentNeedFields,
    areaKey: CareAreaKeyEnum,
    customAreaLabel: z.never().optional(),
    becomesCarePlan: z.boolean().default(true),
  }),
  z.object({
    ...AssessmentNeedFields,
    areaKey: CustomAssessmentAreaKeySchema,
    customAreaLabel: z.string().trim().min(1).max(80),
    becomesCarePlan: z.boolean().default(false),
  }),
]);
export type AssessmentNeedDTO = z.infer<typeof AssessmentNeedSchema>;
export type AssessmentNeedPatchDTO = Partial<
  Pick<
    AssessmentNeedDTO,
    "supportLevel" | "found" | "source" | "toolKey" | "becomesCarePlan"
  >
>;

export const ASSESSMENT_MAX_NEEDS = 50;

export const AssessmentDolsSchema = z.object({
  outcome: text,
  restrictions: z.array(z.string()).default([]),
  notes: text,
  screenedAt: text,
});
export type AssessmentDolsDTO = z.infer<typeof AssessmentDolsSchema>;

export const SaveAssessmentSchema = z.object({
  tools: z.array(AssessmentToolResultSchema).max(ASSESSMENT_TOOLS.length),
  needs: z.array(AssessmentNeedSchema).max(ASSESSMENT_MAX_NEEDS),
  dols: AssessmentDolsSchema.nullable().optional(),
  assessedAt: z.string().nullable().optional(),
});
export type SaveAssessmentDTO = z.infer<typeof SaveAssessmentSchema>;

export interface AssessmentRecordDTO {
  id: string;
  residentId: string;
  preAdmissionId: string | null;
  versionNumber: number;
  status: AssessmentStatus;
  isCurrent: boolean;
  tools: AssessmentToolResultDTO[];
  needs: AssessmentNeedDTO[];
  dols: AssessmentDolsDTO | null;
  assessedAt: string | null;
  assessedByName: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ToolOutcome {
  score: number | null;
  label: string;
  rating: AssessmentRating;
}

const asScore = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

// MUST: BMI score + weight loss score + acute disease effect, each 0-2.
export function scoreMust(answers: Record<string, unknown>): ToolOutcome {
  const score = Math.min(
    asScore(answers.bmiScore) +
      asScore(answers.weightLossScore) +
      asScore(answers.acuteScore),
    6,
  );
  if (score === 0) return { score, label: "Low", rating: "low" };
  if (score === 1) return { score, label: "Medium", rating: "med" };
  return { score, label: "High", rating: "high" };
}

export function scoreWaterlow(score: number): ToolOutcome {
  if (score >= 20) return { score, label: "Very high", rating: "high" };
  if (score >= 15) return { score, label: "High", rating: "high" };
  if (score >= 10) return { score, label: "At risk", rating: "med" };
  return { score, label: "Not at risk", rating: "low" };
}

export function scoreAbbey(score: number): ToolOutcome {
  if (score >= 14) return { score, label: "Severe", rating: "high" };
  if (score >= 8) return { score, label: "Moderate", rating: "med" };
  if (score >= 3) return { score, label: "Mild", rating: "low" };
  return { score, label: "No pain", rating: "low" };
}

const FALLS_RATING: Record<string, AssessmentRating> = {
  low: "low",
  medium: "med",
  high: "high",
};

const isSyncedFromRiskAssessment = (answers: Record<string, unknown>): boolean =>
  typeof answers.category === "string" && typeof answers.status === "string";

// Returns the tool result with score, label and rating derived from the answers
// where the tool is scored, while preserving results synced from Risk Assessments.
export function normaliseToolResult(
  tool: AssessmentToolResultDTO,
): AssessmentToolResultDTO {
  if (isSyncedFromRiskAssessment(tool.answers ?? {})) {
    return { ...tool, rating: tool.rating ?? "none" };
  }
  let outcome: ToolOutcome | null = null;
  if (tool.toolKey === "must") outcome = scoreMust(tool.answers);
  else if (tool.toolKey === "waterlow")
    outcome = scoreWaterlow(asScore(tool.score));
  else if (tool.toolKey === "abbey") outcome = scoreAbbey(asScore(tool.score));
  if (outcome) return { ...tool, ...outcome };

  if (tool.toolKey === "falls") {
    const rating = FALLS_RATING[(tool.label ?? "").toLowerCase()];
    return { ...tool, rating: rating ?? tool.rating ?? "none" };
  }
  return { ...tool, rating: tool.rating ?? "none" };
}

export const formatToolValue = (tool: AssessmentToolResultDTO): string =>
  tool.score != null && tool.label
    ? `${tool.score} · ${tool.label}`
    : (tool.label ?? "—");
