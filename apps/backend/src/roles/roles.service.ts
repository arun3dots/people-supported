import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, Role, PrismaTransactionClient } from '@repo/db';
import type { CreateRoleDTO, UpdateRoleDTO } from '@repo/schema';
import { toJsonValue } from '../common/utils/json.util';
import { AuditService } from '../audit/audit.service';

const RESERVED_SYSTEM_ROLES = [
  'superadmin',
  'admin',
  'manager',
  'nurse',
  'carer',
  'resident',
];

function normalizeRoleName(name: string): string {
  return name
    .trim()
    .replace(/[\s_-]+/g, '')
    .toLowerCase();
}

function isSelectableStaffRole(name: string): boolean {
  const normalizedName = normalizeRoleName(name);
  return !['resident', 'residentrole', 'superadmin', 'superadminrole'].includes(
    normalizedName,
  );
}

@Injectable()
export class RolesService {
  constructor(private auditService: AuditService) {}

  async create(
    createRoleDto: CreateRoleDTO,
    creatorId: string,
    tenantId: string,
  ): Promise<Role> {
    const trimmedName = createRoleDto.name.trim();
    if (RESERVED_SYSTEM_ROLES.includes(trimmedName.toLowerCase())) {
      throw new ConflictException(
        `Cannot create custom role: '${createRoleDto.name}' is a reserved system role`,
      );
    }

    const existingRole = await prisma.role.findFirst({
      where: {
        OR: [
          {
            name: { equals: trimmedName, mode: 'insensitive' },
            tenantId,
            deletedAt: null,
          },
          {
            name: { equals: trimmedName, mode: 'insensitive' },
            isSystem: true,
            tenantId: null,
          },
        ],
      },
    });
    if (existingRole) {
      throw new ConflictException(
        existingRole.isSystem
          ? `Cannot create custom role: '${createRoleDto.name}' is a reserved system role`
          : 'Role already exists for this tenant',
      );
    }

    const role = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        return tx.role.create({
          data: {
            name: createRoleDto.name,
            tenantId,
            permissions: createRoleDto.permissions
              ? toJsonValue(createRoleDto.permissions)
              : [],
            isSystem: false,
            createdById: creatorId,
            updatedById: creatorId,
          },
        });
      },
    );

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'CREATE',
      entityType: 'Role',
      entityId: role.id,
      tenantId,
      userId: creatorId,
      newValue: toJsonValue(role) as Record<string, unknown>,
    });

    return role;
  }

  async findAll(tenantId: string): Promise<Role[]> {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { tenantId, deletedAt: null },
          {
            isSystem: true,
            tenantId: null,
            name: {
              notIn: [
                'SuperAdmin',
                'superadmin',
                'SUPERADMIN',
                'Resident',
                'resident',
                'RESIDENT',
              ],
            },
          },
        ],
      },
      orderBy: [{ tenantId: 'desc' }, { name: 'asc' }],
    });

    const seen = new Set<string>();
    return roles.filter((role) => {
      if (!isSelectableStaffRole(role.name)) {
        return false;
      }
      const lower = normalizeRoleName(role.name);
      if (seen.has(lower)) {
        return false;
      }
      seen.add(lower);
      return true;
    });
  }

  async findOne(id: string, tenantId: string): Promise<Role> {
    const role = await prisma.role.findFirst({
      where: {
        id,
        OR: [{ tenantId }, { isSystem: true, tenantId: null }],
        deletedAt: null,
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDTO,
    updaterId: string,
    tenantId: string,
  ): Promise<Role> {
    const role = await this.findOne(id, tenantId);

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be modified');
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        ...updateRoleDto,
        // @ts-expect-error Prisma types are overly restrictive with Json types
        permissions: updateRoleDto.permissions
          ? toJsonValue(updateRoleDto.permissions)
          : role.permissions,
        updatedById: updaterId,
      },
    });

    void this.auditService.emitSystem({
      actionType: 'ROLE_PERMISSIONS_CHANGED',
      entityType: 'Role',
      entityId: id,
      tenantId,
      userId: updaterId,
      oldValue: toJsonValue(role) as Record<string, unknown>,
      newValue: toJsonValue(updatedRole) as Record<string, unknown>,
    });

    return updatedRole;
  }

  async delete(id: string, deleterId: string, tenantId: string): Promise<void> {
    const role = await this.findOne(id, tenantId);

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }

    // Check if any users are assigned to this role
    const assignedUsers = await prisma.user.count({
      where: { roleId: id, deletedAt: null },
    });

    if (assignedUsers > 0) {
      throw new ConflictException(
        'Cannot delete role that is still assigned to users',
      );
    }

    await prisma.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: deleterId,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'DELETE',
      entityType: 'Role',
      entityId: id,
      tenantId,
      userId: deleterId,
      oldValue: toJsonValue(role) as Record<string, unknown>,
    });
  }
}
