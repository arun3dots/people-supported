import { z } from "zod";

export const CQC_NOTICE_TYPES = [
  "DeathOfResident",
  "SeriousInjury",
  "AbuseAllegation",
  "IncidentWithPolice",
  "UnauthorizedAbsence",
] as const;

export const createCqcNotificationSchema = z.object({
  residentId: z.string().uuid("Invalid resident ID").optional().or(z.literal("")),
  noticeType: z.enum(CQC_NOTICE_TYPES, {
    errorMap: () => ({ message: "Valid statutory CQC notification type is required" }),
  }),
  incidentDate: z.string().min(1, "Incident date is required"),
  summary: z.string().trim().min(10, "Summary must be at least 10 characters"),
  actionTaken: z.string().trim().min(5, "Action taken is required"),
  cqcReferenceNo: z.string().trim().optional().or(z.literal("")),
});

export type CreateCqcNotificationDTO = z.infer<typeof createCqcNotificationSchema>;

export const submitCqcNotificationSchema = z.object({
  cqcReferenceNo: z.string().trim().min(3, "CQC reference or confirmation number is required"),
});

export type SubmitCqcNotificationDTO = z.infer<typeof submitCqcNotificationSchema>;

