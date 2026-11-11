import { z } from "zod";

export const createVisitorLogSchema = z.object({
  residentId: z.string().uuid("Invalid resident ID"),
  visitorName: z.string().trim().min(2, "Visitor name is required").max(100),
  relationship: z.string().trim().min(2, "Relationship is required").max(50),
  contactNumber: z.string().trim().optional().or(z.literal("")),
  visitingRestrictions: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type CreateVisitorLogDTO = z.infer<typeof createVisitorLogSchema>;

export const signOutVisitorSchema = z.object({
  notes: z.string().trim().optional().or(z.literal("")),
});

export type SignOutVisitorDTO = z.infer<typeof signOutVisitorSchema>;

