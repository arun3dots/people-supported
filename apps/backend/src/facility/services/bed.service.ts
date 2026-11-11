import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { prisma, Bed, Prisma } from '@repo/db';
import type { PaginatedResponse, BedListQueryDTO } from '@repo/schema';
import {
  paginate,
  resolvePagination,
} from '../../common/utils/pagination.util';
import { CreateBedDto, UpdateBedDto } from '../dto/facility.dto';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';

function normalizeBedKey(val?: string | null): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/^bed\s+/i, '')
    .trim()
    .toLowerCase();
}

@Injectable()
export class BedService {
  constructor(private auditService: AuditService) {}

  private async assertUniqueBed(
    roomId: string,
    branchId: string,
    bedNumber?: string,
    bedCode?: string,
    excludeId?: string,
  ): Promise<void> {
    const targetNumberKey = normalizeBedKey(bedNumber);
    const targetRawNumber = bedNumber?.trim().toLowerCase() || '';
    const targetCodeKey = bedCode?.trim().toLowerCase() || '';

    if (targetNumberKey || targetRawNumber) {
      const roomBeds = await prisma.bed.findMany({
        where: {
          roomId,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true, number: true, code: true },
      });

      for (const b of roomBeds) {
        const bNumberKey = normalizeBedKey(b.number);
        const bRawNumber = b.number?.trim().toLowerCase() || '';
        if (
          (targetNumberKey && targetNumberKey === bNumberKey) ||
          (targetRawNumber && targetRawNumber === bRawNumber)
        ) {
          throw new ConflictException(
            `Bed "${bedNumber?.trim()}" already exists in the selected room.`,
          );
        }
      }
    }

    if (targetCodeKey) {
      const branchBedWithCode = await prisma.bed.findFirst({
        where: {
          branchId,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
          code: { equals: bedCode?.trim(), mode: 'insensitive' },
        },
        select: { id: true, code: true },
      });

      if (branchBedWithCode) {
        throw new ConflictException(
          `A bed with identifier "${bedCode?.trim()}" already exists in this facility.`,
        );
      }
    }
  }

  async createBed(
    dto: CreateBedDto,
    tenantId: string,
    userId: string,
  ): Promise<{ count: number }> {
    const room = await prisma.room.findFirst({
      where: {
        id: dto.roomId,
        wing: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });
    if (!room) throw new NotFoundException('Room not found');

    await this.assertUniqueBed(
      dto.roomId,
      room.branchId,
      dto.bedNumber,
      dto.bedCode,
    );

    // Check Single Room bed capacity (Single / Single Room can hold at most 1 active bed)
    const quantity = dto.quantity || 1;
    const normalizedRoomType = (room.type || '').trim().toLowerCase();
    if (
      normalizedRoomType === 'single' ||
      normalizedRoomType === 'single room' ||
      normalizedRoomType === 'single_room'
    ) {
      const existingBedCount = await prisma.bed.count({
        where: { roomId: dto.roomId, deletedAt: null },
      });
      if (existingBedCount + quantity > 1) {
        throw new ConflictException(
          `Room ${room.roomNumber} is a Single Room and already has ${existingBedCount} bed configured.`,
        );
      }
    }

    // residentId is @unique; validate it belongs to this tenant when supplied.
    if (dto.residentId) {
      const resident = await prisma.resident.findFirst({
        where: { id: dto.residentId, tenantId },
        select: { id: true },
      });
      if (!resident) throw new NotFoundException('Resident not found');
    }

    // Bed inherits its branch from the room it's created in (which itself
    // inherited it from its wing), keeping the facility hierarchy consistent.
    const bedsData = Array.from({ length: quantity }).map((_, index) => ({
      roomId: dto.roomId,
      branchId: room.branchId,
      status: dto.status,
      number:
        quantity > 1
          ? `${dto.bedNumber.trim()}-${index + 1}`
          : dto.bedNumber.trim(),
      code:
        quantity > 1
          ? `${dto.bedCode.trim()}-${index + 1}`
          : dto.bedCode.trim(),
      bedLabel: dto.bedLabel,
      bedType: dto.bedType,
      bedLength: dto.bedLength,
      bedWidth: dto.bedWidth,
      safeWorkingLoad: dto.safeWorkingLoad,
      heightAdjustment: dto.heightAdjustment,
      sideRails: dto.sideRails,
      pressureMattress: dto.pressureMattress,
      equipment: dto.equipment ?? [],
      specificationNotes: dto.specificationNotes,
      availableFrom: dto.availableFrom,
      plannedStatus: dto.plannedStatus,
      occupancyAvailableFrom: dto.occupancyAvailableFrom,
      expectedDischargeDate: dto.expectedDischargeDate,
      availabilityNotes: dto.availabilityNotes,
      // residentId is @unique, so only assign it to the first bed of a batch
      ...(index === 0 ? { residentId: dto.residentId } : {}),
      createdById: userId,
      updatedById: userId,
    }));

    const result = await prisma.bed.createMany({
      data: bedsData,
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'CREATE',
      entityType: 'Bed',
      tenantId,
      userId,
      newValue: toJsonValue({
        count: quantity,
        roomId: dto.roomId,
        status: dto.status,
      }) as Record<string, unknown>,
    });

    return result;
  }

  async findAllBeds(
    branchId: string,
    query: Partial<BedListQueryDTO> = {},
  ): Promise<
    PaginatedResponse<
      Bed & {
        residentName?: string | null;
        residentAdmissionDate?: Date | null;
        residentStatus?: string | null;
        branchName?: string | null;
        wingId: string;
        wingName: string;
        roomId: string;
        roomNumber: string;
      }
    >
  > {
    const slice = resolvePagination(query);

    // The app is used by branches, not tenants — every fetch is scoped to a
    // single, resolved branchId (Bed's own column, no join needed).
    const where: Prisma.BedWhereInput = {
      branchId,
      deletedAt: null,
    };

    if (query.roomId) {
      where.roomId = query.roomId;
    }

    if (query.wingId) {
      where.room = { wingId: query.wingId };
    }

    if (query.status) {
      // The Beds tab treats any bed holding a resident as Occupied regardless
      // of the stored status, so mirror that rule here rather than filtering on
      // the raw column alone.
      if (query.status === 'Occupied') {
        where.OR = [{ residentId: { not: null } }, { status: 'Occupied' }];
      } else {
        where.status = query.status;
        where.residentId = null;
      }
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      const searchOr: Prisma.BedWhereInput[] = [
        { number: { contains: term, mode: 'insensitive' } },
        { resident: { fullName: { contains: term, mode: 'insensitive' } } },
      ];
      // `where.OR` may already hold the Occupied clause; AND the two groups so
      // status and search narrow the result instead of widening it.
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    const orderBy: Prisma.BedOrderByWithRelationInput =
      query.sortBy === 'createdAt'
        ? { createdAt: sortOrder }
        : { number: sortOrder };

    const pageResult = await paginate(
      slice,
      (args) =>
        prisma.bed.findMany({
          where,
          ...args,
          include: {
            room: {
              include: {
                wing: {
                  include: { branch: true },
                },
              },
            },
            staff: {
              include: { role: true },
            },
            resident: {
              select: {
                id: true,
                fullName: true,
                admissionDate: true,
                status: true,
              },
            },
          },
          orderBy,
        }),
      () => prisma.bed.count({ where }),
    );

    return {
      ...pageResult,
      data: pageResult.data.map((b) => ({
        ...b,
        residentName: b.resident?.fullName,
        residentAdmissionDate: b.resident?.admissionDate,
        residentStatus: b.resident?.status,
        branchName: b.room.wing.branch?.name,
        wingId: b.room.wingId,
        wingName: b.room.wing.name,
        roomId: b.roomId,
        roomNumber: b.room.roomNumber,
      })),
    };
  }

  async updateBed(
    id: string,
    dto: UpdateBedDto,
    tenantId: string,
    userId: string,
  ): Promise<Bed> {
    const oldBed = await prisma.bed.findFirst({
      where: { id, room: { wing: { tenantId } }, deletedAt: null },
    });
    if (!oldBed) throw new NotFoundException('Bed not found');

    const targetRoomId = dto.roomId ?? oldBed.roomId;
    let targetBranchId = oldBed.branchId;

    // Bed DTO field names differ from the storage columns (bedNumber/number,
    // bedCode/code), so map them explicitly and persist whichever were supplied.
    const data: Record<string, unknown> = {
      status: dto.status,
      ...(dto.bedNumber !== undefined && { number: dto.bedNumber.trim() }),
      ...(dto.bedCode !== undefined && { code: dto.bedCode.trim() }),
      ...(dto.bedLabel !== undefined && { bedLabel: dto.bedLabel }),
      ...(dto.bedType !== undefined && { bedType: dto.bedType }),
      ...(dto.bedLength !== undefined && { bedLength: dto.bedLength }),
      ...(dto.bedWidth !== undefined && { bedWidth: dto.bedWidth }),
      ...(dto.safeWorkingLoad !== undefined && {
        safeWorkingLoad: dto.safeWorkingLoad,
      }),
      ...(dto.heightAdjustment !== undefined && {
        heightAdjustment: dto.heightAdjustment,
      }),
      ...(dto.sideRails !== undefined && { sideRails: dto.sideRails }),
      ...(dto.pressureMattress !== undefined && {
        pressureMattress: dto.pressureMattress,
      }),
      ...(dto.equipment !== undefined && { equipment: dto.equipment }),
      ...(dto.specificationNotes !== undefined && {
        specificationNotes: dto.specificationNotes,
      }),
      ...(dto.availableFrom !== undefined && {
        availableFrom: dto.availableFrom,
      }),
      ...(dto.plannedStatus !== undefined && {
        plannedStatus: dto.plannedStatus,
      }),
      ...(dto.occupancyAvailableFrom !== undefined && {
        occupancyAvailableFrom: dto.occupancyAvailableFrom,
      }),
      ...(dto.expectedDischargeDate !== undefined && {
        expectedDischargeDate: dto.expectedDischargeDate,
      }),
      ...(dto.availabilityNotes !== undefined && {
        availabilityNotes: dto.availabilityNotes,
      }),
    };

    // Persist a room move only if the target room belongs to this tenant.
    // A bed follows its new room's branch too, for the same consistency
    // reason rooms/beds inherit branch at creation time.
    if (dto.roomId !== undefined) {
      const targetRoom = await prisma.room.findFirst({
        where: {
          id: dto.roomId,
          wing: { tenantId, deletedAt: null },
          deletedAt: null,
        },
      });
      if (!targetRoom) throw new NotFoundException('Room not found');
      data.roomId = dto.roomId;
      data.branchId = targetRoom.branchId;
      targetBranchId = targetRoom.branchId;
    }

    await this.assertUniqueBed(
      targetRoomId,
      targetBranchId,
      dto.bedNumber ?? oldBed.number ?? undefined,
      dto.bedCode ?? oldBed.code ?? undefined,
      id,
    );

    // residentId is @unique; validate it belongs to this tenant when supplied.
    if (dto.residentId !== undefined) {
      const resident = await prisma.resident.findFirst({
        where: { id: dto.residentId, tenantId },
        select: { id: true },
      });
      if (!resident) throw new NotFoundException('Resident not found');
      data.residentId = dto.residentId || null;
    }

    const bed = await prisma.bed.update({
      where: {
        id,
        room: { wing: { tenantId, deletedAt: null }, deletedAt: null },
      },
      data: {
        ...data,
        updatedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'UPDATE',
      entityType: 'Bed',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(oldBed) as Record<string, unknown>,
      newValue: toJsonValue(bed) as Record<string, unknown>,
    });

    return bed;
  }

  async deleteBed(id: string, tenantId: string, userId: string): Promise<void> {
    const bed = await prisma.bed.findFirst({
      where: {
        id,
        room: { wing: { tenantId, deletedAt: null }, deletedAt: null },
        deletedAt: null,
      },
    });
    if (!bed) throw new NotFoundException('Bed not found');
    if (bed.status === 'Occupied') {
      throw new ConflictException('Cannot delete an occupied bed');
    }

    await prisma.bed.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'DELETE',
      entityType: 'Bed',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(bed) as Record<string, unknown>,
    });
  }
}
