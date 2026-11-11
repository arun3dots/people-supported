import { z } from "zod";
import { paginationQuerySchema } from "./common/pagination";

const nameRegex = /^[a-zA-Z\s'-]+$/;
const phoneRegex = /^[+\d\s()-]{7,20}$/;

export const CreateEnquiryStage1Schema = z.object({
  // Optional: branch-assigned callers get branchId from their JWT
  // (req.user.activeBranchId); only tenant-wide callers with no active
  // branch need to supply it explicitly here.
  branchId: z.string().uuid("Invalid branch selected").optional(),
  enquirerName: z
    .string()
    .min(1, "Enquirer name is required")
    .max(80, "Name must be 80 characters or fewer")
    .regex(nameRegex, "Name must contain only letters, spaces, hyphens, or apostrophes"),
  enquirerRelationship: z.string().min(1, "Relationship is required"),
  enquirerPhone: z
    .string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Enter a valid phone number (digits, +, spaces, or hyphens only)"),
  enquirerEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or fewer")
    .regex(nameRegex, "First name must contain only letters, spaces, hyphens, or apostrophes"),
  middleName: z
    .string()
    .max(50, "Middle name must be 50 characters or fewer")
    .regex(nameRegex, "Middle name must contain only letters, spaces, hyphens, or apostrophes")
    .optional()
    .or(z.literal(""))
    .nullable(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or fewer")
    .regex(nameRegex, "Last name must contain only letters, spaces, hyphens, or apostrophes"),
  dob: z.string().or(z.date()).nullable().optional(),
  currentLocation: z.string().min(1, "Current location is required"),
  careCategory: z.string().min(1, "Care category is required"),
  contactPreference: z.enum(["Email", "Phone", "SMS", "DoNotContact"]).optional(),
  isDraft: z.boolean().optional(),
});

export type CreateEnquiryStage1DTO = z.infer<typeof CreateEnquiryStage1Schema>;

export const optOutEnquirySchema = z.object({
  reason: z.string().trim().min(3, "Reason for marketing opt-out is required").max(300),
});

export type OptOutEnquiryDTO = z.infer<typeof optOutEnquirySchema>;

export const CreateEnquiryDraftSchema = z.object({
  branchId: z.string().uuid("Invalid branch selected").optional(),
  isDraft: z.literal(true),
  enquirerName: z.string().max(80).optional(),
  enquirerRelationship: z.string().optional(),
  enquirerPhone: z.string().max(20).optional(),
  enquirerEmail: z.string().optional(),
  firstName: z.string().max(50).optional(),
  middleName: z.string().max(50).optional().nullable(),
  lastName: z.string().max(50).optional(),
  dob: z.string().or(z.date()).nullable().optional(),
  currentLocation: z.string().optional(),
  careCategory: z.string().optional(),
});

export type CreateEnquiryDraftDTO = z.infer<typeof CreateEnquiryDraftSchema>;


// Custom Question Schema for Dynamic Assessment Questions
export const AssessmentCustomQuestionSchema = z.object({
  id: z.string(),
  section: z.string().optional(),
  questionText: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "radio", "checkbox", "select"]),
  options: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),
});

export type AssessmentCustomQuestionDTO = z.infer<
  typeof AssessmentCustomQuestionSchema
>;

// Comprehensive Pre-Admission Needs Assessment Form Schema
export const NeedsAssessmentDataSchema = z.object({
  // Header / Assessment Meta
  dateOfAssessment: z.string().optional(),
  assessorName: z.string().optional(),
  prospectFullName: z.string().optional(),
  dob: z
    .string()
    .optional()
    .refine((v) => {
      if (!v || v === "") return true;
      const parsed = new Date(v);
      if (isNaN(parsed.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsed < today;
    }, "Date of birth cannot be today or a future date"),
  currentLocation: z.string().optional(),
  assessmentReason: z
    .enum(["New Enquiry", "Readmission Assessment"])
    .or(z.string())
    .optional(),

  // Section 1: Mobility & Physical Dependency
  mobilityStatus: z.string().optional(),
  transferDependency: z.string().optional(),
  fallHistory: z.string().optional(), // "Yes" | "No"
  fallInjuriesNotes: z.string().optional(),

  // Section 2: Cognitive Status & Mental Health
  cognitiveDiagnoses: z.array(z.string()).optional(),
  orientationLevels: z.array(z.string()).optional(),
  riskBehaviors: z.array(z.string()).optional(),

  // Section 3: Nutrition, Hydration & Swallowing
  dietTexture: z.string().optional(),
  swallowingChokingSafety: z.string().optional(), // "Yes" | "No"
  fluidThickenersRequired: z.string().optional(), // "Yes" | "No"
  eatingAssistanceLevel: z.string().optional(),

  // Section 4: Personal Care, Hygiene & Continence
  bathingShoweringAssistance: z.string().optional(),
  bladderContinence: z.string().optional(),
  bowelContinence: z.string().optional(),
  skinIntegrityRisk: z.string().optional(), // "Yes" | "No"

  // Section 5: Medical, Medication & Clinical Oversight
  medicationAdminCapacity: z.string().optional(),
  specializedMedicalInterventions: z.array(z.string()).optional(),

  // Section 6: Assessor Outcome & Sign-Off
  finalAssessorDecision: z.enum(["APPROVED", "DECLINED"]).or(z.string()).optional(),
  recommendedCareAllocationLevel: z.string().optional(),
  recommendedRoomFeatures: z.string().optional(),
  assessorSignature: z.string().optional(),
  dateCompleted: z.string().optional(),

  // Dynamic / Custom Questions
  customQuestions: z.array(AssessmentCustomQuestionSchema).optional(),
});

export type NeedsAssessmentDataDTO = z.infer<typeof NeedsAssessmentDataSchema>;

export const UpdateEnquiryAssessmentSchema = z.object({
  enquirerName: z.string().optional(),
  enquirerRelationship: z.string().optional(),
  enquirerPhone: z.string().optional(),
  enquirerEmail: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional().or(z.literal("")).nullable(),
  lastName: z.string().optional(),
  dob: z.string().or(z.date()).nullable().optional(),
  currentLocation: z.string().optional(),
  careCategory: z.string().optional(),
  status: z
    .enum([
      "Draft",
      "Enquiry",
      "Assessment Pending",
      "Ready for Admission",
      "Admitted",
      "Closed",
    ])
    .optional(),
  medicalNeeds: z.string().nullable().optional(),
  dependencyLevel: z.string().nullable().optional(),
  mobilityNeeds: z.string().nullable().optional(),
  dietaryRequirements: z.string().nullable().optional(),
  riskNotes: z.string().nullable().optional(),
  assessmentData: NeedsAssessmentDataSchema.nullable().optional(),
  targetAdmissionDate: z.string().or(z.date()).nullable().optional(),
  preferredRoomType: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  convertedResidentId: z.string().nullable().optional(),
  admittedAt: z.string().or(z.date()).nullable().optional(),
});

export type UpdateEnquiryAssessmentDTO = z.infer<
  typeof UpdateEnquiryAssessmentSchema
>;

export const EnquiryResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  enquirerName: z.string(),
  enquirerRelationship: z.string(),
  enquirerPhone: z.string(),
  enquirerEmail: z.string().nullable(),
  firstName: z.string(),
  middleName: z.string().nullable().optional(),
  lastName: z.string(),
  dob: z.date().or(z.string()).nullable().optional(),
  currentLocation: z.string(),
  careCategory: z.string(),
  status: z.string(),
  medicalNeeds: z.string().nullable(),
  dependencyLevel: z.string().nullable(),
  mobilityNeeds: z.string().nullable(),
  dietaryRequirements: z.string().nullable(),
  riskNotes: z.string().nullable(),
  assessmentData: NeedsAssessmentDataSchema.nullable().optional(),
  assessmentCompletedAt: z.date().nullable().optional(),
  targetAdmissionDate: z.date().nullable().optional(),
  preferredRoomType: z.string().nullable(),
  notes: z.string().nullable(),
  // Admitted resident link — populated when convertedResidentId is set
  convertedResidentId: z.string().nullable(),
  admittedAt: z.date().nullable().optional(),
  convertedResident: z
    .object({
      id: z.string(),
      fullName: z.string(),
      status: z.string(),
    })
    .nullable()
    .optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type EnquiryResponseDTO = z.infer<typeof EnquiryResponseSchema>;

// Assessment Template Schemas
export const CreateAssessmentTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.string().default("Pre-Admission"),
  description: z.string().optional(),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      goal: z.string().optional(),
      questions: z.array(AssessmentCustomQuestionSchema),
    })
  ),
  isDefault: z.boolean().default(false),
});

export type CreateAssessmentTemplateDTO = z.infer<
  typeof CreateAssessmentTemplateSchema
>;

export const UpdateAssessmentTemplateSchema = CreateAssessmentTemplateSchema.partial();
export type UpdateAssessmentTemplateDTO = z.infer<
  typeof UpdateAssessmentTemplateSchema
>;

export const AssessmentTemplateResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  sections: z.unknown(),
  isDefault: z.boolean(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type AssessmentTemplateResponseDTO = z.infer<
  typeof AssessmentTemplateResponseSchema
>;

// Enquiry KPI Metrics Schema
export const EnquiryMetricsSchema = z.object({
  totalEnquiries: z.number(),
  pendingAssessments: z.number(),
  readyForAdmission: z.number(),
  admittedCount: z.number(),
  pendingPercent: z.number().optional(),
  conversionPercent: z.number().optional(),
});

export type EnquiryMetricsDTO = z.infer<typeof EnquiryMetricsSchema>;

// Enquiry list query — page/limit/search/sortOrder come from paginationQuerySchema
export const enquiryListQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  careCategory: z.string().optional(),
  /**
   * Restrict to one branch. Honoured only for tenant-wide callers; a
   * branch-assigned user is pinned to their JWT branch by the controller.
   */
  branchId: z.string().optional(),
  sortBy: z.enum(["createdAt", "firstName", "lastName"]).default("createdAt"),
});

/** Parsed shape the service receives (defaults applied). */
export type EnquiryListQueryDTO = z.infer<typeof enquiryListQuerySchema>;
/** Partial shape the web hooks send. */
export type EnquiryListQueryInput = z.input<typeof enquiryListQuerySchema>;
