import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import type {
  PropertyAllocationSummaryDTO,
  StaffAllocationItemDTO,
  StaffAllocationResponseDTO,
} from '@repo/schema';
import { getStaffOnLeaveIds } from '../../staff/staff-leave.util';

@Injectable()
export class StaffAllocationService {
  /**
   * Computes tenant/branch staff allocation metrics, per-staff scheduled workload,
   * leave availability, and per-property coverage using existing tables only.
   */
  async getAllocationOverview(
    tenantId: string,
    branchId: string,
    from?: Date,
    to?: Date,
    wingId?: string,
  ): Promise<StaffAllocationResponseDTO> {
    const windowStart = from ?? this.getDefaultWeekStart();
    const windowEnd = to ?? this.getDefaultWeekEnd(windowStart);

    const [branches, wings, staffUsers, shifts, activeResidents] =
      await Promise.all([
        prisma.branch.findMany({
          where: { tenantId, deletedAt: null },
          select: { id: true, name: true },
        }),
        prisma.wing.findMany({
          where: {
            branch: { tenantId, deletedAt: null },
            deletedAt: null,
            ...(wingId ? { id: wingId } : {}),
          },
          select: {
            id: true,
            name: true,
            branchId: true,
            branch: { select: { name: true } },
          },
        }),
        prisma.user.findMany({
          where: {
            tenantId,
            deletedAt: null,
            branches: { some: { branchId } },
          },
          select: {
            id: true,
            tenantId: true,
            fullName: true,
            email: true,
            isActive: true,
            profile: {
              select: {
                contractType: true,
                contractedHoursPerWeek: true,
              },
            },
            role: { select: { name: true } },
            assignedWings: {
              where: { deletedAt: null },
              select: {
                id: true,
                name: true,
                branchId: true,
                branch: { select: { name: true } },
              },
            },
            assignedResidents: {
              where: { deletedAt: null, status: 'Active' },
              select: { id: true },
            },
          },
          orderBy: { fullName: 'asc' },
        }),
        prisma.shift.findMany({
          where: {
            tenantId,
            deletedAt: null,
            status: { not: 'Cancelled' },
            startTime: { lte: windowEnd },
            endTime: { gte: windowStart },
            ...(wingId ? { wingId } : {}),
          },
          select: {
            id: true,
            wingId: true,
            wing: { select: { name: true } },
            startTime: true,
            endTime: true,
            careType: true,
            assignments: {
              select: { userId: true, assignedResidentIds: true },
            },
          },
        }),
        prisma.resident.findMany({
          where: { tenantId, deletedAt: null, status: 'Active' },
          select: {
            id: true,
            bed: { select: { room: { select: { wingId: true } } } },
          },
        }),
      ]);

    const onLeaveIds = await getStaffOnLeaveIds(staffUsers, branchId);

    const shiftsByUserId = new Map<
      string,
      {
        count: number;
        hours: number;
        residentIds: Set<string>;
        propertyNames: Set<string>;
        sharedHours: number;
        oneToOneHours: number;
        twoToOneHours: number;
        sleepInHours: number;
        wakingNightHours: number;
      }
    >();
    const shiftsCountByWingId = new Map<string, number>();
    let unfilledShiftsCount = 0;
    let totalScheduledHours = 0;

    for (const shift of shifts) {
      const durationHours = Math.max(
        0,
        (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000,
      );
      if (shift.wingId) {
        shiftsCountByWingId.set(
          shift.wingId,
          (shiftsCountByWingId.get(shift.wingId) ?? 0) + 1,
        );
      }
      if (shift.assignments.length === 0) {
        unfilledShiftsCount += 1;
        continue;
      }
      if (shift.careType !== 'Off / Rest Day') {
        totalScheduledHours += durationHours;
      }
      const careLower = (shift.careType ?? '').toLowerCase();
      for (const assignment of shift.assignments) {
        const entry = shiftsByUserId.get(assignment.userId) ?? {
          count: 0,
          hours: 0,
          residentIds: new Set<string>(),
          propertyNames: new Set<string>(),
          sharedHours: 0,
          oneToOneHours: 0,
          twoToOneHours: 0,
          sleepInHours: 0,
          wakingNightHours: 0,
        };
        if (shift.wing?.name) {
          entry.propertyNames.add(shift.wing.name);
        }
        if (shift.careType !== 'Off / Rest Day') {
          entry.count += 1;
          entry.hours += durationHours;
          if (careLower.includes('2:1')) entry.twoToOneHours += durationHours;
          else if (careLower.includes('1:1')) entry.oneToOneHours += durationHours;
          else if (careLower.includes('sleep')) entry.sleepInHours += durationHours;
          else if (careLower.includes('waking') || careLower.includes('night')) {
            entry.wakingNightHours += durationHours;
          } else {
            entry.sharedHours += durationHours;
          }
        }
        for (const rId of assignment.assignedResidentIds) {
          entry.residentIds.add(rId);
        }
        shiftsByUserId.set(assignment.userId, entry);
      }
    }

    const staffItems: StaffAllocationItemDTO[] = staffUsers.map((user) => {
      const workload = shiftsByUserId.get(user.id);
      const scheduledHours = Math.round((workload?.hours ?? 0) * 10) / 10;
      const contracted = user.profile?.contractedHoursPerWeek ?? 37.5;
      const contractType = user.profile?.contractType ?? null;
      const utilizationPercent =
        contracted > 0 ? Math.round((scheduledHours / contracted) * 100) : 0;
      const isOnLeave = onLeaveIds.has(user.id);
      const roleName = user.role?.name ?? 'Staff';
      const isNight = roleName.toLowerCase().includes('night');
      const hasLocation = user.assignedWings.length > 0;
      const assignmentType = isNight
        ? 'Night Cover'
        : contractType || (hasLocation ? 'Assigned' : 'Unassigned');

      let availability: StaffAllocationItemDTO['availability'] = 'Available';
      if (!user.isActive) availability = 'Inactive';
      else if (isOnLeave) availability = 'On Leave';
      else if (utilizationPercent >= 100) availability = 'Fully Booked';

      const uniqueResidentIds = new Set<string>([
        ...user.assignedResidents.map((r) => r.id),
        ...(workload ? Array.from(workload.residentIds) : []),
      ]);

      const uniquePropertyNames = Array.from(
        new Set<string>([
          ...user.assignedWings.map((w) => w.name),
          ...(workload ? Array.from(workload.propertyNames) : []),
        ]),
      );

      const round1 = (v: number): number => Math.round(v * 10) / 10;

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleName,
        contractType,
        contractedHoursPerWeek: contracted,
        isActive: user.isActive,
        isOnLeave,
        assignedWings: user.assignedWings.map((w) => ({
          id: w.id,
          name: w.name,
          branchId: w.branchId,
          branchName: w.branch?.name ?? null,
        })),
        allocatedPropertyNames: uniquePropertyNames,
        assignedResidentsCount: uniqueResidentIds.size,
        scheduledShiftsCount: workload?.count ?? 0,
        scheduledHours,
        utilizationPercent,
        careMix: {
          sharedHours: round1(workload?.sharedHours ?? 0),
          oneToOneHours: round1(workload?.oneToOneHours ?? 0),
          twoToOneHours: round1(workload?.twoToOneHours ?? 0),
          sleepInHours: round1(workload?.sleepInHours ?? 0),
          wakingNightHours: round1(workload?.wakingNightHours ?? 0),
        },
        assignmentType,
        availability,
      };
    });

    const staffCountByWingId = new Map<string, number>();
    for (const user of staffUsers) {
      for (const w of user.assignedWings) {
        staffCountByWingId.set(w.id, (staffCountByWingId.get(w.id) ?? 0) + 1);
      }
    }

    const residentsCountByWingId = new Map<string, number>();
    for (const res of activeResidents) {
      const wId = res.bed?.room?.wingId;
      if (wId) {
        residentsCountByWingId.set(
          wId,
          (residentsCountByWingId.get(wId) ?? 0) + 1,
        );
      }
    }

    const propertySummaries: PropertyAllocationSummaryDTO[] = wings.map((w) => {
      const assignedStaffCount = staffCountByWingId.get(w.id) ?? 0;
      const scheduledShiftsCount = shiftsCountByWingId.get(w.id) ?? 0;
      return {
        id: w.id,
        name: w.name,
        branchId: w.branchId,
        branchName: w.branch?.name ?? null,
        assignedStaffCount,
        scheduledShiftsCount,
        activeResidentsCount: residentsCountByWingId.get(w.id) ?? 0,
        isCovered: assignedStaffCount > 0 || scheduledShiftsCount > 0,
      };
    });

    const coveredProperties = propertySummaries.filter((p) => p.isCovered).length;
    const assignedStaffCount = staffItems.filter(
      (s) => s.assignedWings.length > 0 || s.scheduledShiftsCount > 0,
    ).length;

    return {
      summary: {
        totalStaff: staffItems.length,
        assignedStaffCount,
        onLeaveCount: staffItems.filter((s) => s.isOnLeave).length,
        availableStaffCount: staffItems.filter(
          (s) => s.isActive && !s.isOnLeave,
        ).length,
        activeSchemes: branches.length,
        totalProperties: propertySummaries.length,
        coveredProperties,
        unfilledShiftsCount,
        totalScheduledHours: Math.round(totalScheduledHours * 10) / 10,
      },
      staff: staffItems,
      properties: propertySummaries,
    };
  }

  private getDefaultWeekStart(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() + diff);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }

  private getDefaultWeekEnd(weekStart: Date): Date {
    const end = new Date(weekStart);
    end.setUTCDate(weekStart.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    return end;
  }
}

