import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import {
  AccessPrisma,
  createAccessDatabase,
  requireDatabaseUrl,
} from "./access-db";
import type {
  AccessActor,
  AccessConsole,
  AccessDecision,
  AccessMemberUpdate,
  AccessRoleCreate,
  AccessRoleUpdate,
  CompleteAccessStaff,
  ReserveAccessStaff,
} from "@repo/schema";
import {
  completeStaffEnrollment,
  reserveStaffEnrollment,
} from "./access-staff-enrollment";

type Tx = AccessPrisma.TransactionClient;
type Scope = { productKey: string; tenantId: string };

async function resolveActor(db: Tx, productKey: string, actor: AccessActor) {
  const scope: Scope = { productKey, tenantId: actor.tenantId };
  const authenticatedAt = new Date(actor.authenticatedAt);
  const membership = await db.accessMembership.findFirst({
    where: {
      ...scope,
      enabled: true,
      OR: [{ revokedBefore: null }, { revokedBefore: { lt: authenticatedAt } }],
      tenant: { enabled: true, product: { issuer: actor.issuer } },
      user: {
        issuer: actor.issuer,
        subject: actor.subject,
        enabled: true,
        OR: [
          { revokedBefore: null },
          { revokedBefore: { lt: authenticatedAt } },
        ],
      },
    },
    include: { role: true, tenant: { include: { product: true } } },
  });
  if (!membership) throw new ForbiddenException("Membership unavailable.");
  const catalog = membership.tenant.product.permissions;
  const permissions = membership.role.permissions.filter((p) =>
    catalog.includes(p),
  );
  return { scope, membership, catalog, permissions };
}

type Manager = Awaited<ReturnType<typeof resolveActor>>;

function canDelegate(manager: Manager, permissions: string[]) {
  return permissions.every((p) => manager.permissions.includes(p));
}

function canEditRole(
  manager: Manager,
  role: { key: string; permissions: string[] },
) {
  return (
    role.key !== manager.membership.roleKey &&
    canDelegate(manager, role.permissions)
  );
}

function canEditMember(
  manager: Manager,
  member: { canManage: boolean; role: { permissions: string[] } },
) {
  return !member.canManage && canDelegate(manager, member.role.permissions);
}

async function requireManager(db: Tx, product: string, actor: AccessActor) {
  const manager = await resolveActor(db, product, actor);
  if (!manager.membership.canManage)
    throw new ForbiddenException("Access administration permission required.");
  return manager;
}

async function snapshot(db: Tx, manager: Manager): Promise<AccessConsole> {
  const roles = await db.accessRole.findMany({
    where: manager.scope,
    orderBy: [{ name: "asc" }, { key: "asc" }],
    include: {
      _count: { select: { memberships: { where: { canManage: true } } } },
    },
  });
  const members = await db.accessMembership.findMany({
    where: manager.scope,
    include: { user: { select: { name: true } }, role: true },
    orderBy: [{ user: { name: "asc" } }, { userId: "asc" }],
  });
  return {
    product: manager.scope.productKey,
    permissions: manager.catalog,
    delegablePermissions: manager.permissions,
    roles: roles.map(({ key, name, permissions, version, _count }) => ({
      key,
      name,
      permissions,
      version,
      editable:
        _count.memberships === 0 && canEditRole(manager, { key, permissions }),
    })),
    members: members.map((member) => ({
      userId: member.userId,
      name: member.user.name,
      roleKey: member.roleKey,
      enabled: member.enabled,
      version: member.version,
      editable: canEditMember(manager, member),
    })),
  };
}

async function audit(
  db: Tx,
  manager: Manager,
  action: string,
  target: string,
  changes: AccessPrisma.InputJsonObject,
) {
  await db.accessAudit.create({
    data: {
      ...manager.scope,
      actorUserId: manager.membership.userId,
      action,
      target,
      changes,
    },
  });
}

@Injectable()
export class AccessStore implements OnModuleInit, OnModuleDestroy {
  private readonly db = createAccessDatabase(requireDatabaseUrl(process.env));

  onModuleInit() {
    return this.db.$connect();
  }

  onModuleDestroy() {
    return this.db.$disconnect();
  }

  reserveStaff(product: string, input: ReserveAccessStaff) {
    return this.enroll((tx) =>
      requireManager(tx, product, input.actor).then((manager) =>
        reserveStaffEnrollment(
          tx,
          manager.scope,
          input,
          manager.membership.userId,
          manager.permissions,
        ),
      ),
    );
  }

  completeStaff(productKey: string, input: CompleteAccessStaff) {
    return this.enroll((tx) =>
      completeStaffEnrollment(
        tx,
        { productKey, tenantId: input.tenantId },
        input,
      ),
    );
  }

  private async enroll<T>(operation: (tx: Tx) => Promise<T>): Promise<T> {
    try {
      return await this.db.$transaction(operation, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (
        error instanceof AccessPrisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "Staff enrollment conflicts with an existing access record.",
        );
      }
      throw error;
    }
  }

  async check(product: string, actor: AccessActor): Promise<AccessDecision> {
    return this.db.$transaction(
      async (tx) => {
        const { permissions, membership } = await resolveActor(
          tx,
          product,
          actor,
        );
        return { permissions, canManage: membership.canManage };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }

  console(product: string, actor: AccessActor) {
    return this.db.$transaction(
      async (tx) => snapshot(tx, await requireManager(tx, product, actor)),
      {
        isolationLevel: "RepeatableRead",
      },
    );
  }

  createRole(product: string, actor: AccessActor, role: AccessRoleCreate) {
    return this.write(product, actor, async (tx, manager) => {
      if (!canDelegate(manager, role.permissions))
        throw new ForbiddenException("Role permissions exceed delegation.");
      await tx.accessRole.create({ data: { ...manager.scope, ...role } });
      await audit(tx, manager, "role.created", role.key, role);
    });
  }

  updateRole(
    product: string,
    actor: AccessActor,
    key: string,
    role: AccessRoleUpdate,
  ) {
    return this.write(product, actor, async (tx, manager) => {
      const current = await tx.accessRole.findUnique({
        where: { productKey_tenantId_key: { ...manager.scope, key } },
        include: {
          _count: { select: { memberships: { where: { canManage: true } } } },
        },
      });
      if (!current) throw new NotFoundException("Role unavailable.");
      if (
        current._count.memberships ||
        !canEditRole(manager, current) ||
        !canDelegate(manager, role.permissions)
      ) {
        throw new ForbiddenException("Role permissions exceed delegation.");
      }
      if (current.version !== role.version) throw new ConflictException();
      await tx.accessRole.update({
        where: {
          productKey_tenantId_key: { ...manager.scope, key },
          version: role.version,
        },
        data: {
          name: role.name,
          permissions: role.permissions,
          version: { increment: 1 },
        },
      });
      await audit(tx, manager, "role.updated", key, {
        before: { name: current.name, permissions: current.permissions },
        after: { name: role.name, permissions: role.permissions },
      });
    });
  }

  updateMembership(
    product: string,
    actor: AccessActor,
    userId: string,
    membership: AccessMemberUpdate,
  ) {
    return this.write(product, actor, async (tx, manager) => {
      const current = await tx.accessMembership.findUnique({
        where: { productKey_tenantId_userId: { ...manager.scope, userId } },
        include: { role: true },
      });
      const role = await tx.accessRole.findUnique({
        where: {
          productKey_tenantId_key: {
            ...manager.scope,
            key: membership.roleKey,
          },
        },
      });
      if (!current || !role)
        throw new NotFoundException("Membership or role unavailable.");
      if (
        !canEditMember(manager, current) ||
        !canDelegate(manager, role.permissions)
      ) {
        throw new ForbiddenException(
          "Membership permissions exceed delegation.",
        );
      }
      if (current.version !== membership.version) throw new ConflictException();
      await tx.accessMembership.update({
        where: {
          productKey_tenantId_userId: { ...manager.scope, userId },
          version: membership.version,
        },
        data: {
          roleKey: role.key,
          enabled: membership.enabled,
          ...(current.enabled && !membership.enabled
            ? { revokedBefore: new Date() }
            : {}),
          version: { increment: 1 },
        },
      });
      await audit(tx, manager, "membership.updated", userId, {
        before: { roleKey: current.roleKey, enabled: current.enabled },
        after: { roleKey: role.key, enabled: membership.enabled },
      });
    });
  }

  private async write(
    product: string,
    actor: AccessActor,
    operation: (tx: Tx, manager: Manager) => Promise<void>,
  ) {
    try {
      return await this.db.$transaction(
        async (tx) => {
          const manager = await requireManager(tx, product, actor);
          await operation(tx, manager);
          return snapshot(tx, manager);
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (
        error instanceof AccessPrisma.PrismaClientKnownRequestError &&
        ["P2002", "P2025", "P2034"].includes(error.code)
      ) {
        throw new ConflictException("Access policy changed or already exists.");
      }
      throw error;
    }
  }
}
