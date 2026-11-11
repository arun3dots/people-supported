import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Wing, Prisma } from '@repo/db';
import type {
  CreatePropertyWithRoomsDTO,
  UpdatePropertyDTO,
  WingListQueryDTO,
  PaginatedResponse,
} from '@repo/schema';
import {
  paginate,
  resolvePagination,
} from '../../common/utils/pagination.util';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';
import {
  buildDefaultSafetyCertificates,
  mapWingToPropertyWithDetails,
  type PropertyRoomTenancy,
  type PropertyWithDetails,
} from './property.mapper';

export type { PropertyRoomTenancy, PropertyWithDetails };

@Injectable()
export class PropertyService {
  constructor(private readonly auditService: AuditService) {}

  async createPropertyWithRooms(
    dto: CreatePropertyWithRoomsDTO,
    tenantId: string,
    branchId: string,
    userId: string,
  ): Promise<Wing> {
    const trimmedName = dto.name.trim();
    const existingName = await prisma.wing.findFirst({
      where: {
        branchId,
        deletedAt: null,
        name: { equals: trimmedName, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (existingName) {
      throw new ConflictException(
        `Property "${trimmedName}" already exists in this branch.`,
      );
    }

    const code = (
      dto.code ||
      dto.propertyDetails?.referenceId ||
      `PROP-${Math.floor(1000 + Math.random() * 9000)}`
    ).trim();

    const roomsList = dto.rooms ?? [];
    const roomMetaMap: Record<
      string,
      { weeklyRent?: number | null; floor?: string | null; isAccessible?: boolean }
    > = {};
    for (const r of roomsList) {
      roomMetaMap[r.roomNumber.trim()] = {
        weeklyRent: r.weeklyRent ?? null,
        floor: r.floor ?? 'Ground floor',
        isAccessible: Boolean(r.isAccessible),
      };
    }

    const detailsPayload = {
      ...(dto.propertyDetails ?? {}),
      referenceId: dto.propertyDetails?.referenceId ?? code,
      propertyType:
        dto.propertyDetails?.propertyType ??
        dto.propertyDetails?.unitConfiguration ??
        'Self-contained flats',
      unitConfiguration:
        dto.propertyDetails?.unitConfiguration ??
        dto.propertyDetails?.propertyType ??
        'Self-contained flats',
      totalCapacity: dto.propertyDetails?.totalCapacity ?? roomsList.length,
      safetyCertificates:
        dto.propertyDetails?.safetyCertificates &&
        dto.propertyDetails.safetyCertificates.length > 0
          ? dto.propertyDetails.safetyCertificates
          : buildDefaultSafetyCertificates(),
      roomMetaMap,
    };

    const createdWing = await prisma.$transaction(async (tx) => {
      const wing = await tx.wing.create({
        data: {
          tenantId,
          branchId,
          name: trimmedName,
          code,
          description: dto.description?.trim() || null,
          primaryContact:
            dto.primaryContact?.trim() ||
            dto.propertyDetails?.propertyManagerName ||
            null,
          notes: dto.notes?.trim() || null,
          status: dto.status ?? 'Active',
          schemeId: dto.schemeId || null,
          propertyDetails: toJsonValue(
            detailsPayload,
          ) as Prisma.InputJsonValue,
          createdById: userId,
          updatedById: userId,
        },
      });

      for (let i = 0; i < roomsList.length; i++) {
        const roomDraft = roomsList[i]!;
        const rNum = roomDraft.roomNumber.trim();
        const rCode = `${code}-R${String(i + 1).padStart(2, '0')}`;

        const room = await tx.room.create({
          data: {
            branchId,
            wingId: wing.id,
            roomNumber: rNum,
            name: roomDraft.name?.trim() || rNum,
            code: rCode,
            type: roomDraft.type || 'Single',
            description: [
              roomDraft.floor || 'Ground floor',
              roomDraft.isAccessible ? 'Accessible' : null,
            ]
              .filter(Boolean)
              .join(' · '),
            notes:
              roomDraft.weeklyRent !== undefined
                ? `£${Number(roomDraft.weeklyRent).toFixed(2)}/wk rent`
                : (roomDraft.notes ?? null),
            status: 'Active',
            createdById: userId,
            updatedById: userId,
          },
        });

        const bedsCount = Math.max(1, roomDraft.bedsCount || 1);
        for (let b = 0; b < bedsCount; b++) {
          const bedLabel =
            roomDraft.bedLabels?.[b] ||
            (bedsCount === 1 ? `${rNum} Bed` : `Bed ${b + 1}`);
          const bedNumber = bedsCount === 1 ? `${rNum}-B1` : `${rNum}-B${b + 1}`;
          const bedCode = `${rCode}-B${b + 1}-${Math.floor(100 + Math.random() * 900)}`;

          await tx.bed.create({
            data: {
              branchId,
              roomId: room.id,
              number: bedNumber,
              code: bedCode,
              bedLabel,
              bedType: 'Standard Bed',
              status: 'Available',
              createdById: userId,
              updatedById: userId,
            },
          });
        }
      }

      return wing;
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'CREATE',
      entityType: 'Wing',
      entityId: createdWing.id,
      tenantId,
      userId,
      newValue: toJsonValue(createdWing) as Record<string, unknown>,
    });

    return createdWing;
  }

  async findAllProperties(
    branchId: string,
    query: Partial<WingListQueryDTO> = {},
  ): Promise<PaginatedResponse<PropertyWithDetails>> {
    const slice = resolvePagination(query);
    const where: Prisma.WingWhereInput = { branchId, deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.schemeId) where.schemeId = query.schemeId;
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const pageResult = await paginate(
      slice,
      (args) =>
        prisma.wing.findMany({
          where,
          ...args,
          include: {
            branch: true,
            scheme: true,
            shifts: {
              where: {
                deletedAt: null,
                startTime: { lte: endOfDay },
                endTime: { gte: startOfDay },
              },
              include: {
                assignments: {
                  where: { deletedAt: null },
                  include: { user: { select: { id: true, fullName: true } } },
                },
              },
            },
            rooms: {
              where: { deletedAt: null },
              orderBy: { roomNumber: 'asc' },
              include: {
                beds: {
                  where: { deletedAt: null },
                  include: {
                    resident: {
                      select: {
                        id: true,
                        fullName: true,
                        nhsNumber: true,
                        admissionDate: true,
                        status: true,
                        supportedLivingDetails: true,
                        keyworker: { select: { id: true, fullName: true } },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        }),
      () => prisma.wing.count({ where }),
    );

    return {
      ...pageResult,
      data: pageResult.data.map(mapWingToPropertyWithDetails),
    };
  }

  async updateProperty(
    id: string,
    dto: UpdatePropertyDTO,
    tenantId: string,
    userId: string,
  ): Promise<Wing> {
    const existing = await prisma.wing.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Property not found');

    const existingDetails =
      existing.propertyDetails && typeof existing.propertyDetails === 'object'
        ? (existing.propertyDetails as Record<string, unknown>)
        : {};
    const mergedDetails = {
      ...existingDetails,
      ...(dto.propertyDetails ?? {}),
    };

    const updated = await prisma.wing.update({
      where: { id, tenantId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.primaryContact !== undefined
          ? { primaryContact: dto.primaryContact }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.schemeId !== undefined ? { schemeId: dto.schemeId } : {}),
        propertyDetails: toJsonValue(mergedDetails) as Prisma.InputJsonValue,
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
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    return updated;
  }
}
