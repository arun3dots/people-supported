import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaTransactionClient } from '@repo/db';
import type { AuthenticatedUser } from '../../../common/interfaces/request.interface';

const permittedRoles: Record<string, readonly string[]> = {
  SuperAdmin: ['Admin', 'Manager', 'Nurse', 'Carer'],
  Admin: ['Manager', 'Nurse', 'Carer'],
  Manager: ['Nurse', 'Carer'],
};

export async function readManagedAccountAuthority(
  tx: Pick<PrismaTransactionClient, 'user'>,
  actor: AuthenticatedUser,
  tenantId: string,
) {
  const current = await tx.user.findUnique({
    where: {
      id: actor.userId,
      tenantId: actor.tenantId ?? null,
      isActive: true,
      deletedAt: null,
    },
    select: {
      role: {
        select: { name: true, deletedAt: true, isSystem: true, tenantId: true },
      },
      tenantId: true,
      branches: { select: { branchId: true } },
      tenant: { select: { status: true, deletedAt: true } },
    },
  });
  const role = current?.role;
  const platform =
    role?.name === 'SuperAdmin' &&
    current?.tenantId === null &&
    role.isSystem &&
    role.tenantId === null;
  if (
    !current ||
    !role ||
    role.deletedAt ||
    !role.isSystem ||
    role.tenantId !== null ||
    role.name !== actor.roleName ||
    !permittedRoles[role.name] ||
    (!platform &&
      (current.tenantId !== tenantId ||
        current.tenant?.status !== 'Active' ||
        current.tenant.deletedAt))
  ) {
    throw new ForbiddenException('Managed account access denied.');
  }
  const assignments = current.branches.map(({ branchId }) => branchId);
  const branchIds = platform
    ? undefined
    : actor.activeBranchId
      ? assignments.includes(actor.activeBranchId)
        ? [actor.activeBranchId]
        : []
      : assignments.length
        ? assignments
        : undefined;
  return { roleNames: [...permittedRoles[role.name]], branchIds };
}

export async function assertManagedAccountAuthority(
  tx: Pick<PrismaTransactionClient, 'user' | 'role' | 'branch'>,
  actor: AuthenticatedUser,
  tenantId: string,
  roleId: string,
  branchId: string,
) {
  const { roleNames, branchIds } = await readManagedAccountAuthority(
    tx,
    actor,
    tenantId,
  );
  if (branchIds && !branchIds.includes(branchId))
    throw new ForbiddenException(
      'Managed account branch is outside your scope.',
    );

  const [targetRole, branch] = await Promise.all([
    tx.role.findFirst({
      where: { id: roleId, isSystem: true, tenantId: null, deletedAt: null },
      select: { name: true },
    }),
    tx.branch.findFirst({
      where: {
        id: branchId,
        tenantId,
        status: 'Active',
        deletedAt: null,
        tenant: { deletedAt: null, status: 'Active' },
      },
      select: { id: true },
    }),
  ]);
  if (!branch) throw new NotFoundException('Branch is unavailable.');
  if (!targetRole || !roleNames.includes(targetRole.name)) {
    throw new ForbiddenException('Role cannot be assigned by this account.');
  }
}
