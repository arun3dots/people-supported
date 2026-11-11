import { z } from "zod";
import { paginationQuerySchema } from "./common/pagination";

// --- Enums & Value Sets ---

export const CarePlanStatusEnum = z.enum([
  "Draft",
  "PendingPrimaryApproval",
  "PendingSecondaryApproval",
  "ChangesRequested",
  "Rejected",
  "Active",
  "Expired",
  "Superseded",
  "draft",
  "pending_primary_approval",
  "pending_secondary_approval",
  "changes_requested",
  "rejected",
  "active",
  "expired",
  "superseded",
]);
export type CarePlanStatus = z.infer<typeof CarePlanStatusEnum>;

export const GoalCategoryEnum = z.enum([
  "Mobility",
  "Nutrition",
  "Medication",
  "Hygiene",
  "MentalHealth",
  "Social",
  "Clinical",
  "Personal Care",
  "Other",
  "mobility",
  "nutrition",
  "medication",
  "hygiene",
  "mental_health",
  "social",
  "other",
]);
export type GoalCategory = z.infer<typeof GoalCategoryEnum>;

export const GoalReviewFrequencyEnum = z.enum([
  "Daily",
  "Weekly",
  "Monthly",
  "daily",
  "weekly",
  "monthly",
]);
export type GoalReviewFrequency = z.infer<typeof GoalReviewFrequencyEnum>;

export const GoalStatusEnum = z.enum([
  "Active",
  "Achieved",
  "Retired",
  "active",
  "achieved",
  "retired",
]);
export type GoalStatus = z.infer<typeof GoalStatusEnum>;

export const RenewalReasonEnum = z.enum([
  "ScheduledReview",
  "ConditionChange",
  "PostIncident",
  "Other",
  "scheduled_review",
  "condition_change",
  "post_incident",
  "other",
]);
export type RenewalReason = z.infer<typeof RenewalReasonEnum>;

export const TaskFrequencyEnum = z.enum([
  "Daily",
  "Weekly",
  "Twice Daily",
  "Custom",
  "Alternate Days",
  "daily",
  "weekly",
  "twice_daily",
  "custom",
  "alternate_days",
]);
export type TaskFrequency = z.infer<typeof TaskFrequencyEnum>;

export const TaskOccurrenceStatusEnum = z.enum([
  "Pending",
  "InProgress",
  "Completed",
  "Skipped",
  "Missed",
  "pending",
  "in_progress",
  "completed",
  "skipped",
  "missed",
]);
export type TaskOccurrenceStatus = z.infer<typeof TaskOccurrenceStatusEnum>;

export const ApprovalRoleEnum = z.enum([
  "Primary",
  "Secondary",
  "primary",
  "secondary",
  "Manager",
  "ClinicalLead",
  "Doctor",
  "manager",
  "clinical_lead",
  "doctor",
]);
export type ApprovalRole = z.infer<typeof ApprovalRoleEnum>;

export const CarePlanAuthorRoleEnum = z.enum([
  "SeniorCarer",
  "RegisteredNurse",
  "DeputyManager",
  "RegisteredManager",
  "Other",
  "senior_carer",
  "registered_nurse",
  "deputy_manager",
  "registered_manager",
  "other",
]);
export type CarePlanAuthorRole = z.infer<typeof CarePlanAuthorRoleEnum>;

export const LegalConsentBasisEnum = z.enum([
  "ResidentSelf",
  "LPA_HealthAndWelfare",
  "CourtOfProtection",
  "BestInterests_Section4",
  "resident_self",
  "lpa_health_and_welfare",
  "court_of_protection",
  "best_interests_section_4",
]);
export type LegalConsentBasis = z.infer<typeof LegalConsentBasisEnum>;

export const ApprovalDecisionEnum = z.enum([
  "Pending",
  "Approved",
  "Rejected",
  "ChangesRequested",
  "pending",
  "approved",
  "rejected",
  "changes_requested",
]);
export type ApprovalDecision = z.infer<typeof ApprovalDecisionEnum>;

export const TaskPriorityEnum = z.enum([
  "Low",
  "Medium",
  "High",
  "Critical",
  "low",
  "medium",
  "high",
  "critical",
]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

// --- Goal Schemas ---

export const CarePlanGoalSchema = z.object({
  id: z.string().optional(),
  carePlanId: z.string().optional(),
  originGoalId: z.string().nullable().optional(),
  title: z.string().min(1, "Goal title is required"),
  targetDescription: z.string().min(1, "Target description is required"),
  whyItMattersToResident: z.string().nullable().optional(),
  category: GoalCategoryEnum.default("Mobility"),
  reviewFrequency: GoalReviewFrequencyEnum.default("Weekly"),
  progressPercent: z.number().int().min(0).max(100).default(0),
  status: GoalStatusEnum.default("Active"),
  retirementReason: z.string().nullable().optional(),
  nextReviewDate: z.string().or(z.date()).nullable().optional(),
});
export type CarePlanGoalDTO = z.infer<typeof CarePlanGoalSchema>;

export const CreateCarePlanGoalSchema = CarePlanGoalSchema.omit({
  id: true,
  carePlanId: true,
}).partial({
  category: true,
  reviewFrequency: true,
  progressPercent: true,
  status: true,
  retirementReason: true,
  nextReviewDate: true,
  originGoalId: true,
});
export type CreateCarePlanGoalDTO = z.infer<typeof CreateCarePlanGoalSchema>;

export const UpdateCarePlanGoalSchema = CarePlanGoalSchema.partial();
export type UpdateCarePlanGoalDTO = z.infer<typeof UpdateCarePlanGoalSchema>;

// --- Care Plan Task Schemas ---

export const CarePlanTaskSchema = z.object({
  id: z.string().optional(),
  residentId: z.string().optional(),
  carePlanId: z.string().optional(),
  goalId: z.string().nullable().optional(),
  originTaskId: z.string().nullable().optional(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  precautions: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  frequency: TaskFrequencyEnum.default("Daily"),
  timeOfDay: z.array(z.string()).min(1, "At least one time of day is required"),
  targetTime: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  assignedGroupId: z.string().nullable().optional(),
  assignedStaffId: z.string().nullable().optional(),
  requirePhotoOrNote: z.boolean().default(false),
  escalateIfSkipped: z.boolean().default(false),
  status: z.enum(["Active", "Retired"]).default("Active"),
  isActive: z.boolean().default(true),
});
export type CarePlanTaskDTO = z.infer<typeof CarePlanTaskSchema>;

export const CreateCarePlanTaskSchema = CarePlanTaskSchema.omit({
  id: true,
  carePlanId: true,
}).partial({
  residentId: true,
  frequency: true,
  targetTime: true,
  priority: true,
  requirePhotoOrNote: true,
  escalateIfSkipped: true,
  status: true,
  isActive: true,
  originTaskId: true,
});
export type CreateCarePlanTaskDTO = z.infer<typeof CreateCarePlanTaskSchema>;

export const UpdateCarePlanTaskSchema = CarePlanTaskSchema.partial();
export type UpdateCarePlanTaskDTO = z.infer<typeof UpdateCarePlanTaskSchema>;

// --- Daily Task Occurrence Schemas ---

export const DailyTaskSchema = z.object({
  id: z.string(),
  residentId: z.string(),
  carePlanTaskId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  precautions: z.string().optional(),
  category: z.string(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  status: TaskOccurrenceStatusEnum,
  scheduledDate: z.date().or(z.string()),
  timeSlot: z.string().optional(),
  targetTime: z.string().optional(),
  assignedStaffId: z.string().nullable().optional(),
  completedAt: z.date().or(z.string()).nullable().optional(),
  completedById: z.string().nullable().optional(),
  skipReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
});
export type DailyTaskDTO = z.infer<typeof DailyTaskSchema>;

export const UpdateDailyTaskStatusSchema = z.object({
  status: z.enum(["Pending", "InProgress", "Completed", "Skipped", "Missed"]),
  notes: z.string().optional(),
  skipReason: z.string().optional(),
  photoUrl: z.string().optional(),
});
export type UpdateDailyTaskStatusDTO = z.infer<typeof UpdateDailyTaskStatusSchema>;

// --- Care Plan Master & Wizard Schemas ---

export const CarePlanMasterSchema = z.object({
  id: z.string().optional(),
  residentId: z.string().min(1, "Resident ID is required"),
  versionNumber: z.number().int().default(1),
  status: CarePlanStatusEnum.default("Draft"),
  parentVersionId: z.string().nullable().optional(),
  renewalReason: RenewalReasonEnum.nullable().optional(),
  validFrom: z.string().or(z.date()),
  validTo: z.string().or(z.date()),
  nextReviewDate: z.string().or(z.date()).nullable().optional(),
  description: z.string().optional(),
  primaryDoctorId: z.string().nullable().optional(),
  secondaryDoctorId: z.string().nullable().optional(),
  authorRole: CarePlanAuthorRoleEnum.default("SeniorCarer").optional(),
  clinicalApproverId: z.string().nullable().optional(),
  managerApproverId: z.string().nullable().optional(),
  residentAgreed: z.boolean().default(true).optional(),
  residentAgreementNotes: z.string().nullable().optional(),
  representativeName: z.string().nullable().optional(),
  representativeRelationship: z.string().nullable().optional(),
  legalConsentBasis: LegalConsentBasisEnum.default("ResidentSelf").optional(),
  lastReviewedAt: z.string().or(z.date()).nullable().optional(),
  departments: z.array(z.string()).default([]),
  doctorsInvolved: z.array(z.string()).default([]),
  goals: z.array(CarePlanGoalSchema).optional(),
  tasks: z.array(CarePlanTaskSchema).optional(),
});
export type CarePlanMasterDTO = z.infer<typeof CarePlanMasterSchema>;

export const CreateCarePlanWizardSchema = z.object({
  residentId: z.string().min(1, "Resident ID is required"),
  validFrom: z.string().or(z.date()),
  validTo: z.string().or(z.date()),
  nextReviewDate: z.string().or(z.date()).optional(),
  description: z.string().optional(),
  primaryDoctorId: z.string().nullable().optional(),
  secondaryDoctorId: z.string().nullable().optional(),
  authorRole: CarePlanAuthorRoleEnum.default("SeniorCarer").optional(),
  clinicalApproverId: z.string().nullable().optional(),
  managerApproverId: z.string().nullable().optional(),
  residentAgreed: z.boolean().default(true).optional(),
  residentAgreementNotes: z.string().optional(),
  representativeName: z.string().optional(),
  representativeRelationship: z.string().optional(),
  legalConsentBasis: LegalConsentBasisEnum.default("ResidentSelf").optional(),
  departments: z.array(z.string()).default([]),
  goals: z.array(CreateCarePlanGoalSchema).min(1, "At least one goal is required"),
  tasks: z.array(CreateCarePlanTaskSchema).min(1, "At least one daily task is required"),
});
export type CreateCarePlanWizardDTO = z.infer<typeof CreateCarePlanWizardSchema>;

export const UpdateCarePlanDraftSchema = z.object({
  validFrom: z.string().or(z.date()).optional(),
  validTo: z.string().or(z.date()).optional(),
  nextReviewDate: z.string().or(z.date()).optional(),
  description: z.string().optional(),
  primaryDoctorId: z.string().nullable().optional(),
  secondaryDoctorId: z.string().nullable().optional(),
  authorRole: CarePlanAuthorRoleEnum.optional(),
  clinicalApproverId: z.string().nullable().optional(),
  managerApproverId: z.string().nullable().optional(),
  residentAgreed: z.boolean().optional(),
  residentAgreementNotes: z.string().nullable().optional(),
  representativeName: z.string().nullable().optional(),
  representativeRelationship: z.string().nullable().optional(),
  legalConsentBasis: LegalConsentBasisEnum.optional(),
  lastReviewedAt: z.string().or(z.date()).nullable().optional(),
  departments: z.array(z.string()).or(z.string()).optional(),
  doctorsInvolved: z.array(z.string()).or(z.string()).optional(),
  status: CarePlanStatusEnum.optional(),
  approvedById: z.string().nullable().optional(),
  secondaryApprovedById: z.string().nullable().optional(),
});
export type UpdateCarePlanDraftDTO = z.infer<typeof UpdateCarePlanDraftSchema>;
export const UpdateCarePlanMasterSchema = UpdateCarePlanDraftSchema;
export type UpdateCarePlanMasterDTO = z.infer<typeof UpdateCarePlanMasterSchema>;

export const RenewCarePlanSchema = z.object({
  renewalReason: RenewalReasonEnum,
  validFrom: z.string().or(z.date()),
  validTo: z.string().or(z.date()),
  description: z.string().optional(),
  primaryDoctorId: z.string().nullable().optional(),
  secondaryDoctorId: z.string().nullable().optional(),
  authorRole: CarePlanAuthorRoleEnum.optional(),
  clinicalApproverId: z.string().nullable().optional(),
  managerApproverId: z.string().nullable().optional(),
  residentAgreed: z.boolean().optional(),
  residentAgreementNotes: z.string().optional(),
  representativeName: z.string().optional(),
  representativeRelationship: z.string().optional(),
  legalConsentBasis: LegalConsentBasisEnum.optional(),
  departments: z.array(z.string()).optional(),
  goals: z.array(
    CreateCarePlanGoalSchema.extend({
      id: z.string().optional(),
      originGoalId: z.string().nullable().optional(),
      diffTag: z.enum(["CarriedOver", "Changed", "New", "Retired"]).optional(),
    })
  ).min(1, "At least one active goal is required"),
  tasks: z.array(
    CreateCarePlanTaskSchema.extend({
      id: z.string().optional(),
      originTaskId: z.string().nullable().optional(),
      diffTag: z.enum(["CarriedOver", "Changed", "New", "Removed"]).optional(),
    })
  ).min(1, "At least one active task is required"),
});
export type RenewCarePlanDTO = z.infer<typeof RenewCarePlanSchema>;

// --- Approval & Decision Schemas ---

export const DecideCarePlanApprovalSchema = z.object({
  decision: z.enum(["Approved", "Rejected", "ChangesRequested"]),
  comments: z.string().optional(),
});
export type DecideCarePlanApprovalDTO = z.infer<typeof DecideCarePlanApprovalSchema>;

export const CarePlanApprovalResponseSchema = z.object({
  id: z.string(),
  carePlanId: z.string(),
  approverId: z.string(),
  approverName: z.string().optional(),
  role: ApprovalRoleEnum,
  decision: ApprovalDecisionEnum,
  comments: z.string().nullable().optional(),
  decidedAt: z.date().or(z.string()).nullable().optional(),
});
export type CarePlanApprovalResponseDTO = z.infer<typeof CarePlanApprovalResponseSchema>;

// --- Version Diff Schemas ---

export const ItemDiffSchema = z.object({
  id: z.string(),
  originId: z.string().nullable().optional(),
  title: z.string(),
  category: z.string(),
  diffTag: z.enum(["CarriedOver", "Changed", "New", "Retired", "Removed"]),
  details: z.string().optional(),
  fieldChanges: z.record(z.object({ before: z.unknown(), after: z.unknown() })).optional(),
});
export type ItemDiffDTO = z.infer<typeof ItemDiffSchema>;

export const CarePlanDiffResponseSchema = z.object({
  sourcePlanId: z.string(),
  sourceVersionNumber: z.number(),
  targetPlanId: z.string(),
  targetVersionNumber: z.number(),
  summary: z.object({
    carriedOverCount: z.number(),
    changedCount: z.number(),
    newCount: z.number(),
    retiredCount: z.number(),
    removedCount: z.number(),
    humanSummary: z.string(),
  }),
  headerDiffs: z.record(z.object({ before: z.unknown(), after: z.unknown() })),
  goalDiffs: z.array(ItemDiffSchema),
  taskDiffs: z.array(ItemDiffSchema),
});
export type CarePlanDiffResponseDTO = z.infer<typeof CarePlanDiffResponseSchema>;

// --- Care Plan List Query Schema ---
// page/limit/search/sortOrder/all come from paginationQuerySchema
export const carePlanListQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  department: z.string().optional(),
  doctorId: z.string().optional(),
  expiringWithinDays: z.coerce.number().int().positive().optional(),
  /**
   * Restrict to one branch. Honoured only for tenant-wide callers; a
   * branch-assigned user is pinned to their JWT branch by the controller.
   */
  branchId: z.string().optional(),
  sortBy: z.enum(["updatedAt", "versionNumber", "createdAt"]).default("updatedAt"),
});

export type CarePlanListQueryDTO = z.infer<typeof carePlanListQuerySchema>;
export type CarePlanListQueryInput = z.input<typeof carePlanListQuerySchema>;

// --- Care Plan Metrics Schema ---
export const CarePlanMetricsSchema = z.object({
  totalPlans: z.number().int().nonnegative(),
  activeCount: z.number().int().nonnegative(),
  pendingApprovalCount: z.number().int().nonnegative(),
  expiringSoonCount: z.number().int().nonnegative(),
});

export type CarePlanMetricsDTO = z.infer<typeof CarePlanMetricsSchema>;

// --- Person-Centred Care Plan Section Schemas ---
export const CarePlanSectionSchema = z.object({
  id: z.string().optional(),
  carePlanId: z.string().optional(),
  sectionName: z.string().min(1, "Section name is required"),
  content: z.string().default(""),
  sectionData: z.record(z.string(), z.unknown()).nullable().optional(),
  authorId: z.string().optional(),
  version: z.number().int().default(1),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});
export type CarePlanSectionDTO = z.infer<typeof CarePlanSectionSchema>;

export const UpdateCarePlanSectionSchema = z.object({
  content: z.string().optional(),
  sectionData: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateCarePlanSectionDTO = z.infer<typeof UpdateCarePlanSectionSchema>;

// --- Aggregated Care Plan Data for PDF Export ---
export const DetailedCarePlanExportSchema = z.object({
  plan: z.object({
    id: z.string(),
    versionNumber: z.number(),
    status: z.string(),
    validFrom: z.date().or(z.string()),
    validTo: z.date().or(z.string()).nullable().optional(),
    nextReviewDate: z.date().or(z.string()).nullable().optional(),
    description: z.string().nullable().optional(),
    authorRole: z.string().nullable().optional(),
    legalConsentBasis: z.string().nullable().optional(),
    residentAgreed: z.boolean().optional(),
    residentAgreementNotes: z.string().nullable().optional(),
    representativeName: z.string().nullable().optional(),
    representativeRelationship: z.string().nullable().optional(),
  }),
  resident: z.object({
    id: z.string(),
    fullName: z.string(),
    preferredName: z.string().nullable().optional(),
    dob: z.string().nullable().optional(),
    age: z.number().optional(),
    nhsNumber: z.string().nullable().optional(),
    roomNumber: z.string().nullable().optional(),
    wingName: z.string().nullable().optional(),
    admissionDate: z.date().or(z.string()).nullable().optional(),
    fundingType: z.string().nullable().optional(),
    isSelfFunder: z.boolean().optional(),
    gpName: z.string().nullable().optional(),
    gpPractice: z.string().nullable().optional(),
    nextOfKinName: z.string().nullable().optional(),
    nextOfKinRelation: z.string().nullable().optional(),
    nextOfKinContact: z.string().nullable().optional(),
    lpaStatus: z.string().nullable().optional(),
    religion: z.string().nullable().optional(),
    dnarStatus: z.boolean().optional(),
  }),
  sections: z.array(CarePlanSectionSchema),
  riskSummary: z.array(
    z.object({
      riskArea: z.string(),
      level: z.string(),
      assessmentRef: z.string(),
      lastReviewed: z.string().optional(),
      nextDue: z.string().optional(),
    })
  ),
  goals: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      whyItMattersToResident: z.string().nullable().optional(),
      targetDescription: z.string(),
      category: z.string(),
      reviewFrequency: z.string(),
      nextReviewDate: z.string().nullable().optional(),
      status: z.string(),
    })
  ),
  tasks: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      category: z.string(),
      frequency: z.string(),
      timeOfDay: z.array(z.string()),
      instructions: z.string().nullable().optional(),
      precautions: z.string().nullable().optional(),
      priority: z.string(),
    })
  ),
  medications: z.array(
    z.object({
      drugName: z.string(),
      dose: z.string(),
      frequency: z.string(),
      instructions: z.string().nullable().optional(),
      timeOfDay: z.array(z.string()),
    })
  ),
  reviews: z.array(
    z.object({
      id: z.string(),
      reviewedAt: z.date().or(z.string()),
      reviewerName: z.string().optional(),
      decision: z.string(),
      summaryNotes: z.string(),
      residentFeedback: z.string().nullable().optional(),
      familyFeedback: z.string().nullable().optional(),
    })
  ),
});
export type DetailedCarePlanExportDTO = z.infer<typeof DetailedCarePlanExportSchema>;

