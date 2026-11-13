import { BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { getUkDayBoundaries } from '../../common/utils/time.util';

export interface ShiftComplianceCheckOptions {
  tenantId: string;
  userIds: string[];
  residentIds: string[];
  startTime: Date;
  endTime: Date;
  careType?: string | null;
  excludedShiftId?: string;
}

/**
 * Asserts CQC Regulation 18 compliance, safeguarding restrictions, and staffing rules.
 * Throws BadRequestException if any mandatory rule is breached.
 */
export async function assertShiftCompliance(
  options: ShiftComplianceCheckOptions,
): Promise<void> {
  const {
    tenantId,
    userIds,
    residentIds,
    startTime,
    endTime,
    careType,
    excludedShiftId,
  } = options;

  // 1. Care type staffing ratio validation
  if (careType === '2:1 Dedicated Support' && userIds.length < 2) {
    throw new BadRequestException(
      '2:1 Dedicated Support requires at least 2 staff members assigned to the shift.',
    );
  }

  if (userIds.length === 0) return;

  // 2. Safeguarding check: Ensure no assigned staff is on resident's Do-Not-Assign list
  if (residentIds.length > 0) {
    const restrictedResident = await prisma.resident.findFirst({
      where: {
        tenantId,
        id: { in: residentIds },
        deletedAt: null,
        doNotAssignIds: { hasSome: userIds },
      },
      select: { fullName: true },
    });

    if (restrictedResident) {
      throw new BadRequestException(
        `Safeguarding restriction: ${restrictedResident.fullName} has a Do-Not-Assign condition for one of the selected staff members.`,
      );
    }
  }

  // 3. Approved leave clash check (ShiftRequest with type Leave and status Approved)
  const leaveClash = await prisma.shiftRequest.findFirst({
    where: {
      tenantId,
      userId: { in: userIds },
      type: 'Leave',
      status: 'Approved',
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    include: {
      user: { select: { fullName: true } },
    },
  });

  if (leaveClash) {
    const staffName = leaveClash.user?.fullName || 'A staff member';
    throw new BadRequestException(
      `${staffName} has approved leave during this time window and cannot be assigned to shifts.`,
    );
  }

  // 4. Off / Rest Day conflict check on the same UK calendar day
  const { start: dayStart, end: dayEnd } = getUkDayBoundaries(startTime);
  const isOffDay = careType === 'Off / Rest Day';
  const sameDayConflict = await prisma.shift.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      status: { not: 'Cancelled' },
      ...(excludedShiftId ? { id: { not: excludedShiftId } } : {}),
      startTime: { gte: dayStart, lte: dayEnd },
      ...(isOffDay
        ? { careType: { not: 'Off / Rest Day' } }
        : { careType: 'Off / Rest Day' }),
      assignments: { some: { userId: { in: userIds }, deletedAt: null } },
    },
    select: { id: true, careType: true },
  });

  if (sameDayConflict) {
    throw new BadRequestException(
      isOffDay
        ? 'Cannot schedule an Off / Rest Day when the staff member already has a working shift on this date.'
        : 'Staff member is marked as Off / Rest Day on this date and cannot be assigned a working shift.',
    );
  }
}

/**
 * Checks Working Time Regulations 11-hour minimum rest period before and after a shift.
 * Returns a warning string if violated, or null if compliant.
 */
export async function checkRestPeriodCompliance(options: {
  tenantId: string;
  userIds: string[];
  startTime: Date;
  endTime: Date;
  careType?: string | null;
  excludedShiftId?: string;
}): Promise<string | null> {
  const { tenantId, userIds, startTime, endTime, careType, excludedShiftId } = options;
  if (userIds.length === 0 || careType === 'Off / Rest Day') return null;

  const minRestMs = 11 * 3600 * 1000;
  const restWindowStart = new Date(startTime.getTime() - minRestMs);
  const restWindowEnd = new Date(endTime.getTime() + minRestMs);

  const adjacentShift = await prisma.shift.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      status: { not: 'Cancelled' },
      careType: { not: 'Off / Rest Day' },
      ...(excludedShiftId ? { id: { not: excludedShiftId } } : {}),
      assignments: { some: { userId: { in: userIds }, deletedAt: null } },
      OR: [
        { endTime: { gte: restWindowStart, lte: startTime } },
        { startTime: { gte: endTime, lte: restWindowEnd } },
      ],
    },
    select: { id: true },
  });

  return adjacentShift
    ? 'Working Time Regulations alert: Less than 11 hours rest between shifts.'
    : null;
}

