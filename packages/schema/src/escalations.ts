import { z } from "zod";

export const EscalationReasonEnum = z.enum([
  "AbnormalVitals",
  "RefusedMedication",
  "SkippedTask",
  "AcuteDeterioration",
  "Incident",
  "Fall",
  "Behavioural",
  "Other",
]);
export type EscalationReason = z.infer<typeof EscalationReasonEnum>;

export const EscalationSeverityEnum = z.enum([
  "Low",
  "Medium",
  "High",
  "Critical",
]);
export type EscalationSeverity = z.infer<typeof EscalationSeverityEnum>;

export const EscalationStatusEnum = z.enum([
  "Open",
  "Triaged",
  "ActionTaken",
  "EscalatedToGP",
  "EscalatedTo999",
  "EscalatedToManager",
  "Resolved",
]);
export type EscalationStatus = z.infer<typeof EscalationStatusEnum>;

export const TriageActionDecisionEnum = z.enum([
  "ResolveOnSite",
  "IncreaseMonitoring",
  "CallGP",
  "Call111",
  "Call999",
  "EscalateToManager",
]);
export type TriageActionDecision = z.infer<typeof TriageActionDecisionEnum>;

export const VitalsSnapshotSchema = z.object({
  bpSystolic: z.number().optional(),
  bpDiastolic: z.number().optional(),
  pulse: z.number().optional(),
  temp: z.number().optional(),
  spo2: z.number().optional(),
  respiration: z.number().optional(),
  bloodSugar: z.number().optional(),
  consciousness: z.string().optional(),
  news2Score: z.number().optional(),
});
export type VitalsSnapshot = z.infer<typeof VitalsSnapshotSchema>;

export const CreateClinicalEscalationSchema = z.object({
  branchId: z.string().uuid().optional(),
  residentId: z.string().uuid({ message: "Resident ID is required" }),
  reason: EscalationReasonEnum,
  severity: EscalationSeverityEnum.default("Medium"),
  initialNotes: z.string().min(3, { message: "Clinical reason/notes must be at least 3 characters" }),
  taskId: z.string().uuid().optional(),
  observationId: z.string().uuid().optional(),
  incidentId: z.string().uuid().optional(),
  vitalsSnapshot: VitalsSnapshotSchema.optional(),
});
export type CreateClinicalEscalationDTO = z.infer<typeof CreateClinicalEscalationSchema>;

export const TriageClinicalEscalationSchema = z.object({
  decision: TriageActionDecisionEnum,
  sbarSituation: z.string().min(2, { message: "SBAR Situation is required" }),
  sbarBackground: z.string().min(2, { message: "SBAR Background is required" }),
  sbarAssessment: z.string().min(2, { message: "SBAR Assessment is required" }),
  sbarRecommendation: z.string().min(2, { message: "SBAR Recommendation is required" }),
  nurseNotes: z.string().optional(),
  vitals: VitalsSnapshotSchema.optional(),
  monitoringIntervalMinutes: z.number().int().positive().optional(),
});
export type TriageClinicalEscalationDTO = z.infer<typeof TriageClinicalEscalationSchema>;

export const ManagerSignOffEscalationSchema = z.object({
  managerNotes: z.string().min(3, { message: "Manager notes must be at least 3 characters" }),
  cqcReportable: z.boolean().default(false),
  cqcNotificationType: z.string().optional(),
});
export type ManagerSignOffEscalationDTO = z.infer<typeof ManagerSignOffEscalationSchema>;

export const EscalationQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  residentId: z.string().uuid().optional(),
  status: z.string().optional(),
  severity: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().optional().default(50),
  page: z.coerce.number().optional().default(1),
});
export type EscalationQueryDTO = z.infer<typeof EscalationQuerySchema>;
export type EscalationQueryParamsDTO = z.input<typeof EscalationQuerySchema>;

export interface ClinicalEscalationItemDTO {
  id: string;
  tenantId: string;
  branchId: string;
  residentId: string;
  raisedById: string;
  assignedToRole: string;
  assignedToId?: string | null;
  reason: EscalationReason;
  severity: EscalationSeverity;
  status: EscalationStatus;
  initialNotes: string;
  sbarSituation?: string | null;
  sbarBackground?: string | null;
  sbarAssessment?: string | null;
  sbarRecommendation?: string | null;
  actionsTaken?: Array<{
    role: string;
    staffName: string;
    action: string;
    timestamp: string;
    notes?: string;
  }> | null;
  vitalsSnapshot?: VitalsSnapshot | null;
  taskId?: string | null;
  observationId?: string | null;
  incidentId?: string | null;
  managerNotes?: string | null;
  managerSignedAt?: string | Date | null;
  managerSignedById?: string | null;
  resolvedAt?: string | Date | null;
  resolvedById?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  resident?: {
    id: string;
    fullName: string;
    photoUrl?: string | null;
    dob?: string | null;
    nhsNumber?: string | null;
    dnarStatus?: boolean;
    bed?: {
      room?: {
        roomNumber?: string;
      };
    } | null;
  };
  raisedBy?: {
    id: string;
    fullName: string;
  };
  resolvedBy?: {
    id: string;
    fullName: string;
  } | null;
  dailyTask?: {
    id: string;
    title: string;
    category: string;
    status: string;
  } | null;
}
