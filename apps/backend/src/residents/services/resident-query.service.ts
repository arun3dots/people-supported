import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Resident } from '@repo/db';
import {
  ResidentListQueryDTO,
  PaginatedResponse,
  calculateAge,
} from '@repo/schema';
import {
  resolvePagination,
  buildPaginatedResponse,
  paginate,
} from '../../common/utils/pagination.util';
import { safeDecryptStr } from '../../common/utils/crypto.util';
import type { ActorContext } from '../../common/interfaces/actor.interface';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class ResidentQueryService {
  constructor(private readonly auditService: AuditService) {}

  public decryptResidentFields<
    T extends {
      dob?: string | null;
      nhsNumber?: string | null;
      profile?: Record<string, unknown> | null;
    },
  >(resident: T | null | undefined): T | null | undefined {
    if (!resident) return resident;
    const profile = resident.profile
      ? {
          ...resident.profile,
          nationalId: safeDecryptStr(
            resident.profile.nationalId as string | null | undefined,
          ),
          addressLine1: safeDecryptStr(
            resident.profile.addressLine1 as string | null | undefined,
          ),
        }
      : resident.profile;
    return {
      ...resident,
      dob: safeDecryptStr(resident.dob),
      nhsNumber: safeDecryptStr(resident.nhsNumber),
      ...(profile ? { profile } : {}),
    } as unknown as T;
  }

  private async findCarerShift(
    tenantId: string,
    effectiveUserId?: string,
    shiftId?: string,
  ) {
    if (shiftId && shiftId !== 'active') {
      return prisma.shift.findFirst({
        where: { id: shiftId, tenantId, deletedAt: null },
        include: { assignments: true },
      });
    }
    if (!effectiveUserId) {
      return null;
    }
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    const baseWhere = {
      tenantId,
      deletedAt: null,
      assignments: { some: { userId: effectiveUserId } },
    };

    return (
      (await prisma.shift.findFirst({
        where: { ...baseWhere, startTime: { lte: now }, endTime: { gte: now } },
        include: { assignments: true },
      })) ||
      (await prisma.shift.findFirst({
        where: {
          ...baseWhere,
          startTime: { gte: startOfToday, lte: endOfToday },
        },
        include: { assignments: true },
        orderBy: { startTime: 'asc' },
      })) ||
      (await prisma.shift.findFirst({
        where: { ...baseWhere, startTime: { gt: now } },
        include: { assignments: true },
        orderBy: { startTime: 'asc' },
      })) ||
      (await prisma.shift.findFirst({
        where: baseWhere,
        include: { assignments: true },
        orderBy: { startTime: 'desc' },
      }))
    );
  }

  async findAll(
    tenantId: string,
    userId?: string,
    query: Partial<ResidentListQueryDTO> = {},
    actor?: ActorContext,
  ): Promise<PaginatedResponse<Resident>> {
    const slice = resolvePagination(query);
    const whereCondition: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    const isCarer = actor?.roleName?.toLowerCase() === 'carer';
    const requireAssignedOnly = Boolean(
      !query.includeAll && (query.assignedOnly || query.shiftId || isCarer),
    );

    if (requireAssignedOnly) {
      let user = userId
        ? await prisma.user.findUnique({ where: { id: userId } })
        : null;
      if (!user && userId) {
        user =
          (await prisma.user.findFirst({
            where: { email: { contains: 'carer' } },
          })) || (await prisma.user.findFirst());
      }
      const effectiveUserId = user?.id || userId;

      const shift = await this.findCarerShift(
        tenantId,
        effectiveUserId,
        query.shiftId,
      );
      if (!shift) {
        return buildPaginatedResponse([], 0, slice);
      }

      const assignedResidentIds: string[] = [];
      const assignedRoomIds: string[] = [];

      if (shift.assignments && Array.isArray(shift.assignments)) {
        const userAssignments = effectiveUserId
          ? shift.assignments.filter((a) => a.userId === effectiveUserId)
          : shift.assignments;
        const targetAssignments =
          userAssignments.length > 0 ? userAssignments : shift.assignments;

        for (const a of targetAssignments) {
          const rawResIds = a.assignedResidentIds;
          if (Array.isArray(rawResIds)) {
            for (const rId of rawResIds) {
              if (typeof rId === 'string' && rId.trim())
                assignedResidentIds.push(rId);
            }
          }
          const rawRoomIds = a.assignedRoomIds;
          if (Array.isArray(rawRoomIds)) {
            for (const rmId of rawRoomIds) {
              if (typeof rmId === 'string' && rmId.trim())
                assignedRoomIds.push(rmId);
            }
          }
        }
      }

      const uniqueResidentIds = Array.from(new Set(assignedResidentIds));
      const uniqueRoomIds = Array.from(new Set(assignedRoomIds));
      const shiftOrConditions: Array<Record<string, unknown>> = [];

      if (uniqueResidentIds.length > 0) {
        shiftOrConditions.push({ id: { in: uniqueResidentIds } });
      }
      if (uniqueRoomIds.length > 0) {
        shiftOrConditions.push({ bed: { roomId: { in: uniqueRoomIds } } });
      }

      const andList =
        (whereCondition.AND as Array<Record<string, unknown>>) || [];
      if (shiftOrConditions.length > 0) {
        andList.push({ OR: shiftOrConditions });
        whereCondition.AND = andList;
      } else if (shift.wingId) {
        andList.push({ bed: { room: { wingId: shift.wingId } } });
        whereCondition.AND = andList;
      } else {
        return buildPaginatedResponse([], 0, slice);
      }
    }

    if (query.branchId) whereCondition.branchId = query.branchId;
    if (query.status && query.status !== 'All') {
      whereCondition.status = query.status;
    } else if (requireAssignedOnly || isCarer) {
      // `status` is the resident lifecycle state shown to staff. `isDraft`
      // is also used by quick-call/workflow features, so it must not hide an
      // Active resident from the carer's assigned list.
      whereCondition.status = { not: 'Draft' };
    }

    if (query.careType && query.careType !== 'All Care type') {
      whereCondition.fundingType = query.careType;
    }

    if (query.roomNumber && query.roomNumber !== 'All') {
      const cleanRoom = query.roomNumber.replace(/^Room\s+/i, '');
      const andList =
        (whereCondition.AND as Array<Record<string, unknown>>) || [];
      andList.push({ bed: { room: { roomNumber: cleanRoom } } });
      whereCondition.AND = andList;
    }

    if (query.wingName && query.wingName !== 'All') {
      const andList =
        (whereCondition.AND as Array<Record<string, unknown>>) || [];
      andList.push({ bed: { room: { wing: { name: query.wingName } } } });
      whereCondition.AND = andList;
    }

    if (query.wingId) {
      const andList =
        (whereCondition.AND as Array<Record<string, unknown>>) || [];
      andList.push({ bed: { room: { wingId: query.wingId } } });
      whereCondition.AND = andList;
    }

    if (query.branchName && query.branchName !== 'All') {
      const andList =
        (whereCondition.AND as Array<Record<string, unknown>>) || [];
      andList.push({
        bed: { room: { wing: { branch: { name: query.branchName } } } },
      });
      whereCondition.AND = andList;
    }

    const sortField = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy = { [sortField]: sortOrder };

    const include = {
      profile: true,
      admission: true,
      careProfile: true,
      consent: true,
      bed: {
        include: {
          room: {
            include: { wing: { include: { branch: true, scheme: true } } },
          },
        },
      },
      keyworker: true,
      preAdmissions: { where: { isCurrent: true }, take: 1 },
      carePlans: {
        select: {
          id: true,
          status: true,
          nextReviewDate: true,
          versionNumber: true,
        },
        orderBy: { versionNumber: 'desc' as const },
        take: 1,
      },
      careTimelines: {
        orderBy: { timestamp: 'desc' as const },
        take: 1,
        include: { carer: true },
      },
    };

    // Parse age or age range from query or free-text search (e.g. "65-75", "65 - 75", "70 to 80", "80+")
    let filterMinAge = query.minAge ?? null;
    let filterMaxAge = query.maxAge ?? null;
    if (query.ageRange) {
      const parts = query.ageRange
        .split(/[-–to+]/i)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length === 2) {
        const min = parseInt(parts[0], 10);
        const max = parseInt(parts[1], 10);
        if (!isNaN(min) && !isNaN(max)) {
          filterMinAge = min;
          filterMaxAge = max;
        }
      } else if (parts.length === 1 && query.ageRange.includes('+')) {
        const min = parseInt(parts[0], 10);
        if (!isNaN(min)) filterMinAge = min;
      }
    }

    const filterDob = query.dob ? query.dob.split('T')[0] : null;

    if (
      query.search ||
      filterDob ||
      filterMinAge !== null ||
      filterMaxAge !== null
    ) {
      const s = query.search ? query.search.trim() : '';
      const cleanBed = s.replace(/^Bed\s+/i, '').trim();
      const cleanNhs = s.replace(/\s+/g, '');

      // Check for exact single age e.g. "85" or "85 yrs"
      const ageMatch = s ? s.match(/^(\d{1,3})\s*(yrs?|years?)?$/i) : null;
      const parsedAge = ageMatch ? parseInt(ageMatch[1], 10) : null;
      const validAge =
        parsedAge !== null && parsedAge > 0 && parsedAge <= 125
          ? parsedAge
          : null;

      // Check for age range in search e.g. "65-75", "65 - 75 yrs", "70 to 80"
      const rangeMatch = s
        ? s.match(/^(\d{1,3})\s*[-–to]\s*(\d{1,3})\s*(yrs?|years?)?$/i)
        : null;
      let searchMinAge: number | null = null;
      let searchMaxAge: number | null = null;
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);
        if (min <= max && min >= 0 && max <= 150) {
          searchMinAge = min;
          searchMaxAge = max;
        }
      }

      const isNhsSearch = /^\d{4,12}$/.test(cleanNhs);
      const isEncryptedFieldFilter =
        Boolean(filterDob) ||
        filterMinAge !== null ||
        filterMaxAge !== null ||
        validAge !== null ||
        searchMinAge !== null ||
        isNhsSearch;

      // If filtering involves encrypted fields (DOB, Age, Age Range, NHS number), in-memory decrypt & filter
      if (isEncryptedFieldFilter) {
        const candidateResidents = await prisma.resident.findMany({
          where: whereCondition,
          include,
          orderBy,
        });

        const decryptedCandidates = candidateResidents.map((r) => {
          const dec = this.decryptResidentFields(r) as Record<string, unknown>;
          const bed = dec.bed as {
            wingName?: string | null;
            branchName?: string | null;
            room?: {
              wing?: {
                name?: string | null;
                branch?: { name?: string | null };
              };
            };
          } | null;
          if (bed) {
            bed.wingName = bed.room?.wing?.name ?? null;
            bed.branchName = bed.room?.wing?.branch?.name ?? null;
          }
          return dec;
        });

        const matched = decryptedCandidates.filter((r) => {
          // 1. Dedicated DOB Filter
          if (filterDob) {
            if (typeof r.dob !== 'string' || !r.dob.startsWith(filterDob)) {
              return false;
            }
          }

          // 2. Query Age Range Filters
          if (filterMinAge !== null || filterMaxAge !== null) {
            if (typeof r.dob !== 'string') return false;
            const age = calculateAge(r.dob);
            if (age === null) return false;
            if (filterMinAge !== null && age < filterMinAge) return false;
            if (filterMaxAge !== null && age > filterMaxAge) return false;
          }

          // If no free-text search term is provided, DOB/Age filter match is sufficient
          if (!s) return true;

          // 3. NHS number search
          if (
            isNhsSearch &&
            typeof r.nhsNumber === 'string' &&
            r.nhsNumber.replace(/\s+/g, '').includes(cleanNhs)
          ) {
            return true;
          }

          // 4. Exact Age search
          if (validAge !== null && typeof r.dob === 'string') {
            const age = calculateAge(r.dob);
            if (age === validAge) return true;
          }

          // 5. Age Range search string
          if (
            searchMinAge !== null &&
            searchMaxAge !== null &&
            typeof r.dob === 'string'
          ) {
            const age = calculateAge(r.dob);
            if (age !== null && age >= searchMinAge && age <= searchMaxAge)
              return true;
          }

          // 6. Name, Bed, Keyworker in-memory matching if search had combined text
          const sLower = s.toLowerCase();
          if (
            typeof r.fullName === 'string' &&
            r.fullName.toLowerCase().includes(sLower)
          ) {
            return true;
          }

          const kw = r.keyworker as { fullName?: string } | null;
          if (
            kw &&
            typeof kw.fullName === 'string' &&
            kw.fullName.toLowerCase().includes(sLower)
          ) {
            return true;
          }

          const bedObj = r.bed as { number?: string } | null;
          if (bedObj && typeof bedObj.number === 'string') {
            if (bedObj.number.toLowerCase().includes(cleanBed.toLowerCase()))
              return true;
          }

          return false;
        });

        const totalCount = matched.length;
        const skip = slice.skip ?? 0;
        const take = slice.take ?? slice.limit;
        const pagedData = slice.isAll
          ? matched
          : matched.slice(skip, skip + take);

        if (userId) {
          void this.auditService.emitDataAccess({
            userId: actor?.userId ?? userId,
            tenantId: actor?.tenantId ?? tenantId,
            userEmail: actor?.userEmail,
            userFullName: actor?.userFullName,
            userRoleName: actor?.roleName,
            actionType: 'RESIDENT_LIST_VIEWED',
            entityType: 'Resident',
            metadata: { count: pagedData.length },
            ipAddress: actor?.ipAddress,
            userAgent: actor?.userAgent,
          });
        }

        return buildPaginatedResponse(
          pagedData as unknown as Resident[],
          totalCount,
          slice,
        );
      }

      // Normal search (Name, Bed, Keyworker) — directly in database via Prisma query & DB pagination
      const andList =
        (whereCondition.AND as Array<Record<string, unknown>>) || [];
      andList.push({
        OR: [
          { fullName: { contains: s, mode: 'insensitive' } },
          { keyworker: { fullName: { contains: s, mode: 'insensitive' } } },
          { bed: { number: { contains: cleanBed || s, mode: 'insensitive' } } },
        ],
      });
      whereCondition.AND = andList;
    }

    const paginatedResult = await paginate(
      slice,
      (args) =>
        prisma.resident.findMany({
          where: whereCondition,
          include,
          orderBy,
          ...args,
        }),
      () => prisma.resident.count({ where: whereCondition }),
    );

    if (userId) {
      void this.auditService.emitDataAccess({
        userId: actor?.userId ?? userId,
        tenantId: actor?.tenantId ?? tenantId,
        userEmail: actor?.userEmail,
        userFullName: actor?.userFullName,
        userRoleName: actor?.roleName,
        actionType: 'RESIDENT_LIST_VIEWED',
        entityType: 'Resident',
        metadata: { count: paginatedResult.data.length },
        ipAddress: actor?.ipAddress,
        userAgent: actor?.userAgent,
      });
    }

    const formattedData = paginatedResult.data.map((r) => {
      const dec = this.decryptResidentFields(r) as Record<string, unknown>;
      const bed = dec.bed as {
        wingName?: string | null;
        branchName?: string | null;
        room?: {
          wing?: { name?: string | null; branch?: { name?: string | null } };
        };
      } | null;
      if (bed) {
        bed.wingName = bed.room?.wing?.name ?? null;
        bed.branchName = bed.room?.wing?.branch?.name ?? null;
      }
      if (Array.isArray(dec.carePlans)) {
        dec.carePlans = (dec.carePlans as Array<Record<string, unknown>>).map((cp) => ({
          ...cp,
          reviewDate: cp.nextReviewDate,
        }));
      }
      return dec;
    });

    return {
      ...paginatedResult,
      data: formattedData as unknown as Resident[],
    };
  }

  async findOne(
    id: string,
    tenantId: string,
    userId?: string,
    actor?: ActorContext,
  ): Promise<Resident> {
    const resident = await prisma.resident.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        profile: true,
        admission: true,
        careProfile: true,
        consent: true,
        keyworker: true,
        bed: {
          include: {
            room: {
              include: { wing: { include: { branch: true, scheme: true } } },
            },
          },
        },
        carePlans: {
          include: {
            goals: { include: { tasks: true }, orderBy: { createdAt: 'asc' } },
            sections: true,
            tasks: { orderBy: { createdAt: 'asc' } },
            medications: true,
            approvals: {
              include: {
                approver: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
          orderBy: [{ status: 'asc' }, { versionNumber: 'desc' }],
        },
        medicationRounds: true,
        observations: { orderBy: { timestamp: 'desc' }, take: 10 },
        belongings: true,
      },
    });

    if (!resident) throw new NotFoundException('Resident not found');

    const currentPreAdmission = await prisma.residentPreAdmission.findFirst({
      where: { residentId: id, tenantId, isCurrent: true },
      select: { roomAllocation: true },
    });
    const roomAllocation = currentPreAdmission?.roomAllocation;
    const savedBedId =
      roomAllocation &&
      typeof roomAllocation === 'object' &&
      !Array.isArray(roomAllocation) &&
      'bedId' in roomAllocation &&
      typeof roomAllocation.bedId === 'string'
        ? roomAllocation.bedId
        : null;
    const assignedBed =
      resident.bed ??
      (savedBedId
        ? await prisma.bed.findFirst({
            where: {
              id: savedBedId,
              branchId: resident.branchId,
              deletedAt: null,
            },
            include: {
              room: {
                include: { wing: { include: { branch: true, scheme: true } } },
              },
            },
          })
        : null);

    if (userId) {
      await this.auditService.emitDataAccess({
        userId: actor?.userId ?? userId,
        tenantId: actor?.tenantId ?? tenantId,
        userEmail: actor?.userEmail,
        userFullName: actor?.userFullName,
        userRoleName: actor?.roleName,
        actionType: 'RESIDENT_RECORD_VIEWED',
        entityType: 'Resident',
        entityId: id,
        entityLabel: resident.fullName,
        ipAddress: actor?.ipAddress,
        userAgent: actor?.userAgent,
      });
    }

    const decrypted = this.decryptResidentFields(resident) as unknown as Record<
      string,
      unknown
    >;
    const bed = assignedBed as {
      wingName?: string | null;
      branchName?: string | null;
      room?: {
        wing?: { name?: string | null; branch?: { name?: string | null } };
      };
    } | null;
    if (bed) {
      bed.wingName = bed.room?.wing?.name ?? null;
      bed.branchName = bed.room?.wing?.branch?.name ?? null;
    }
    decrypted.bed = bed;

    return decrypted as unknown as Resident;
  }
}
