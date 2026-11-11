import { z } from "zod";

export const todayDateString = () => new Date().toISOString().slice(0, 10);

export const StopActionSchema = z.object({
  effectiveDate: z.string().min(1, "Effective date is required"),
  reason: z.string().trim().min(1, "Reason is required"),
  backdateReason: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.effectiveDate < todayDateString() && (!data.backdateReason || !data.backdateReason.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Backdate reason is required for past dates",
      path: ["backdateReason"],
    });
  }
});

export const PauseActionSchema = z.object({
  effectiveDate: z.string().min(1, "Pause start date is required"),
  resumeOn: z.string().min(1, "Resume date is required"),
  reason: z.string().trim().min(1, "Reason is required"),
  backdateReason: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.resumeOn && data.effectiveDate && data.resumeOn < data.effectiveDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Resume date cannot be before pause start date",
      path: ["resumeOn"],
    });
  }
  if (data.effectiveDate < todayDateString() && (!data.backdateReason || !data.backdateReason.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Backdate reason is required for past dates",
      path: ["backdateReason"],
    });
  }
});

export const ChangeActionSchema = z.object({
  drugName: z.string().trim().min(1, "Drug name is required"),
  dose: z.string().trim().min(1, "Dose is required"),
  form: z.string().trim().min(1, "Form is required"),
  times: z.string().trim().min(1, "At least one administration time is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().trim().min(1, "Reason is required"),
  backdateReason: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.endDate && data.effectiveDate && data.endDate < data.effectiveDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date cannot be before effective date",
      path: ["endDate"],
    });
  }
  if (data.effectiveDate < todayDateString() && (!data.backdateReason || !data.backdateReason.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Backdate reason is required for past dates",
      path: ["backdateReason"],
    });
  }
});

