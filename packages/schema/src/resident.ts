import { z } from "zod";


export const DischargeTypeEnum = z.enum([
  "Planned",
  "Emergency",
  "Transfer",
  "Deceased",
  "Hospital",
  "Hospitalization",
  "Home",
  "Other",
  "planned",
  "emergency",
  "transfer",
  "deceased",
  "hospital",
  "home",
  "other",
]);
export type DischargeType = z.infer<typeof DischargeTypeEnum>;

export const DischargeHandoverDocumentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  fileUrl: z.string(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  updatedAt: z.string().optional(),
});
export type DischargeHandoverDocumentDTO = z.infer<typeof DischargeHandoverDocumentSchema>;

export const DischargeResidentSchema = z.object({
  dischargeType: DischargeTypeEnum.default("Planned"),
  dischargeDate: z.string().optional().or(z.literal("")),
  dischargeTime: z.string().optional().or(z.literal("")),
  reason: z.string().min(1, "Reason is required"),
  carePlanReview: z.string().default("Completed"),
  riskAssessment: z.string().default("Low Risk"),
  medicationReview: z.string().default("Completed"),
  familyNotified: z.boolean().default(false),
  gpNotified: z.boolean().default(false),
  handoverDocuments: z.array(DischargeHandoverDocumentSchema).optional().default([]),
  notes: z.string().optional().or(z.literal("")),
});

export const CarePlanSchema = z.object({
  sectionName: z.string().min(1),
  content: z.record(z.unknown()),
});

export const SaveDocumentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fileUrl: z.string().url("Valid URL is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().positive("File size must be positive"),
  category: z.string().optional().default("General"),
});

export const VerifyDocumentSchema = z.object({
  status: z.enum(["Verified", "Rejected", "Uploaded", "Archived"]).default("Verified"),
  notes: z.string().optional(),
});

// ==========================================
// --- 9-Step Comprehensive Admission DTOs ---
// ==========================================

export const residentNameRegex = /^[\p{L}\p{M}\s'-]+$/u;
export const residentNameRegexError = "can only contain letters, spaces, hyphens, or apostrophes";
export const RESIDENT_NAME_ERROR = "Only letters, spaces, hyphens, and apostrophes allowed";

export const isInvalidResidentName = (val?: string | null): boolean =>
  Boolean(val?.trim() && !residentNameRegex.test(val.trim()));

const requiredResidentName = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(50, `${field} must be 50 characters or fewer`)
    .regex(residentNameRegex, `${field} ${residentNameRegexError}`);

const optionalResidentName = (field: string) =>
  z
    .string()
    .trim()
    .max(50, `${field} must be 50 characters or fewer`)
    .refine(
      (val) => !val || residentNameRegex.test(val),
      `${field} ${residentNameRegexError}`,
    )
    .nullable()
    .optional();

// Step 1: Personal & Identity
export const AdmitStep1Schema = z.object({
  // Optional: branch-assigned callers get branchId from their JWT
  // (req.user.activeBranchId); only tenant-wide callers with no active
  // branch need to supply it explicitly here.
  branchId: z.string().uuid("Invalid branch selected").optional(),
  photoUrl: z.string().nullable().optional().or(z.literal("")),
  firstName: requiredResidentName("First name"),
  middleName: optionalResidentName("Middle name"),
  lastName: requiredResidentName("Last name"),
  fullName: z.string().optional().or(z.literal("")),
  preferredName: optionalResidentName("Preferred name"),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => {
      if (!v) return true;
      const parsed = new Date(v);
      if (isNaN(parsed.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsed < today;
    }, "Date of birth cannot be today or a future date"),
  gender: z.enum(["Male", "Female", "Other"]).or(z.string()),
  maritalStatus: z.enum(["Married", "Divorced", "Widowed", "Single"]).or(z.string()).nullable().optional(),
  nationalId: z.string().nullable().optional().or(z.literal("")),
  nationalIdType: z.string().nullable().optional().or(z.literal("")),
  religion: z.string().nullable().optional().or(z.literal("")),
  languagesSpoken: z.array(z.string()).default(["English"]),
  interpreterRequired: z.boolean().default(false),
  formerOccupation: z.string().nullable().optional().or(z.literal("")),
  hobbies: z.string().nullable().optional().or(z.literal("")),
  previousAddress: z.string().nullable().optional().or(z.literal("")),
  admissionDate: z.string().min(1, "Admission date is required"),
  admissionType: z.enum(["Permanent", "Respite", "Short-term"]).or(z.string()).default("Permanent"),
  admittedFrom: z.enum(["Home", "Hospital", "Other facility"]).or(z.string()).default("Home"),
  referringFacilityName: z.string().nullable().optional().or(z.literal("")),
  nextOfKin: z
    .array(
      z.object({
        firstName: optionalResidentName("Contact first name"),
        middleName: optionalResidentName("Contact middle name"),
        lastName: optionalResidentName("Contact last name"),
        name: z.string().optional().or(z.literal("")),
        relation: z.string().optional().or(z.literal("")),
        relationship: z.string().optional().or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
        emailAddress: z.string().optional().or(z.literal("")),
      }),
    )
    .optional(),
});
export type AdmitStep1DTO = z.infer<typeof AdmitStep1Schema>;

export const UpdateResidentFundingSchema = z.object({
  fundingType: z.string().trim().min(1, "Funding type is required"),
  localAuthority: z.string().trim().optional().default(""),
  payer: z.string().trim().optional().default(""),
  secondaryCoverage: z.string().nullable().optional().or(z.literal("")),
  insurancePolicyNumber: z.string().nullable().optional().or(z.literal("")),
  benefitId: z.string().nullable().optional().or(z.literal("")),
  billingResponsibleParty: z
    .object({
      name: z.string().optional().or(z.literal("")),
      relationship: z.string().optional().or(z.literal("")),
      phone: z.string().optional().or(z.literal("")),
      address: z.string().optional().or(z.literal("")),
    })
    .optional(),
  agreedRoomRate: z.number().nonnegative().optional(),
  agreedRoomRatePeriod: z.enum(["Day", "Month", "Week"]).optional(),
  depositAmount: z.number().nonnegative().optional(),
  depositDate: z.string().nullable().optional().or(z.literal("")),
  paymentSchedule: z.string().optional(),
  directDebitDetails: z.string().nullable().optional().or(z.literal("")),
});
export type UpdateResidentFundingDTO = z.infer<typeof UpdateResidentFundingSchema>;

// Step 3: Medical History & Baseline Medications
export const CurrentMedicationItemSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dose: z.string().min(1, "Dose is required"),
  frequency: z.string().min(1, "Frequency is required"),
  route: z.string().default("Oral"),
  prescribingDoctor: z.string().optional(),
});

const optionalVitalNumber = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? Number(trimmed) : undefined;
  },
  z.number().nullable().optional(),
);

const isEmptyMedicationDraft = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const medication = value as Record<string, unknown>;
  return ["name", "dose", "frequency", "prescribingDoctor"].every((key) => {
    const field = medication[key];
    return (
      field === undefined ||
      field === null ||
      (typeof field === "string" && field.trim() === "")
    );
  });
};

export const AdmitStep3Schema = z.object({
  primaryDiagnosis: z.string().optional().or(z.literal("")),
  secondaryDiagnoses: z.array(z.string()).default([]),
  heightCm: z.number().nullable().optional(),
  weightKg: z.number().nullable().optional(),
  bmi: z.number().nullable().optional(),
  baselineVitals: z.object({
    bp: z.string().nullable().optional(),
    pulse: optionalVitalNumber,
    temp: optionalVitalNumber,
    respiratoryRate: optionalVitalNumber,
    spO2: optionalVitalNumber,
  }).optional(),
  medicationAllergies: z.array(z.string()).default([]),
  foodAllergies: z.array(z.string()).default([]),
  environmentalAllergies: z.array(z.string()).default([]),
  currentMedications: z.preprocess(
    (medications) =>
      Array.isArray(medications)
        ? medications.filter((medication) => !isEmptyMedicationDraft(medication))
        : medications,
    z.array(CurrentMedicationItemSchema.partial()).default([]),
  ),
  chronicConditions: z.array(z.string()).default([]),
  pastSurgeries: z.string().nullable().optional(),
  immunizationHistory: z.string().nullable().optional(),
  skinConditionPressureAreas: z.string().nullable().optional(),
  continenceStatus: z.enum(["Continent", "Incontinent bowel/bladder"]).or(z.string()).default("Continent"),
  sensoryAids: z.string().nullable().optional(),
  dentalStatus: z.string().nullable().optional(),
  substanceUseHistory: z.string().nullable().optional(),
  recentHospitalizations: z.string().nullable().optional(),
});
export type AdmitStep3DTO = z.infer<typeof AdmitStep3Schema>;

export const AdmitConfirmSchema = z.object({
  bedId: z.string().nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional().or(z.literal("")),
});
export type AdmitConfirmDTO = z.infer<typeof AdmitConfirmSchema>;

export type DischargeResidentDTO = z.infer<typeof DischargeResidentSchema>;
export type CarePlanDTO = z.infer<typeof CarePlanSchema>;
export type SaveDocumentDTO = z.infer<typeof SaveDocumentSchema>;
export type VerifyDocumentDTO = z.infer<typeof VerifyDocumentSchema>;

export const ResidentMetricsSchema = z.object({
  total: z.number(),
  active: z.number(),
  newAdmissions: z.number(),
  discharges: z.number(),
  avgAge: z.number(),
  branchCount: z.number(),
});

export const ResidentInsightsSchema = z.object({
  reviewsDue: z.number(),
  residentsWithAlerts: z.number(),
  recentDocumentsCount: z.number(),
  careTypeBreakdown: z.array(
    z.object({
      type: z.string(),
      count: z.number(),
    }),
  ),
});

export type ResidentMetricsDTO = z.infer<typeof ResidentMetricsSchema>;
export type ResidentInsightsDTO = z.infer<typeof ResidentInsightsSchema>;

export const CreateCareNoteSchema = z.object({
  category: z.string().default("General"),
  content: z.string().min(1, "Note content is required"),
});
export type CreateCareNoteDTO = z.infer<typeof CreateCareNoteSchema>;

export const AssignCarerSchema = z.object({
  carerId: z.string().min(1, "Carer ID is required"),
});
export type AssignCarerDTO = z.infer<typeof AssignCarerSchema>;

export const AssignBedSchema = z.object({
  bedId: z.string().min(1, "Bed ID is required"),
});
export type AssignBedDTO = z.infer<typeof AssignBedSchema>;

export const UpdateCareNoteSchema = z.object({
  category: z.string().optional(),
  content: z.string().min(1, "Note content is required"),
});
export type UpdateCareNoteDTO = z.infer<typeof UpdateCareNoteSchema>;

export * from "./supported-living";


