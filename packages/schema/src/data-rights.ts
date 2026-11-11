import { z } from "zod";

export const sarExportQuerySchema = z.object({
  format: z.enum(["json", "pdf"]).default("json"),
  requesterName: z.string().min(1).max(120).optional(),
  requesterRelationship: z.string().max(80).optional(),
  redactionConfirmed: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => v === true || v === "true")
    .default(false),
});

export type SarExportQueryDTO = z.infer<typeof sarExportQuerySchema>;

export const createDataRightsRequestSchema = z.object({
  subjectType: z.enum(["Resident", "Staff"]).default("Resident"),
  residentId: z.string().uuid().optional().nullable(),
  staffUserId: z.string().uuid().optional().nullable(),
  requestType: z
    .enum(["SAR", "Portability", "Rectification", "Erasure", "Restriction"])
    .default("SAR"),
  requesterName: z.string().min(2).max(120),
  requesterRelationship: z.string().max(80).optional().nullable(),
  identityVerified: z.boolean().default(false),
  authorityVerified: z.boolean().default(false),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateDataRightsRequestDTO = z.infer<
  typeof createDataRightsRequestSchema
>;

// B-03: Granular per-purpose consent tracking
export const ConsentPurposeEnum = z.enum([
  "CareAndTreatment",
  "MedicationAdministration",
  "Photography",
  "FluCovidVaccination",
  "SharingWithFamily",
  "OutingsAndActivities",
  "DNACPR",
  "DataResearch",
]);

export const ConsentLawfulBasisEnum = z.enum([
  "Art6_1_a_Consent",
  "Art6_1_c_LegalObligation",
  "Art6_1_d_VitalInterests",
  "Art6_1_e_PublicTask",
]);

export const ConsentCapacityStatusEnum = z.enum([
  "HasCapacity",
  "LacksCapacity_MCA_BestInterests",
  "LacksCapacity_LPA_HealthWelfare",
  "LacksCapacity_CourtAppointedDeputy",
]);

export const createResidentConsentItemSchema = z.object({
  residentId: z.string().uuid(),
  purpose: ConsentPurposeEnum,
  lawfulBasis: ConsentLawfulBasisEnum.default("Art6_1_c_LegalObligation"),
  specialCategoryBasis: z
    .string()
    .default("Art9_2_h_HealthAndSocialCare"),
  capacityStatus: ConsentCapacityStatusEnum.default("HasCapacity"),
  isGranted: z.boolean().default(true),
  signedByName: z.string().min(2).max(150),
  signedByRelationship: z.string().default("Self"),
  evidenceUrl: z.string().optional().nullable(),
  reviewDueAt: z.string().or(z.date()).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateResidentConsentItemDTO = z.infer<
  typeof createResidentConsentItemSchema
>;

export const withdrawResidentConsentItemSchema = z.object({
  withdrawalReason: z
    .string()
    .trim()
    .min(3, "Withdrawal reason is required")
    .max(500),
});

export type WithdrawResidentConsentItemDTO = z.infer<
  typeof withdrawResidentConsentItemSchema
>;

// B-07: Erasure Requests, Restriction of Processing & Legal Hold
export const ResidentRecordStateEnum = z.enum([
  "Active",
  "Archived",
  "Restricted",
  "LegalHold",
]);

export const updateResidentRecordStateSchema = z.object({
  recordState: ResidentRecordStateEnum,
  reason: z.string().trim().min(5, "Reason is required").max(500),
});

export type UpdateResidentRecordStateDTO = z.infer<
  typeof updateResidentRecordStateSchema
>;

// B-10: Tenant Retention Policy
export const updateTenantRetentionPolicySchema = z.object({
  adultCareRecordsYears: z.number().int().min(8).max(30).default(8),
  staffHrRecordsYears: z.number().int().min(6).max(20).default(6),
  financialRecordsYears: z.number().int().min(7).max(15).default(7),
  incidentSafeguardingYrs: z.number().int().min(10).max(50).default(10),
  dsarComplaintsYears: z.number().int().min(6).max(15).default(6),
  autoPurgeExpiredTokens: z.boolean().default(true),
});

export type UpdateTenantRetentionPolicyDTO = z.infer<
  typeof updateTenantRetentionPolicySchema
>;

// C-08 & G-06: Safeguarding Referrals Register (CQC Reg 13 & Care Act s.42)
export const SafeguardingAbuseCategoryEnum = z.enum([
  "Physical",
  "Emotional",
  "Financial",
  "Neglect",
  "Sexual",
  "Organisational",
  "Discriminatory",
  "SelfNeglect",
  "ModernSlavery",
  "Domestic",
]);

export const createSafeguardingReferralSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  residentId: z.string().uuid().optional().nullable(),
  linkedIncidentId: z.string().uuid().optional().nullable(),
  abuseCategory: SafeguardingAbuseCategoryEnum,
  allegationSummary: z.string().trim().min(10).max(2000),
  immediateProtectionPlan: z.string().trim().min(5).max(2000),
  localAuthorityName: z.string().trim().min(2).max(200),
  section42Referred: z.boolean().default(false),
  section42ReferenceNo: z.string().max(100).optional().nullable(),
  cqcNotified: z.boolean().default(false),
  cqcReferenceNo: z.string().max(100).optional().nullable(),
  policeNotified: z.boolean().default(false),
  policeCrimeReference: z.string().max(100).optional().nullable(),
  familyInformed: z.boolean().default(false),
});

export type CreateSafeguardingReferralDTO = z.infer<
  typeof createSafeguardingReferralSchema
>;

export const updateSafeguardingReferralSchema =
  createSafeguardingReferralSchema.partial().extend({
    status: z
      .enum([
        "Open",
        "StrategyDiscussion",
        "Section42Enquiry",
        "ProtectionPlanActive",
        "Closed",
      ])
      .optional(),
    investigationOutcome: z
      .enum([
        "Substantiated",
        "PartlySubstantiated",
        "Unsubstantiated",
        "Inconclusive",
      ])
      .optional()
      .nullable(),
    lessonsLearned: z.string().max(2000).optional().nullable(),
  });

export type UpdateSafeguardingReferralDTO = z.infer<
  typeof updateSafeguardingReferralSchema
>;

// G-09 & A-13: Care Service & Data Protection Complaints (CQC Reg 16 & DUAA s.103)
export const createComplaintSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  residentId: z.string().uuid().optional().nullable(),
  complaintType: z.enum(["CareService", "DataProtection"]).default("CareService"),
  complainantName: z.string().trim().min(2).max(150),
  complainantRelationship: z.string().max(100).optional().nullable(),
  complainantContact: z.string().max(150).optional().nullable(),
  subject: z.string().trim().min(3).max(250),
  description: z.string().trim().min(10).max(4000),
  severity: z.enum(["Low", "Medium", "High"]).default("Medium"),
});

export type CreateComplaintDTO = z.infer<typeof createComplaintSchema>;

export const updateComplaintSchema = z.object({
  status: z
    .enum([
      "Received",
      "Acknowledged",
      "Investigating",
      "Responded",
      "Escalated",
      "Closed",
    ])
    .optional(),
  investigationFindings: z.string().max(4000).optional().nullable(),
  resolutionOutcome: z.string().max(4000).optional().nullable(),
  lessonsLearned: z.string().max(2000).optional().nullable(),
  escalatedToExternals: z.boolean().optional(),
  externalEscalationBody: z
    .enum(["LGSCO", "ICO", "CQC"])
    .optional()
    .nullable(),
  externalReferenceNo: z.string().max(100).optional().nullable(),
});

export type UpdateComplaintDTO = z.infer<typeof updateComplaintSchema>;

// H-05: Vendor Offboarding & Signed Destruction Certificate
export const confirmTenantOffboardingPurgeSchema = z.object({
  confirmationPhrase: z.literal("CONFIRM_PERMANENT_TENANT_PURGE"),
  exportArchiveVerified: z.literal(true),
  reason: z.string().trim().min(5).max(500),
});

export type ConfirmTenantOffboardingPurgeDTO = z.infer<
  typeof confirmTenantOffboardingPurgeSchema
>;

// PascalCase Aliases for ZodValidationPipe compatibility
export const CreateResidentConsentItemSchema = createResidentConsentItemSchema;
export const WithdrawResidentConsentItemSchema = withdrawResidentConsentItemSchema;
export const UpdateResidentRecordStateSchema = updateResidentRecordStateSchema;
export const UpdateTenantRetentionPolicySchema = updateTenantRetentionPolicySchema;
export const CreateSafeguardingReferralSchema = createSafeguardingReferralSchema;
export const UpdateSafeguardingReferralSchema = updateSafeguardingReferralSchema;
export const CreateComplaintSchema = createComplaintSchema;
export const UpdateComplaintSchema = updateComplaintSchema;
export const ConfirmTenantOffboardingPurgeSchema = confirmTenantOffboardingPurgeSchema;
export const SarExportQuerySchema = sarExportQuerySchema;
export const CreateDataRightsRequestSchema = createDataRightsRequestSchema;

