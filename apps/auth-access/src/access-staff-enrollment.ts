import { ConflictException, ForbiddenException } from "@nestjs/common";
import type { CompleteAccessStaff, ReserveAccessStaff } from "@repo/schema";
import type { AccessPrisma } from "./access-db";

type Tx = AccessPrisma.TransactionClient;
type Scope = { productKey: string; tenantId: string };
const success = { ok: true } as const;

async function lockEnrollment(tx: Tx, scope: Scope, productUserId: string) {
  const key = `access-staff:${scope.productKey}:${scope.tenantId}:${productUserId}`;
  await tx.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}

async function requireDelegableRole(
  tx: Tx,
  scope: Scope,
  roleKey: string,
  permissions: string[],
) {
  const role = await tx.accessRole.findUnique({
    where: { productKey_tenantId_key: { ...scope, key: roleKey } },
    include: {
      _count: { select: { memberships: { where: { canManage: true } } } },
    },
  });
  if (
    !role ||
    role._count.memberships > 0 ||
    role.permissions.some((permission) => !permissions.includes(permission))
  ) {
    throw new ForbiddenException("Staff enrollment role is unavailable.");
  }
}

export async function reserveStaffEnrollment(
  tx: Tx,
  scope: Scope,
  input: ReserveAccessStaff,
  requestedBy: string,
  permissions: string[],
) {
  const key = { ...scope, productUserId: input.productUserId };
  await lockEnrollment(tx, scope, input.productUserId);
  await requireDelegableRole(tx, scope, input.roleKey, permissions);
  const current = await tx.accessStaffEnrollment.findUnique({
    where: { productKey_tenantId_productUserId: key },
  });
  if (current) {
    if (current.roleKey !== input.roleKey)
      throw new ConflictException("Staff enrollment role changed.");
    return success;
  }
  await tx.accessStaffEnrollment.create({
    data: { ...key, roleKey: input.roleKey, requestedBy },
  });
  await tx.accessAudit.create({
    data: {
      ...scope,
      actorUserId: requestedBy,
      action: "staff.reserved",
      target: input.productUserId,
      changes: { roleKey: input.roleKey },
    },
  });
  return success;
}

export async function completeStaffEnrollment(
  tx: Tx,
  scope: Scope,
  input: CompleteAccessStaff,
) {
  const key = { ...scope, productUserId: input.productUserId };
  await lockEnrollment(tx, scope, input.productUserId);
  const current = await tx.accessStaffEnrollment.findUnique({
    where: { productKey_tenantId_productUserId: key },
    include: { tenant: { include: { product: true } } },
  });
  if (
    !current ||
    !current.tenant.enabled ||
    current.tenant.product.issuer !== input.issuer
  ) {
    throw new ForbiddenException("Staff enrollment unavailable.");
  }
  if (current.roleKey !== input.roleKey)
    throw new ConflictException("Staff enrollment role changed.");
  if (current.subject) {
    if (current.subject !== input.subject)
      throw new ConflictException("Staff enrollment identity changed.");
    return success;
  }
  const creator = await tx.accessMembership.findFirst({
    where: {
      ...scope,
      userId: current.requestedBy,
      enabled: true,
      canManage: true,
      user: { enabled: true },
    },
    include: { role: true },
  });
  if (!creator)
    throw new ForbiddenException(
      "Staff enrollment administrator is unavailable.",
    );
  await requireDelegableRole(
    tx,
    scope,
    current.roleKey,
    creator.role.permissions.filter((permission) =>
      current.tenant.product.permissions.includes(permission),
    ),
  );
  const user = await tx.accessUser.upsert({
    where: { issuer_subject: { issuer: input.issuer, subject: input.subject } },
    create: { issuer: input.issuer, subject: input.subject, name: input.name },
    update: {},
  });
  if (!user.enabled)
    throw new ForbiddenException("Staff identity is unavailable.");
  const existingMembership = await tx.accessMembership.findUnique({
    where: { productKey_tenantId_userId: { ...scope, userId: user.id } },
    select: { userId: true },
  });
  if (existingMembership)
    throw new ConflictException("Staff identity already has a membership.");
  await tx.accessMembership.create({
    data: { ...scope, userId: user.id, roleKey: current.roleKey },
  });
  await tx.accessStaffEnrollment.update({
    where: { productKey_tenantId_productUserId: key },
    data: { subject: input.subject, completedAt: new Date() },
  });
  await tx.accessAudit.create({
    data: {
      ...scope,
      actorUserId: current.requestedBy,
      action: "staff.enrolled",
      target: input.productUserId,
      changes: { accessUserId: user.id, roleKey: current.roleKey },
    },
  });
  return success;
}
