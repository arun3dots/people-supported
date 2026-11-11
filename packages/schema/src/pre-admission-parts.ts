import { z } from "zod";
import { PreAdmissionAdlChecklistSchema } from "./pre-admission-adl";

export * from "./pre-admission-adl";

// Drafts are saved part by part, so every leaf is optional here.
// Submission-time required fields are enforced in pre-admission.ts.
const text = z.string().trim().nullable().optional();

export const PreAdmissionDocumentSchema = z.object({
  name: z.string().min(1),
  gcsPath: z.string().min(1),
  uploadedAt: z.string().optional(),
  verifiedAt: z.string().nullable().optional(),
  verifiedById: z.string().nullable().optional(),
});
export type PreAdmissionDocumentDTO = z.infer<typeof PreAdmissionDocumentSchema>;

export const SUPPORT_LEVELS = ["I", "P", "1", "2", "F"] as const;
export const SupportLevelEnum = z.enum(SUPPORT_LEVELS);
export type SupportLevel = z.infer<typeof SupportLevelEnum>;

export const PRE_ADMISSION_CARE_TYPES = [
  "Residential Care",
  "Mental Health Care",
  "Dementia Care",
  "Respite Care",
  "Nursing Care",
] as const;

export const PRE_ADMISSION_CARE_LEVELS = ["High", "Medium", "Low"] as const;

const CARE_CATEGORY_LABELS: Record<string, string> = {
  residential: "Residential Care",
  "residential care": "Residential Care",
  "mental health": "Mental Health Care",
  "mental health care": "Mental Health Care",
  dementia: "Dementia Care",
  "dementia care": "Dementia Care",
  respite: "Respite Care",
  "respite care": "Respite Care",
  nursing: "Nursing Care",
  "nursing care": "Nursing Care",
};

export function normalizePreAdmissionTypeOfCare(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  return CARE_CATEGORY_LABELS[trimmed.toLowerCase()] ?? trimmed;
}

// --- Part A: Admission and personal details ---
export const PreAdmissionPartASchema = z.object({
  photoUrl: text,
  firstName: text,
  middleName: text,
  lastName: text,
  preferredName: text,
  dob: text,
  gender: text,
  maritalStatus: text,
  nhsNumber: text,
  nationalId: text,
  nationalIdType: text,
  stayType: z.enum(["Permanent", "Respite", "Short-term"]).nullable().optional(),
  typeOfCare: text,
  careLevel: z.enum(PRE_ADMISSION_CARE_LEVELS).nullable().optional(),
  admittedFrom: text,
  referringFacilityName: text,
  admissionReason: text,
  expectedAdmissionDate: text,
  language: text,
  languagesSpoken: z.array(z.string()).default([]),
  interpreterRequired: z.boolean().default(false),
  religion: text,
  formerOccupation: text,
  residentView: text,
  previousAddress: text,
  documents: z.array(PreAdmissionDocumentSchema).default([]),
});
export type PreAdmissionPartADTO = z.infer<typeof PreAdmissionPartASchema>;

/** Converts pre-admission JSON saved before Type of Care and Level of Care were split. */
export function normalizePreAdmissionPartA(value: unknown): PreAdmissionPartADTO {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const oldCareLevel =
    typeof raw.careLevel === "string" ? raw.careLevel : null;
  const isCurrentCareLevel = PRE_ADMISSION_CARE_LEVELS.some(
    (level) => level === oldCareLevel,
  );
  const legacyTypeOfCare =
    raw.typeOfCare ?? (!isCurrentCareLevel ? oldCareLevel : null);

  return PreAdmissionPartASchema.parse({
    ...raw,
    typeOfCare: normalizePreAdmissionTypeOfCare(legacyTypeOfCare),
    careLevel: isCurrentCareLevel ? oldCareLevel : null,
  });
}

// --- Part B: Contacts and legal authority ---
export const PreAdmissionContactSchema = z.object({
  name: z.string().min(1),
  relationship: text,
  phone: text,
  email: text,
  availabilityNote: text,
});

export const LPA_TYPES = ["Health & Welfare", "Property & Finance"] as const;
export const PreAdmissionLpaSchema = z.object({
  type: z.enum(LPA_TYPES),
  holderName: z.string().min(1),
  holderPhone: text,
  registeredYear: z.number().int().min(1900).max(2200).nullable().optional(),
  copySeen: z.boolean().default(false),
  document: PreAdmissionDocumentSchema.nullable().optional(),
});

export const PreAdmissionPartBSchema = z.object({
  nextOfKin: z.array(PreAdmissionContactSchema).default([]),
  lpa: z.array(PreAdmissionLpaSchema).default([]),
  otherLegalAuthority: z
    .array(
      z.object({
        type: z.string().min(1),
        holderName: z.string().min(1),
        document: PreAdmissionDocumentSchema.nullable().optional(),
      }),
    )
    .default([]),
  socialWorker: PreAdmissionContactSchema.extend({ organisation: text })
    .nullable()
    .optional(),
  gp: z
    .object({ name: text, practice: text, phone: text })
    .nullable()
    .optional(),
  otherProviders: z
    .array(z.object({ type: z.string(), name: text, clinic: text, phone: text }))
    .default([]),
});
export type PreAdmissionPartBDTO = z.infer<typeof PreAdmissionPartBSchema>;

// --- Part C: Health and medicines ---
export const PreAdmissionAllergySchema = z.object({
  substance: z.string().min(1),
  reaction: text,
  severity: z.enum(["Mild", "Moderate", "Severe"]).nullable().optional(),
});

export const PreAdmissionMedicineSchema = z.object({
  name: z.string().min(1),
  dose: text,
  frequency: text,
  route: text,
  form: text,
  timing: text,
  prn: z.boolean().default(false),
  prnMaxPerDay: z.number().int().positive().nullable().optional(),
  prescriber: text,
  instructions: text,
  imageUrls: z.array(z.string()).optional(),
  scheduleType: z.enum(["recurring", "single"]).optional(),
  startDate: text,
  endDate: text,
  times: z.array(z.string()).optional(),
  scheduledTime: text,
  allowLateAdministration: z.boolean().optional(),
  mandatoryObservations: z.array(z.string()).optional(),
});

export const PreAdmissionPartCSchema = z.object({
  primaryDiagnosis: text,
  secondaryDiagnoses: z.array(z.string()).default([]),
  medicalHistory: text,
  diagnoses: z.array(z.string()).default([]),
  allergies: z.array(PreAdmissionAllergySchema).default([]),
  noKnownAllergies: z.boolean().default(false),
  medicines: z.array(PreAdmissionMedicineSchema).default([]),
  pain: z
    .object({ summary: text, tool: text, score: z.number().nullable().optional() })
    .nullable()
    .optional(),
  heightCm: z.number().positive().nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
  baselineVitals: z.record(z.string()).nullable().optional(),
  recentHospitalisations: text,
  surgeries: text,
  immunisations: text,
});
export type PreAdmissionPartCDTO = z.infer<typeof PreAdmissionPartCSchema>;

export function normalizePreAdmissionPartC(value: unknown): PreAdmissionPartCDTO {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const rawDiagnoses = Array.isArray(raw.diagnoses)
    ? (raw.diagnoses as unknown[]).map((d) => String(d).trim()).filter(Boolean)
    : [];
  const primary =
    typeof raw.primaryDiagnosis === "string" && raw.primaryDiagnosis.trim()
      ? raw.primaryDiagnosis.trim()
      : rawDiagnoses[0] ?? null;
  const secondaries = Array.isArray(raw.secondaryDiagnoses)
    ? (raw.secondaryDiagnoses as unknown[]).map((d) => String(d).trim()).filter(Boolean)
    : rawDiagnoses.slice(1);
  const combined = [primary, ...secondaries].filter(Boolean) as string[];

  return PreAdmissionPartCSchema.parse({
    ...raw,
    primaryDiagnosis: primary,
    secondaryDiagnoses: secondaries,
    diagnoses: combined.length > 0 ? combined : rawDiagnoses,
  });
}

// --- Part D: Care needs and risks ---
export const PreAdmissionNeedAreaSchema = z.object({
  summary: text,
  supportLevel: SupportLevelEnum.nullable().optional(),
});

export const PRE_ADMISSION_NEED_AREAS = [
  "mobility",
  "falls",
  "eating",
  "continence",
  "skin",
  "senses",
] as const;

export const PreAdmissionPartDSchema = z.object({
  adlChecklist: PreAdmissionAdlChecklistSchema,
  areas: z
    .record(z.enum(PRE_ADMISSION_NEED_AREAS), PreAdmissionNeedAreaSchema)
    .default({}),
  mobilityAids: z.array(z.string()).default([]),
  fallsLast6Months: z
    .union([z.number().int().min(0), z.string()])
    .nullable()
    .optional(),
  fallsRiskLevel: z.enum(["Low", "Medium", "High"]).nullable().optional(),
  ambulationDistance: text,
  iddsiLevel: text,
  fluidConsistency: text,
  dietType: text,
  feedingAssistanceNeed: text,
  swallowingConcerns: text,
  cognitiveScore: text,
  orientation: text,
  communicationAbility: text,
  cognition: text,
  behaviouralConcerns: text,
  behavioralConcerns: text,
  sleepPattern: text,
  familyInvolvement: text,
  routinePreferences: text,
  assistiveDevices: z.array(z.string()).default([]),
});
export type PreAdmissionPartDDTO = z.infer<typeof PreAdmissionPartDSchema>;

// --- Part E: Capacity, consent, DoLS ---
export const PreAdmissionPartESchema = z.object({
  moveDecision: z
    .object({
      hasCapacity: z.boolean().nullable().optional(),
      assessedAt: text,
      assessedByName: text,
      summary: text,
      bestInterests: z
        .object({
          decidedAt: text,
          decisionMaker: text,
          consulted: z.array(z.object({ name: z.string(), relationship: text })).default([]),
          rationale: text,
        })
        .nullable()
        .optional(),
      mentalCapacityAssessmentId: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  wishes: text,
  consents: z
    .array(
      z.object({
        name: z.string().min(1),
        given: z.boolean().default(false),
        dateSigned: text,
        document: PreAdmissionDocumentSchema.nullable().optional(),
      }),
    )
    .default([]),
  dolsScreen: z
    .object({
      outcome: z.enum(["NoApplication", "ApplicationNeeded", "Applied", "Authorised"]).nullable().optional(),
      rationale: text,
      rescreenTrigger: text,
      screenedAt: text,
      dolsAuthorizationId: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type PreAdmissionPartEDTO = z.infer<typeof PreAdmissionPartESchema>;

// --- Part F: Advance care planning ---
export const PreAdmissionPartFSchema = z.object({
  dnacpr: z
    .object({
      status: z.enum(["NotDiscussed", "InPlace", "NotInPlace", "Declined"]).default("NotDiscussed"),
      decidedAt: text,
      document: PreAdmissionDocumentSchema.nullable().optional(),
    })
    .default({ status: "NotDiscussed" }),
  respect: z
    .object({ inPlace: z.boolean().default(false), document: PreAdmissionDocumentSchema.nullable().optional() })
    .default({ inPlace: false }),
  livingWill: z.boolean().nullable().optional(),
  plan: text,
  planOwner: text,
  planTargetDate: text,
});
export type PreAdmissionPartFDTO = z.infer<typeof PreAdmissionPartFSchema>;

// --- Part G: About me ---
export const PreAdmissionPartGSchema = z.object({
  loves: text,
  dislikes: text,
  routine: z
    .object({ wakeTime: text, bedTime: text, bedtimeNotes: text })
    .nullable()
    .optional(),
  bathing: z
    .object({ preference: text, days: z.array(z.string()).default([]), carerGender: text })
    .nullable()
    .optional(),
  worries: text,
  whatHelps: text,
  personalCareNotes: text,
  importantPeople: z.array(z.object({ name: z.string(), note: text })).default([]),
});
export type PreAdmissionPartGDTO = z.infer<typeof PreAdmissionPartGSchema>;
