import { RolePermissions } from "@repo/schema";

export type RoleMember = {
  id: string;
  name: string;
  permissions: RolePermissions;
  isSystem: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
};
