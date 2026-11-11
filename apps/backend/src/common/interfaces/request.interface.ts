import { Request } from 'express';
import type { RolePermissions } from '@repo/schema';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  fullName?: string;
  roleName: string;
  tenantId?: string;
  mfaVerified?: boolean;
  /**
   * All branch IDs the user is assigned to (via UserBranch). Empty/undefined
   * for tenant-wide roles that predate the branch refactor or platform users.
   */
  branchIds?: string[];
  /**
   * The branch currently "active" for this session. Selected at login
   * (defaults to the user's primary branch) and changeable via
   * POST /api/auth/switch-branch. Persisted across token refresh via
   * RefreshToken.activeBranchId so it survives the 5h access token expiry.
   */
  activeBranchId?: string;
  /**
   * Module-level permissions resolved from the user's role.
   * Populated by JwtStrategy at request time. Used by PermissionsGuard.
   */
  permissions?: RolePermissions;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
