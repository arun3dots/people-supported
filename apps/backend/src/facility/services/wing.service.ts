import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Wing, Prisma } from '@repo/db';
import type { PaginatedResponse, WingListQueryDTO } from '@repo/schema';
import { CreateWingDto, UpdateWingDto } from '../dto/facility.dto';
import {
  paginate,
  resolvePagination,
} from '../../common/utils/pagination.util';
import { pickWritable } from '../facility.utils';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class WingService {
  constructor(private auditService: AuditService) {}

  private async assertUniqueWingInBranch(
    branchId: string,
    name?: string,
    code?: string,
    excludeId?: string,
  ): Promise<void> {
    const trimmedName = name?.trim();
    const trimmedCode = code?.trim();

    if (trimmedName) {
      const existingName = await prisma.wing.findFirst({
        where: {
          branchId,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
          name: { equals: trimmedName, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (existingName) {
        throw new ConflictException(
          `Wing "${trimmedName}" already exists in this facility.`,
        );
      }
    }

    if (trimmedCode) {
      const existingCode = await prisma.wing.findFirst({
        where: {
          branchId,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
          code: { equals: trimmedCode, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (existingCode) {
        throw new ConflictException(
          `A wing with code "${trimmedCode}" already exists in this facility.`,
        );
      }
    }
  }

  async createWing(
    dto: CreateWingDto,
    tenantId: string,
    branchId: string,
    userId: string,
  ): Promise<Wing> {
    await this.assertUniqueWingInBranch(branchId, dto.name, dto.code);

    const wing = await prisma.wing.create({
      data: {
        ...pickWritable(dto),
        name: dto.name.trim(),
        ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
        tenantId,
        branchId,
        createdById: userId,
        updatedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'CREATE',
      entityType: 'Wing',
      entityId: wing.id,
      tenantId,
      userId,
      newValue: toJsonValue(wing) as Record<string, unknown>,
    });

    return wing;
  }

  async findAllWings(
    branchId: string,
    query: Partial<WingListQueryDTO> = {},
  ): Promise<
    PaginatedResponse<
      Wing & { branchName?: string; totalRooms: number; totalBeds: number }
    >
  > {
    const slice = resolvePagination(query);

    // The app is used by branches, not tenants — every fetch is scoped to a
    // single, resolved branchId. No tenantId check here.
    const where: Prisma.WingWhereInput = {
      branchId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    const orderBy: Prisma.WingOrderByWithRelationInput =
      query.sortBy === 'code'
        ? { code: sortOrder }
        : query.sortBy === 'createdAt'
          ? { createdAt: sortOrder }
          : { name: sortOrder };

    const pageResult = await paginate(
      slice,
      (args) =>
        prisma.wing.findMany({
          where,
          ...args,
          include: {
            branch: true,
            staff: {
              include: { role: true },
            },
            _count: {
              select: { rooms: { where: { deletedAt: null } } },
            },
            rooms: {
              where: { deletedAt: null },
              select: {
                _count: {
                  select: { beds: { where: { deletedAt: null } } },
                },
              },
            },
          },
          orderBy,
        }),
      () => prisma.wing.count({ where }),
    );

    return {
      ...pageResult,
      data: pageResult.data.map((w) => {
        const { _count, rooms, branch, ...rest } = w;
        return {
          ...rest,
          rooms,
          branchName: branch?.name,
          totalRooms: _count.rooms,
          totalBeds: rooms.reduce((acc: number, r) => acc + r._count.beds, 0),
        };
      }),
    };
  }

  async updateWing(
    id: string,
    dto: UpdateWingDto,
    tenantId: string,
    userId: string,
  ): Promise<Wing> {
    const oldWing = await prisma.wing.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!oldWing) throw new NotFoundException('Wing not found');

    await this.assertUniqueWingInBranch(
      oldWing.branchId,
      dto.name ?? oldWing.name,
      dto.code ?? oldWing.code ?? undefined,
      id,
    );

    const wing = await prisma.wing.update({
      where: { id, tenantId },
      data: {
        ...pickWritable(dto),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
        updatedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'UPDATE',
      entityType: 'Wing',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(oldWing) as Record<string, unknown>,
      newValue: toJsonValue(wing) as Record<string, unknown>,
    });

    return wing;
  }

  async deleteWing(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const roomsCount = await prisma.room.count({
      where: { wingId: id, deletedAt: null },
    });
    if (roomsCount > 0) {
      throw new ConflictException('Cannot delete wing with existing rooms');
    }

    const oldWing = await prisma.wing.findFirst({ where: { id, tenantId } });

    await prisma.wing.update({
      where: { id, tenantId },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'DELETE',
      entityType: 'Wing',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(oldWing) as Record<string, unknown>,
    });
  }
}
