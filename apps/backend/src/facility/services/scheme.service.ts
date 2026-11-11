import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Scheme, Prisma } from '@repo/db';
import type {
  CreateSchemeDTO,
  UpdateSchemeDTO,
  SchemeListQueryDTO,
  PaginatedResponse,
} from '@repo/schema';
import {
  paginate,
  resolvePagination,
} from '../../common/utils/pagination.util';
import { toJsonValue } from '../../common/utils/json.util';
import { AuditService } from '../../audit/audit.service';

export interface SchemeWithMetrics extends Scheme {
  schemeManagerName?: string | null;
  housingPartner?: string | null;
  totalProperties: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
  properties: Array<{
    id: string;
    name: string;
    code: string | null;
    status: string;
  }>;
}

@Injectable()
export class SchemeService {
  constructor(private readonly auditService: AuditService) {}

  private async assertUniqueSchemeInBranch(
    branchId: string,
    name?: string,
    referenceId?: string | null,
    excludeId?: string,
  ): Promise<void> {
    const trimmedName = name?.trim();
    const trimmedRef = referenceId?.trim();

    if (trimmedName) {
      const existing = await prisma.scheme.findFirst({
        where: {
          branchId,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
          name: { equals: trimmedName, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          `Scheme "${trimmedName}" already exists in this branch.`,
        );
      }
    }

    if (trimmedRef) {
      const existingRef = await prisma.scheme.findFirst({
        where: {
          branchId,
          deletedAt: null,
          ...(excludeId ? { id: { not: excludeId } } : {}),
          referenceId: { equals: trimmedRef, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (existingRef) {
        throw new ConflictException(
          `Scheme with reference ID "${trimmedRef}" already exists.`,
        );
      }
    }
  }

  async createScheme(
    dto: CreateSchemeDTO,
    tenantId: string,
    branchId: string,
    userId: string,
  ): Promise<Scheme> {
    await this.assertUniqueSchemeInBranch(branchId, dto.name, dto.referenceId);

    const schemeDetailsPayload = {
      ...(dto.schemeDetails ?? {}),
      ...(dto.propertyIds ? { propertyIds: dto.propertyIds } : {}),
    };

    const scheme = await prisma.$transaction(async (tx) => {
      const created = await tx.scheme.create({
        data: {
          tenantId,
          branchId,
          name: dto.name.trim(),
          referenceId: dto.referenceId?.trim() || null,
          location: dto.location?.trim() || null,
          description: dto.description?.trim() || null,
          commissioningLa: dto.commissioningLa?.trim() || null,
          schemeManagerId: dto.schemeManagerId || null,
          commissionedHours: dto.commissionedHours ?? null,
          status: dto.status ?? 'Active',
          schemeDetails: toJsonValue(
            schemeDetailsPayload,
          ) as Prisma.InputJsonValue,
          createdById: userId,
          updatedById: userId,
        },
      });

      if (dto.propertyIds && dto.propertyIds.length > 0) {
        await tx.wing.updateMany({
          where: {
            id: { in: dto.propertyIds },
            tenantId,
            branchId,
            deletedAt: null,
          },
          data: {
            schemeId: created.id,
            updatedById: userId,
          },
        });
      }

      return created;
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'CREATE',
      entityType: 'Scheme',
      entityId: scheme.id,
      tenantId,
      userId,
      newValue: toJsonValue(scheme) as Record<string, unknown>,
    });

    return scheme;
  }

  async findAllSchemes(
    branchId: string,
    query: Partial<SchemeListQueryDTO> = {},
  ): Promise<PaginatedResponse<SchemeWithMetrics>> {
    const slice = resolvePagination(query);

    const where: Prisma.SchemeWhereInput = {
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
        { referenceId: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
        { commissioningLa: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    const orderBy: Prisma.SchemeOrderByWithRelationInput =
      query.sortBy === 'createdAt'
        ? { createdAt: sortOrder }
        : { name: sortOrder };

    const pageResult = await paginate(
      slice,
      (args) =>
        prisma.scheme.findMany({
          where,
          ...args,
          include: {
            wings: {
              where: { deletedAt: null },
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
                rooms: {
                  where: { deletedAt: null },
                  select: {
                    id: true,
                    beds: {
                      where: { deletedAt: null },
                      select: {
                        id: true,
                        status: true,
                        residentId: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy,
        }),
      () => prisma.scheme.count({ where }),
    );

    const managerIds = Array.from(
      new Set(
        pageResult.data
          .map((s) => s.schemeManagerId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const managers =
      managerIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: managerIds } },
            select: { id: true, fullName: true },
          })
        : [];
    const managerMap = new Map(managers.map((m) => [m.id, m.fullName]));

    return {
      ...pageResult,
      data: pageResult.data.map((s) => {
        let totalRooms = 0;
        let totalBeds = 0;
        let occupiedBeds = 0;

        for (const prop of s.wings) {
          totalRooms += prop.rooms.length;
          for (const room of prop.rooms) {
            totalBeds += room.beds.length;
            occupiedBeds += room.beds.filter(
              (b) => b.status === 'Occupied' || Boolean(b.residentId),
            ).length;
          }
        }

        const occupancyRate =
          totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        const detailsObj =
          s.schemeDetails && typeof s.schemeDetails === 'object'
            ? (s.schemeDetails as Record<string, unknown>)
            : {};

        return {
          ...s,
          housingPartner:
            typeof detailsObj.housingPartner === 'string'
              ? detailsObj.housingPartner
              : null,
          schemeManagerName: s.schemeManagerId
            ? (managerMap.get(s.schemeManagerId) ?? null)
            : typeof detailsObj.schemeManagerName === 'string'
              ? detailsObj.schemeManagerName
              : null,
          totalProperties: s.wings.length,
          totalRooms,
          totalBeds,
          occupiedBeds,
          occupancyRate,
          properties: s.wings.map((p) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            status: p.status,
          })),
        };
      }),
    };
  }

  async updateScheme(
    id: string,
    dto: UpdateSchemeDTO,
    tenantId: string,
    userId: string,
  ): Promise<Scheme> {
    const existing = await prisma.scheme.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Scheme not found');
    }

    await this.assertUniqueSchemeInBranch(
      existing.branchId,
      dto.name ?? existing.name,
      dto.referenceId !== undefined ? dto.referenceId : existing.referenceId,
      id,
    );

    const existingDetails =
      existing.schemeDetails && typeof existing.schemeDetails === 'object'
        ? (existing.schemeDetails as Record<string, unknown>)
        : {};

    const mergedDetails = {
      ...existingDetails,
      ...(dto.schemeDetails ?? {}),
      ...(dto.propertyIds !== undefined ? { propertyIds: dto.propertyIds } : {}),
    };

    const updated = await prisma.$transaction(async (tx) => {
      const scheme = await tx.scheme.update({
        where: { id, tenantId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.referenceId !== undefined
            ? { referenceId: dto.referenceId?.trim() || null }
            : {}),
          ...(dto.location !== undefined
            ? { location: dto.location?.trim() || null }
            : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.commissioningLa !== undefined
            ? { commissioningLa: dto.commissioningLa?.trim() || null }
            : {}),
          ...(dto.schemeManagerId !== undefined
            ? { schemeManagerId: dto.schemeManagerId || null }
            : {}),
          ...(dto.commissionedHours !== undefined
            ? { commissionedHours: dto.commissionedHours }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          schemeDetails: toJsonValue(mergedDetails) as Prisma.InputJsonValue,
          updatedById: userId,
        },
      });

      if (dto.propertyIds !== undefined) {
        await tx.wing.updateMany({
          where: {
            schemeId: id,
            tenantId,
            branchId: existing.branchId,
          },
          data: {
            schemeId: null,
            updatedById: userId,
          },
        });

        if (dto.propertyIds.length > 0) {
          await tx.wing.updateMany({
            where: {
              id: { in: dto.propertyIds },
              tenantId,
              branchId: existing.branchId,
              deletedAt: null,
            },
            data: {
              schemeId: id,
              updatedById: userId,
            },
          });
        }
      }

      return scheme;
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'UPDATE',
      entityType: 'Scheme',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    return updated;
  }

  async deleteScheme(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const existing = await prisma.scheme.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Scheme not found');
    }

    await prisma.$transaction([
      prisma.wing.updateMany({
        where: { schemeId: id, tenantId },
        data: { schemeId: null, updatedById: userId },
      }),
      prisma.scheme.update({
        where: { id, tenantId },
        data: { deletedAt: new Date(), deletedById: userId },
      }),
    ]);

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'DELETE',
      entityType: 'Scheme',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
    });
  }
}
