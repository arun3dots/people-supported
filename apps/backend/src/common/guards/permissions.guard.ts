import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { prisma } from '@repo/db';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedRequest } from '../interfaces/request.interface';

/**
 * Resolves a "module.action" permission string against the user's
 * permission tree on the JWT payload.
 *
 * Returns false if any segment is missing or the resolved value is not `true`.
 */
function hasPermission(
  permissions: Record<string, unknown> | undefined,
  required: string,
): boolean {
  if (!permissions) return false;
  const segments = required.split('.');
  let current: unknown = permissions;
  for (const seg of segments) {
    if (current === null || typeof current !== 'object') return false;
    current = (current as Record<string, unknown>)[seg];
    if (current === undefined) return false;
  }
  return current === true;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    // Carer, Nurse, Manager, Admin can record/draft, submit for review, and delete drafts
    const userRole = (
      user.roleName ||
      (user as unknown as { role?: string })?.role ||
      ''
    ).toLowerCase();
    const isStaffRole = [
      'carer',
      'nurse',
      'manager',
      'admin',
      'superadmin',
    ].includes(userRole);
    if (
      isStaffRole &&
      required.every((perm) =>
        [
          'riskAssessments.write',
          'riskAssessments.read',
          'riskAssessments.delete',
        ].includes(perm),
      )
    ) {
      return true;
    }

    const ok = required.every((perm) => hasPermission(user.permissions, perm));
    if (ok) {
      return true;
    }

    // Fallback: If JWT permissions are stale, check user's live role and permissions in DB
    if (user.userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { role: { select: { name: true, permissions: true } } },
      });
      if (dbUser?.role) {
        const liveRole = (dbUser.role.name || '').toLowerCase();
        if (
          ['carer', 'nurse', 'manager', 'admin', 'superadmin'].includes(
            liveRole,
          ) &&
          required.every((perm) =>
            [
              'riskAssessments.write',
              'riskAssessments.read',
              'riskAssessments.delete',
            ].includes(perm),
          )
        ) {
          return true;
        }

        const liveOk = required.every((perm) =>
          hasPermission(
            dbUser.role?.permissions as Record<string, unknown> | undefined,
            perm,
          ),
        );
        if (liveOk) {
          return true;
        }
      }
    }

    throw new ForbiddenException(`Missing permission: ${required.join(', ')}`);
  }
}
