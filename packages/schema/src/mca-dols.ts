import { z } from "zod";

export const CapacityDecisionTypeEnum = z.enum([
  "BedRails",
  "SensorMat",
  "CovertMedication",
  "KeypadDoorAccess",
  "FinancialManagement",
  "PersonalCareAssistance",
  "MedicalTreatment",
  "Other",
]);
export type CapacityDecisionType = z.infer<typeof CapacityDecisionTypeEnum>;

export const ConsultedPersonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  viewsExpressed: z.string().min(1, "Views expressed are required"),
});
export type ConsultedPerson = z.infer<typeof ConsultedPersonSchema>;

export const MentalCapacityAssessmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  residentId: z.string(),
  assessorId: z.string(),
  assessorName: z.string().optional(),
  carePlanId: z.string().nullable().optional(),
  decisionType: CapacityDecisionTypeEnum,
  specificDecision: z.string().min(1, "Specific decision description is required"),
  // Stage 1: Diagnostic Test (Section 2 MCA 2005)
  hasImpairmentOrDisturbance: z.boolean(),
  impairmentDetails: z.string().min(1, "Impairment details are required"),
  // Stage 2: Functional Test (Section 3 MCA 2005 - 4 statutory questions)
  canUnderstandInfo: z.boolean(),
  canRetainInfo: z.boolean(),
  canWeighOrUseInfo: z.boolean(),
  canCommunicateDecision: z.boolean(),
  // Outcome
  hasCapacity: z.boolean(),
  // Section 4 Best Interests Checklist (if lacking capacity)
  bestInterestsRequired: z.boolean().default(false),
  consultedPersons: z.array(ConsultedPersonSchema).default([]),
  leastRestrictiveOptionConsidered: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  assessedAt: z.date().or(z.string()),
  reviewDate: z.date().or(z.string()).nullable().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()).optional(),
});
export type MentalCapacityAssessmentDTO = z.infer<typeof MentalCapacityAssessmentSchema>;

export const CreateMentalCapacityAssessmentSchema = z.object({
  residentId: z.string().min(1, "Resident is required"),
  carePlanId: z.string().optional(),
  decisionType: CapacityDecisionTypeEnum,
  specificDecision: z.string().min(1, "Specific decision description is required"),
  // Stage 1
  hasImpairmentOrDisturbance: z.boolean(),
  impairmentDetails: z.string().min(1, "Impairment details are required"),
  // Stage 2
  canUnderstandInfo: z.boolean(),
  canRetainInfo: z.boolean(),
  canWeighOrUseInfo: z.boolean(),
  canCommunicateDecision: z.boolean(),
  // Outcome
  hasCapacity: z.boolean(),
  // Section 4 Best Interests
  bestInterestsRequired: z.boolean().default(false),
  consultedPersons: z.array(ConsultedPersonSchema).default([]),
  leastRestrictiveOptionConsidered: z.string().optional(),
  notes: z.string().optional(),
  assessedAt: z.date().or(z.string()).optional(),
  reviewDate: z.date().or(z.string()).optional(),
});
export type CreateMentalCapacityAssessmentDTO = z.infer<typeof CreateMentalCapacityAssessmentSchema>;

export const UpdateMentalCapacityAssessmentSchema = CreateMentalCapacityAssessmentSchema.partial();
export type UpdateMentalCapacityAssessmentDTO = z.infer<typeof UpdateMentalCapacityAssessmentSchema>;

export const DolsAuthorizationStatusEnum = z.enum([
  "UrgentApplied",
  "StandardApplied",
  "Authorized",
  "Expired",
  "Refused",
  "Withdrawn",
]);
export type DolsAuthorizationStatus = z.infer<typeof DolsAuthorizationStatusEnum>;

export const DolsAuthorizationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  residentId: z.string(),
  supervisoryBody: z.string().min(1, "Supervisory body is required"),
  referenceNumber: z.string().nullable().optional(),
  status: DolsAuthorizationStatusEnum,
  appliedDate: z.date().or(z.string()),
  authorizedDate: z.date().or(z.string()).nullable().optional(),
  expiryDate: z.date().or(z.string()).nullable().optional(),
  conditions: z.array(z.string()).default([]),
  relevantPersonsRepresentative: z.string().nullable().optional(),
  rprContact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()).optional(),
});
export type DolsAuthorizationDTO = z.infer<typeof DolsAuthorizationSchema>;

export const BaseCreateDolsAuthorizationSchema = z.object({
  residentId: z.string().min(1, "Resident is required"),
  supervisoryBody: z.string().min(1, "Supervisory body / Local Authority is required"),
  referenceNumber: z.string().optional(),
  status: DolsAuthorizationStatusEnum,
  appliedDate: z.date().or(z.string()),
  authorizedDate: z.date().or(z.string()).optional(),
  expiryDate: z.date().or(z.string()).optional(),
  conditions: z.array(z.string()).default([]),
  relevantPersonsRepresentative: z.string().optional(),
  rprContact: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateDolsAuthorizationSchema = BaseCreateDolsAuthorizationSchema.partial();
export type UpdateDolsAuthorizationDTO = z.infer<typeof UpdateDolsAuthorizationSchema>;

export const CreateDolsAuthorizationSchema = BaseCreateDolsAuthorizationSchema.refine(
  (data) => {
    if (data.authorizedDate && new Date(data.authorizedDate) < new Date(data.appliedDate)) {
      return false;
    }
    return true;
  },
  {
    message: "Authorised date cannot be earlier than application date",
    path: ["authorizedDate"],
  }
).refine(
  (data) => {
    if (!data.expiryDate) return true;
    const baseDate = data.authorizedDate ? new Date(data.authorizedDate) : new Date(data.appliedDate);
    if (new Date(data.expiryDate) <= baseDate) {
      return false;
    }
    return true;
  },
  {
    message: "Expiry date must be after application and authorised date",
    path: ["expiryDate"],
  }
);
export type CreateDolsAuthorizationDTO = z.infer<typeof CreateDolsAuthorizationSchema>;

