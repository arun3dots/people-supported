import { z } from "zod";

export const breakGlassSchema = z.object({
  reason: z
    .string({ required_error: "Clinical emergency justification is required" })
    .trim()
    .min(10, "Emergency reason must be at least 10 characters detailing clinical justification")
    .max(500),
});

export type BreakGlassDTO = z.infer<typeof breakGlassSchema>;

export const reviewBreakGlassSchema = z.object({
  reviewNotes: z.string().trim().min(5, "Review notes are required").max(500),
});

export type ReviewBreakGlassDTO = z.infer<typeof reviewBreakGlassSchema>;

