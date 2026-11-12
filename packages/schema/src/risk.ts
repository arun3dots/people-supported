import { z } from "zod";

// ---------- Enums ----------
export const riskCategorySchema = z.enum([
  "Clinical",
  "Environmental",
  "Behavioral",
  "Building",
  "Individual",
]);
export type RiskCategory = z.infer<typeof riskCategorySchema>;

export const riskStatusSchema = z.enum([
  "Draft",
  "PendingReview",
  "Active",
  "Archived",
]);
export type RiskStatus = z.infer<typeof riskStatusSchema>;

export const riskLevelSchema = z.enum(["Low", "Moderate", "High", "Extreme"]);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const riskControlStatusSchema = z.enum([
  "Pending",
  "InProgress",
  "Completed",
  "Overdue",
]);
export type RiskControlStatus = z.infer<typeof riskControlStatusSchema>;

// ---------- Score & level helpers (single source of truth, FE+BE share) ----------
export function calculateRiskScore(likelihood: number, severity: number): number {
  return likelihood * severity;
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 20) return "Extreme";
  if (score >= 12) return "High";
  if (score >= 6) return "Moderate";
  return "Low";
}

// ---------- Risk Control schemas ----------
export const createRiskControlSchema = z.object({
  description: z.string().min(3, "Description is required"),
  isExisting: z.boolean().default(false),
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type CreateRiskControlDTO = z.infer<typeof createRiskControlSchema>;

export const updateRiskControlSchema = createRiskControlSchema.partial().extend({
  status: riskControlStatusSchema.optional(),
});
export type UpdateRiskControlDTO = z.infer<typeof updateRiskControlSchema>;

export const completeRiskControlSchema = z.object({
  notes: z.string().optional().nullable(),
});
export type CompleteRiskControlDTO = z.infer<typeof completeRiskControlSchema>;

// ---------- Risk Assessment schemas ----------
const oneToFive = z.coerce.number().int().min(1).max(5);
const nextReviewDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(value + "T00:00:00.000Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid next review date");

export const createRiskAssessmentSchema = z.object({
  residentId: z.string().min(1),
  templateId: z.string().uuid().optional().nullable(),
  category: riskCategorySchema,
  title: z.string().min(2),
  hazardDescription: z.string().min(5),
  tool: z.string().optional().nullable(),
  likelihood: oneToFive,
  severity: oneToFive,
  status: riskStatusSchema.optional(),
  nextReviewDate: nextReviewDateSchema,
  factors: z.array(z.string()).optional(),
  // Inline initial controls (optional — controls can also be added afterwards).
  controls: z.array(createRiskControlSchema).optional(),
});
export type CreateRiskAssessmentDTO = z.infer<typeof createRiskAssessmentSchema>;

export const updateRiskAssessmentSchema = z.object({
  category: riskCategorySchema.optional(),
  title: z.string().min(2).optional(),
  hazardDescription: z.string().min(5).optional(),
  tool: z.string().optional().nullable(),
  likelihood: oneToFive.optional(),
  severity: oneToFive.optional(),
  residualLikelihood: oneToFive.optional().nullable(),
  residualSeverity: oneToFive.optional().nullable(),
  status: riskStatusSchema.optional(),
  nextReviewDate: nextReviewDateSchema.optional(),
  factors: z.array(z.string()).optional(),
});
export type UpdateRiskAssessmentDTO = z.infer<typeof updateRiskAssessmentSchema>;

export const transitionRiskStatusSchema = z.object({
  status: riskStatusSchema,
  comment: z.string().optional().nullable(),
});
export type TransitionRiskStatusDTO = z.infer<typeof transitionRiskStatusSchema>;

// ---------- Risk Template schemas ----------
export const createRiskTemplateSchema = z.object({
  name: z.string().min(2),
  category: riskCategorySchema,
  hazardDescription: z.string().min(5),
  tool: z.string().optional().nullable(),
  defaultLikelihood: oneToFive,
  defaultSeverity: oneToFive,
  defaultControls: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});
export type CreateRiskTemplateDTO = z.infer<typeof createRiskTemplateSchema>;

export const updateRiskTemplateSchema = createRiskTemplateSchema.partial();
export type UpdateRiskTemplateDTO = z.infer<typeof updateRiskTemplateSchema>;

// ---------- Risk Alert schemas ----------
export const riskAlertTypeSchema = z.enum([
  "HighRiskCreated",
  "PendingReview",
  "Activated",
  "ControlAssigned",
  "ReviewDue",
  "ControlOverdue",
]);
export type RiskAlertType = z.infer<typeof riskAlertTypeSchema>;

// ---------- Filters ----------
export const riskListFiltersSchema = z.object({
  residentId: z.string().min(1).optional(),
  status: riskStatusSchema.optional(),
  category: riskCategorySchema.optional(),
  level: riskLevelSchema.optional(),
  dueWithinDays: z.coerce.number().int().min(0).max(365).optional(),
  /**
   * Restrict to one branch. Honoured only for tenant-wide callers; a
   * branch-assigned user is pinned to their JWT branch by the controller.
   */
  branchId: z.string().min(1).optional(),
});
export type RiskListFilters = z.infer<typeof riskListFiltersSchema>;
