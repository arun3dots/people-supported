import { z } from "zod";

export const PEEP_MOBILITY_LEVELS = [
  "Independent",
  "Assisted",
  "Wheelchair",
  "Bedbound",
] as const;

export const peepRecordSchema = z.object({
  residentId: z.string().uuid("Invalid resident ID"),
  evacuationMobility: z.enum(PEEP_MOBILITY_LEVELS, {
    errorMap: () => ({ message: "Valid evacuation mobility level is required" }),
  }),
  daytimeLocation: z.string().trim().optional().or(z.literal("")),
  nighttimeLocation: z.string().trim().optional().or(z.literal("")),
  staffAssistanceCount: z.number().int().min(1).max(5).default(1),
  equipmentNeeded: z.string().trim().optional().or(z.literal("")),
  hearingImpairment: z.boolean().default(false),
  visualImpairment: z.boolean().default(false),
  cognitiveImpairment: z.boolean().default(false),
  specificInstructions: z.string().trim().optional().or(z.literal("")),
  nextReviewDue: z.string().min(1, "Next review due date is required"),
});

export type PeepRecordDTO = z.infer<typeof peepRecordSchema>;

