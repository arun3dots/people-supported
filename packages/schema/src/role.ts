import { z } from "zod";

export const modulePermissionSchema = z.object({
  read: z.boolean(),
  write: z.boolean(),
  delete: z.boolean(),
});

// Risk-assessments permission has two extra actions beyond the standard CRUD:
//   - approve: transition Draft / PendingReview into Active
//   - manageTemplates: CRUD on the tenant-level template library
export const riskAssessmentPermissionSchema = z.object({
  read: z.boolean(),
  write: z.boolean(),
  delete: z.boolean(),
  approve: z.boolean(),
  manageTemplates: z.boolean(),
});

export const rolePermissionsSchema = z.object({
  dashboard: modulePermissionSchema,
  residents: modulePermissionSchema,
  staff: modulePermissionSchema,
  facilities: modulePermissionSchema,
  payments: modulePermissionSchema,
  settings: modulePermissionSchema,
  riskAssessments: riskAssessmentPermissionSchema,
});

export const createRoleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  permissions: rolePermissionsSchema,
});

export const updateRoleSchema = createRoleSchema.partial();

export type RolePermissions = z.infer<typeof rolePermissionsSchema>;
export type ModulePermission = z.infer<typeof modulePermissionSchema>;
export type RiskAssessmentPermission = z.infer<typeof riskAssessmentPermissionSchema>;
export type CreateRoleDTO = z.infer<typeof createRoleSchema>;
export type UpdateRoleDTO = z.infer<typeof updateRoleSchema>;

// Default zero-permission shape — useful for both BE fall-through and FE form defaults.
export const EMPTY_ROLE_PERMISSIONS: RolePermissions = {
  dashboard: { read: false, write: false, delete: false },
  residents: { read: false, write: false, delete: false },
  staff: { read: false, write: false, delete: false },
  facilities: { read: false, write: false, delete: false },
  payments: { read: false, write: false, delete: false },
  settings: { read: false, write: false, delete: false },
  riskAssessments: {
    read: false,
    write: false,
    delete: false,
    approve: false,
    manageTemplates: false,
  },
};
