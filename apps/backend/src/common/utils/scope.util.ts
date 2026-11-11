import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/request.interface';

/**
 * Resolves the mandatory tenant scope from the JWT. Throws if missing —
 * every tenant-scoped route must sit behind a guard that guarantees this,
 * but this keeps the failure explicit instead of silently querying with
 * `tenantId: undefined`.
 */
export function getTenantId(req: AuthenticatedRequest): string {
  if (!req.user.tenantId) {
    throw new ForbiddenException(
      'Tenant isolation failure - Tenant ID missing',
    );
  }
  return req.user.tenantId;
}

/**
 * Resolves the branch scope for a request:
 * - If the caller has an active branch (assigned via UserBranch, carried on
 *   the JWT as `activeBranchId`), that always wins — branch scope for a
 *   branch-assigned user comes from the JWT, never the request body.
 * - If the caller has no active branch (a tenant-wide role, e.g. an Admin
 *   with no UserBranch rows), an explicit `branchId` may be supplied by the
 *   caller to target a specific branch (e.g. creating a Wing in a chosen
 *   branch). The caller is responsible for validating that branch belongs
 *   to the resolved tenantId.
 * - Returns undefined if neither is present. List endpoints may treat that
 *   as "all branches in the tenant"; write endpoints should call
 *   `requireBranchId` instead so the gap is rejected explicitly.
 */
export function resolveBranchId(
  req: AuthenticatedRequest,
  explicitBranchId?: string,
): string | undefined {
  return req.user.activeBranchId ?? explicitBranchId ?? undefined;
}

/** Same as {@link resolveBranchId} but throws when no branch can be resolved. */
export function requireBranchId(
  req: AuthenticatedRequest,
  explicitBranchId?: string,
): string {
  const branchId = resolveBranchId(req, explicitBranchId);
  if (!branchId) {
    throw new ForbiddenException(
      'Branch scope missing - assign a branch to this user or specify branchId explicitly',
    );
  }
  return branchId;
}
