import { z } from "zod";

export const SupportedLivingTenancySchema = z.object({
  tenancyStartDate: z.string().nullable().optional(),
  landlord: z.string().nullable().optional(),
  tenancyType: z.string().nullable().optional(),
  housingBenefit: z.string().nullable().optional(),
  weeklyRent: z.coerce.number().min(0).nullable().optional(),
  address: z.string().nullable().optional(),
});

export const SupportedLivingCompatibilitySchema = z.object({
  housematesCount: z.coerce.number().int().min(0).nullable().optional(),
  preferredEnvironment: z.string().nullable().optional(),
  knownTriggers: z.string().nullable().optional(),
  likesAndInterests: z.string().nullable().optional(),
});

export const SupportedLivingOutcomeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Outcome title is required"),
  progress: z.coerce.number().min(0).max(100).default(0),
  status: z.enum(["On track", "Needs focus", "Achieved"]).default("On track"),
  domainKey: z.string().nullable().optional(),
});

export const SupportedLivingDomainItemSchema = z.object({
  id: z.string(),
  domain: z.string().min(1, "Domain name is required"),
  outcomeSummary: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  whatINeed: z.string().nullable().optional(),
  howToSupportMe: z.string().nullable().optional(),
  staffing: z.string().nullable().optional(),
});

export const SupportedLivingPlanHeaderSchema = z.object({
  version: z.string().default("v1.0"),
  status: z.enum(["In date", "Due soon", "Overdue"]).default("In date"),
  approvedBy: z.string().nullable().optional(),
  approvedDate: z.string().nullable().optional(),
  coProducedWith: z.string().nullable().optional(),
  nextReviewDate: z.string().nullable().optional(),
});

export const SupportedLivingDetailsSchema = z.object({
  referenceCode: z.string().nullable().optional(),
  primaryNeed: z.string().nullable().optional(),
  supportHoursPerWeek: z.coerce.number().min(0).nullable().optional(),
  oneToOneHoursPerWeek: z.coerce.number().min(0).nullable().optional(),
  riskLevel: z.enum(["Low", "Medium", "High"]).nullable().optional(),
  tenancy: SupportedLivingTenancySchema.optional(),
  supportNeeds: z.array(z.string()).optional(),
  compatibility: SupportedLivingCompatibilitySchema.optional(),
  outcomes: z.array(SupportedLivingOutcomeSchema).optional(),
  supportPlanHeader: SupportedLivingPlanHeaderSchema.optional(),
  supportPlanDomains: z.array(SupportedLivingDomainItemSchema).optional(),
});

export const UpdateSupportedLivingDetailsSchema =
  SupportedLivingDetailsSchema.partial();

export type SupportedLivingTenancyDTO = z.infer<
  typeof SupportedLivingTenancySchema
>;
export type SupportedLivingCompatibilityDTO = z.infer<
  typeof SupportedLivingCompatibilitySchema
>;
export type SupportedLivingOutcomeDTO = z.infer<
  typeof SupportedLivingOutcomeSchema
>;
export type SupportedLivingDomainItemDTO = z.infer<
  typeof SupportedLivingDomainItemSchema
>;
export type SupportedLivingPlanHeaderDTO = z.infer<
  typeof SupportedLivingPlanHeaderSchema
>;
export type SupportedLivingDetailsDTO = z.infer<
  typeof SupportedLivingDetailsSchema
>;
export type UpdateSupportedLivingDetailsDTO = z.infer<
  typeof UpdateSupportedLivingDetailsSchema
>;
