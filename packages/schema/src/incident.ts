import { z } from "zod";
import { paginationQuerySchema } from "./common/pagination";

// --- Create Incident ---
export const CreateIncidentSchema = z.object({
  // Optional: branch-assigned callers get branchId from their JWT
  // (req.user.activeBranchId); only tenant-wide callers with no active
  // branch need to supply it explicitly here. Ignored when residentId is
  // set — the resident's own branch wins for consistency.
  branchId: z.string().uuid("Invalid branch selected").optional(),
  title: z.string().min(1, "Incident name is required"),
  category: z.string().min(1, "Category is required"),
  incidentDate: z.string().min(1, "Date is required"),
  incidentTime: z.string().optional(),
  residentId: z.string().min(1).nullable().optional(),
  roomNumber: z.string().optional(),
  bedNumber: z.string().optional(),
  harmLevel: z.string().optional(),
  severity: z.enum(["High", "Medium", "Low"]).default("Medium"),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  location: z.string().optional(),
  initialAssessment: z.string().optional(),
  immediateActions: z.array(z.string()).optional(),
  investigationDetails: z.array(z.any()).optional(),
  tasks: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  complianceItems: z.array(z.any()).optional(),
  managerNotes: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateIncidentDTO = z.infer<typeof CreateIncidentSchema>;

// --- Update Incident ---
export const UpdateIncidentSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  incidentDate: z.string().optional(),
  incidentTime: z.string().optional(),
  residentId: z.string().min(1).nullable().optional(),
  roomNumber: z.string().nullable().optional(),
  bedNumber: z.string().nullable().optional(),
  harmLevel: z.string().nullable().optional(),
  severity: z.enum(["High", "Medium", "Low"]).optional(),
  status: z.enum(["Draft", "Open", "Under Review", "Closed"]).optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  location: z.string().nullable().optional(),
  initialAssessment: z.string().nullable().optional(),
  immediateActions: z.array(z.string()).optional(),
  investigationDetails: z.array(z.any()).optional(),
  tasks: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  complianceItems: z.array(z.any()).optional(),
  managerNotes: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
});

export type UpdateIncidentDTO = z.infer<typeof UpdateIncidentSchema>;

// --- Notify Next of Kin ---
export const NotifyNextOfKinSchema = z.object({
  recipientEmail: z.string().email("Valid email address is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message content is required"),
});

export type NotifyNextOfKinDTO = z.infer<typeof NotifyNextOfKinSchema>;

// --- Statutory Duty of Candour (Health and Social Care Act 2008 Reg 20) ---
export const RecordDutyOfCandourSchema = z.object({
  apologyDate: z.string().or(z.date()),
  apologyMethod: z.enum(["InPerson", "Phone", "VideoCall", "Letter"]),
  apologyNotes: z.string().optional(),
  writtenNoticeSentAt: z.string().or(z.date()).optional(),
  dutyOfCandourStatus: z.enum([
    "PendingApology",
    "ApologyGiven",
    "WrittenNoticeSent",
    "Closed",
  ]),
});

export type RecordDutyOfCandourDTO = z.infer<typeof RecordDutyOfCandourSchema>;

// --- CQC Statutory Notification (Registration Reg 18) ---
export const RecordCqcNotificationSchema = z.object({
  cqcReferenceNumber: z.string().min(1, "CQC Reference Number is required"),
  cqcNotificationSubmittedAt: z.string().or(z.date()),
});

export type RecordCqcNotificationDTO = z.infer<
  typeof RecordCqcNotificationSchema
>;

// --- Incident list query ---
// page/limit/search/sortOrder/all come from paginationQuerySchema
export const incidentListQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  residentId: z.string().optional(),
  /**
   * Restrict to one branch. Honoured only for tenant-wide callers; a
   * branch-assigned user is pinned to their JWT branch by the controller.
   */
  branchId: z.string().optional(),
  sortBy: z.enum(["createdAt", "incidentNumber", "priority"]).default("createdAt"),
});

/** Parsed shape the service receives (defaults applied). */
export type IncidentListQueryDTO = z.infer<typeof incidentListQuerySchema>;
/** Partial shape the web hooks send. */
export type IncidentListQueryInput = z.input<typeof incidentListQuerySchema>;
