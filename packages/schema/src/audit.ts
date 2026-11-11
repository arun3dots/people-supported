import { z } from "zod";
import { paginationQuerySchema } from "./common/pagination";

export const AUDIT_AREAS = [
  "all",
  "care_log",
  "care_plan",
  "assessment",
  "medication",
  "incident",
  "tasks",
  "handover",
  "access",
  "rota",
  "staff",
  "observation",
  "body_map",
  "risk",
] as const;

export type AuditAreaType = (typeof AUDIT_AREAS)[number];

// --- Audit List Query Schema ---
// page/limit/search/sortOrder/all come from paginationQuerySchema
export const auditListQuerySchema = paginationQuerySchema.extend({
  userId: z.string().optional(),
  entityId: z.string().optional(),
  categoryType: z.string().optional(),
  actionType: z.string().optional(),
  area: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z
    .enum(["timestamp", "categoryType", "actionType"])
    .default("timestamp"),
});

export type AuditListQueryDTO = z.infer<typeof auditListQuerySchema>;
export type AuditListQueryInput = z.input<typeof auditListQuerySchema>;

export const pageViewAuditSchema = z.object({
  path: z.string().min(1).max(500),
  pageName: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type PageViewAuditDTO = z.infer<typeof pageViewAuditSchema>;
