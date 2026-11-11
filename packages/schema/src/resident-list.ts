import { z } from "zod";
import { paginationQuerySchema, queryBoolean } from "./common/pagination";

// --- Resident List Query Schema ---
// page/limit/search/sortOrder/all come from paginationQuerySchema
export const residentListQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  careType: z.string().optional(),
  wingId: z.string().optional(),
  branchId: z.string().optional(),
  wingName: z.string().optional(),
  branchName: z.string().optional(),
  roomNumber: z.string().optional(),
  dob: z.string().optional(),
  minAge: z.coerce.number().int().min(0).max(150).optional(),
  maxAge: z.coerce.number().int().min(0).max(150).optional(),
  ageRange: z.string().optional(),
  shiftId: z.string().optional(),
  assignedOnly: queryBoolean.optional(),
  includeAll: queryBoolean.optional(),
  sortBy: z
    .enum(["fullName", "createdAt", "admissionDate", "status"])
    .default("createdAt"),
});

export type ResidentListQueryDTO = z.infer<typeof residentListQuerySchema>;
export type ResidentListQueryInput = z.input<typeof residentListQuerySchema>;

