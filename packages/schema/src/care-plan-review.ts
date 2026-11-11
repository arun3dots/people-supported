import { z } from "zod";

export const CarePlanReviewDecisionEnum = z.enum([
  "MaintainedNoChanges",
  "MinorAdjustments",
  "MajorChangeTriggersRenewal",
]);
export type CarePlanReviewDecision = z.infer<typeof CarePlanReviewDecisionEnum>;

export const CarePlanReviewSchema = z.object({
  id: z.string(),
  carePlanId: z.string(),
  residentId: z.string(),
  reviewerId: z.string(),
  reviewerName: z.string().optional(),
  reviewedAt: z.date().or(z.string()),
  nextScheduledReview: z.date().or(z.string()).nullable().optional(),
  decision: CarePlanReviewDecisionEnum,
  summaryNotes: z.string().min(1, "Review notes are required"),
  residentFeedback: z.string().nullable().optional(),
  familyFeedback: z.string().nullable().optional(),
  domainsEvaluated: z.array(z.string()).default([]),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()).optional(),
});
export type CarePlanReviewDTO = z.infer<typeof CarePlanReviewSchema>;

export const CreateCarePlanReviewSchema = z.object({
  decision: CarePlanReviewDecisionEnum.default("MaintainedNoChanges"),
  summaryNotes: z.string().min(1, "Review notes are required"),
  residentFeedback: z.string().optional(),
  familyFeedback: z.string().optional(),
  domainsEvaluated: z.array(z.string()).default([]),
  nextScheduledReview: z.string().or(z.date()).optional(),
});
export type CreateCarePlanReviewDTO = z.infer<typeof CreateCarePlanReviewSchema>;
