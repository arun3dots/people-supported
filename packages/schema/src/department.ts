import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100, "Department name is too long"),
  description: z.string().optional().nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateDepartmentDTO = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentDTO = z.infer<typeof updateDepartmentSchema>;

// --- Department list query ---
export const departmentListQuerySchema = z.object({
  /**
   * Restrict to departments visible in one branch (branch-specific rows
   * plus tenant-wide ones, i.e. branchId IS NULL). Honoured only for
   * tenant-wide callers; a branch-assigned user is pinned to their JWT
   * branch by the controller.
   */
  branchId: z.string().optional(),
});
export type DepartmentListQueryDTO = z.infer<typeof departmentListQuerySchema>;
