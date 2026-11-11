import { z } from "zod";

export const AUDIT_TYPES = [
  "InfectionControl",
  "MedicationAudit",
  "HealthAndSafety",
  "CarePlanQuality",
] as const;

export const createAuditScheduleSchema = z.object({
  auditType: z.enum(AUDIT_TYPES, {
    errorMap: () => ({ message: "Valid clinical audit type is required" }),
  }),
  frequency: z.enum(["Monthly", "Quarterly", "Annual"]).default("Monthly"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  auditorId: z.string().uuid("Invalid auditor user ID"),
});

export type CreateAuditScheduleDTO = z.infer<typeof createAuditScheduleSchema>;

export const completeAuditScheduleSchema = z.object({
  scorePercentage: z.number().min(0).max(100),
  findingsSummary: z.string().trim().min(5, "Findings summary is required"),
  actionPlan: z.string().trim().optional().or(z.literal("")),
});

export type CompleteAuditScheduleDTO = z.infer<typeof completeAuditScheduleSchema>;

