import { z } from "zod";

export const complianceReviewCategorySchema = z.enum([
  "all",
  "support-plan",
  "staff-certification",
  "medication",
]);

export type ComplianceReviewCategory = z.infer<typeof complianceReviewCategorySchema>;

export const complianceReviewQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).optional().default(30),
  category: z.enum(["all", "support-plan", "staff-certification", "medication"]).optional().default("all"),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type ComplianceReviewQueryDTO = z.infer<typeof complianceReviewQuerySchema>;

export const complianceReviewItemSchema = z.object({
  id: z.string(),
  category: z.enum(["support-plan", "staff-certification", "medication"]),
  entityId: z.string(),
  personId: z.string(),
  personName: z.string(),
  personRoleOrRoom: z.string().optional(),
  title: z.string(),
  details: z.string().optional(),
  targetDate: z.string(),
  daysRemaining: z.number(),
  status: z.string(),
  linkUrl: z.string(),
});

export type ComplianceReviewItemDTO = z.infer<typeof complianceReviewItemSchema>;

export const complianceReviewSummarySchema = z.object({
  totalDue: z.number(),
  supportPlansDue: z.number(),
  staffCertsDue: z.number(),
  medicationsDue: z.number(),
  criticalCount: z.number(),
});

export type ComplianceReviewSummaryDTO = z.infer<typeof complianceReviewSummarySchema>;

export const complianceReviewResponseSchema = z.object({
  summary: complianceReviewSummarySchema,
  items: z.array(complianceReviewItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type ComplianceReviewResponseDTO = z.infer<typeof complianceReviewResponseSchema>;

