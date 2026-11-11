import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { prisma, Room, Prisma } from '@repo/db';
import type { PaginatedResponse, RoomListQueryDTO } from '@repo/schema';
import { CreateRoomDto, UpdateRoomDto } from '../dto/facility.dto';
import { pickWritable } from '../facility.utils';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';
import {
  paginate,
  resolvePagination,
} from '../../common/utils/pagination.util';

function normalizeRoomKey(val?: string | null): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/^room\s+/i, '')
    .trim()
    .toLowerCase();
}

@Injectable()
export class RoomService {
  constructor(private auditService: AuditService) {}

  private async assertUniqueRoomInWing(
    wingId: string,
    roomNumber?: string,
    name?: string,
    code?: string,
    excludeId?: string,
  ): Promise<void> {
    const existingRooms = await prisma.room.findMany({
      where: {
        wingId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, roomNumber: true, name: true, code: true },
    });

    const targetNumberKey = normalizeRoomKey(roomNumber);
    const targetNameKey = normalizeRoomKey(name);
    const targetCodeKey = code?.trim().toLowerCase() || '';

    for (const r of existingRooms) {
      const rNumberKey = normalizeRoomKey(r.roomNumber);
      const rNameKey = normalizeRoomKey(r.name);
      const rCodeKey = r.code?.trim().toLowerCase() || '';

      if (
        targetNumberKey &&
        (targetNumberKey === rNumberKey ||
          (rNameKey && targetNumberKey === rNameKey))
      ) {
        throw new ConflictException(
          `Room "${roomNumber?.trim()}" already exists in the selected wing.`,
        );
      }

      if (
        targetNameKey &&
        (targetNameKey === rNameKey || targetNameKey === rNumberKey)
      ) {
        throw new ConflictException(
          `A room with name "${name?.trim()}" already exists in the selected wing.`,
        );
      }

      if (targetCodeKey && rCodeKey && targetCodeKey === rCodeKey) {
        throw new ConflictException(
          `A room with code "${code?.trim()}" already exists in the selected wing.`,
        );
      }
    }
  }

  async createRoom(
    dto: CreateRoomDto,
    tenantId: string,
    userId: string,
  ): Promise<Room> {
    const wing = await prisma.wing.findFirst({
      where: { id: dto.wingId, tenantId, deletedAt: null },
    });
    if (!wing) throw new NotFoundException('Wing not found');

    await this.assertUniqueRoomInWing(
      dto.wingId,
      dto.roomNumber,
      dto.name,
      dto.code,
    );

    // Room inherits its branch from the wing it's created in, rather than
    // from request scope, so the facility hierarchy can never be
    // internally inconsistent (a room whose branch differs from its wing's).
    const room = await prisma.room.create({
      data: {
        ...pickWritable(dto),
        roomNumber: dto.roomNumber.trim(),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
        wingId: dto.wingId,
        branchId: wing.branchId,
        createdById: userId,
        updatedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'CREATE',
      entityType: 'Room',
      entityId: room.id,
      tenantId,
      userId,
      newValue: toJsonValue(room) as Record<string, unknown>,
    });

    return room;
  }

  async findAllRooms(
    branchId: string,
    query: Partial<RoomListQueryDTO> = {},
  ): Promise<
    PaginatedResponse<
      Room & {
        branchId: string;
        branchName?: string | null;
        wingName: string;
        totalBeds: number;
        occupiedBeds: number;
      }
    >
  > {
    const slice = resolvePagination(query);

    // The app is used by branches, not tenants — every fetch is scoped to a
    // single, resolved branchId (Room's own column, no join needed).
    const where: Prisma.RoomWhereInput = {
      branchId,
      deletedAt: null,
    };

    if (query.wingId) {
      where.wingId = query.wingId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      // The Room Type dropdown shows the display label produced by the web's
      // `getRoomType()` (underscores swapped for spaces, blank -> "Standard"),
      // so map the label back to what the column actually stores.
      const label = query.type;
      where.type =
        label === 'Standard'
          ? { in: ['', 'Standard'] }
          : { in: [label, label.replace(/ /g, '_')] };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { roomNumber: { contains: term, mode: 'insensitive' } },
        { name: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    const orderBy: Prisma.RoomOrderByWithRelationInput =
      query.sortBy === 'name'
        ? { name: sortOrder }
        : query.sortBy === 'createdAt'
          ? { createdAt: sortOrder }
          : { roomNumber: sortOrder };

    const pageResult = await paginate(
      slice,
      (args) =>
        prisma.room.findMany({
          where,
          ...args,
          include: {
            wing: {
              include: {
                branch: true,
                staff: {
                  include: { role: true },
                },
              },
            },
            staff: {
              include: { role: true },
            },
            beds: {
              where: { deletedAt: null },
              include: {
                staff: {
                  include: { role: true },
                },
              },
            },
            _count: {
              select: { beds: { where: { deletedAt: null } } },
            },
          },
          orderBy,
        }),
      () => prisma.room.count({ where }),
    );

    // Derive both counts from the same loaded `beds` array so totalBeds is
    // always >= occupiedBeds (a stale `_count` for a room that had beds moved
    // elsewhere caused impossible values like "capacity 2 / occupied 3").
    return {
      ...pageResult,
      data: pageResult.data.map((r) => {
        const occupiedBeds = r.beds.filter(
          (b) => b.status === 'Occupied',
        ).length;
        return {
          ...r,
          branchName: r.wing.branch?.name,
          wingName: r.wing.name,
          totalBeds: r.beds.length,
          occupiedBeds,
        };
      }),
    };
  }

  async updateRoom(
    id: string,
    dto: UpdateRoomDto,
    tenantId: string,
    userId: string,
  ): Promise<Room> {
    const oldRoom = await prisma.room.findFirst({
      where: { id, wing: { tenantId }, deletedAt: null },
    });
    if (!oldRoom) throw new NotFoundException('Room not found');

    const targetWingId = dto.wingId || oldRoom.wingId;
    const targetRoomNumber = dto.roomNumber ?? oldRoom.roomNumber;

    await this.assertUniqueRoomInWing(
      targetWingId,
      targetRoomNumber,
      undefined,
      undefined,
      id,
    );

    const room = await prisma.room.update({
      where: { id, wing: { tenantId, deletedAt: null } },
      data: {
        ...pickWritable(dto),
        ...(dto.roomNumber !== undefined
          ? { roomNumber: dto.roomNumber.trim() }
          : {}),
        updatedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'UPDATE',
      entityType: 'Room',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(oldRoom) as Record<string, unknown>,
      newValue: toJsonValue(room) as Record<string, unknown>,
    });

    return room;
  }

  async deleteRoom(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const bedsCount = await prisma.bed.count({
      where: { roomId: id, deletedAt: null },
    });
    if (bedsCount > 0) {
      throw new ConflictException('Cannot delete room with existing beds');
    }

    const oldRoom = await prisma.room.findFirst({
      where: { id, wing: { tenantId } },
    });

    await prisma.room.update({
      where: { id, wing: { tenantId, deletedAt: null } },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'DELETE',
      entityType: 'Room',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(oldRoom) as Record<string, unknown>,
    });
  }
}
