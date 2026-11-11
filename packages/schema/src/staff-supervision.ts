import { z } from "zod";

export const createSupervisionSchema = z.object({
  staffId: z.string().uuid("Invalid staff ID"),
  supervisionDate: z.string().min(1, "Supervision date is required"),
  notes: z.string().trim().min(10, "Discussion notes are required (min 10 characters)"),
  actionAgreed: z.string().trim().optional().or(z.literal("")),
  nextSessionDate: z.string().optional().or(z.literal("")),
  status: z.enum(["Scheduled", "Completed", "Cancelled"]).default("Completed"),
});

export type CreateSupervisionDTO = z.infer<typeof createSupervisionSchema>;

export const createAppraisalSchema = z.object({
  staffId: z.string().uuid("Invalid staff ID"),
  appraisalPeriod: z.string().trim().min(2, "Appraisal period is required (e.g. 2025-2026)"),
  appraisalDate: z.string().min(1, "Appraisal date is required"),
  objectives: z.string().trim().min(10, "Objectives and review text required"),
  trainingNeeds: z.string().trim().optional().or(z.literal("")),
  overallRating: z.enum(["Exceeds", "Meets", "NeedsImprovement"]).default("Meets"),
  nextAppraisalDue: z.string().min(1, "Next appraisal due date is required"),
});

export type CreateAppraisalDTO = z.infer<typeof createAppraisalSchema>;

