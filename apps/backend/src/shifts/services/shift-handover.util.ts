import { prisma, type Prisma, type Shift } from '@repo/db';
import type { PreviousShiftHandoverDTO } from '@repo/schema';

/** Completed staff logs preserve each carer's notes; Handover is one row per shift. */
export async function loadPreviousShiftHandovers(
  shift: Pick<Shift, 'id' | 'tenantId' | 'branchId' | 'wingId' | 'startTime'>,
  residentIds: string[],
  roomIds: string[],
): Promise<PreviousShiftHandoverDTO[]> {
  const scope: Prisma.ShiftWhereInput[] = [];
  if (residentIds.length) {
    scope.push({
      assignments: {
        some: {
          deletedAt: null,
          assignedResidentIds: { hasSome: residentIds },
        },
      },
    });
  }
  if (roomIds.length) {
    scope.push({
      assignments: {
        some: {
          deletedAt: null,
          assignedRoomIds: { hasSome: roomIds },
        },
      },
    });
  }
  if (shift.wingId) scope.push({ wingId: shift.wingId });

  const logs = await prisma.staffShiftLog.findMany({
    where: {
      tenantId: shift.tenantId,
      branchId: shift.branchId,
      status: 'Completed',
      actualEndTime: { lte: new Date() },
      handoverNotes: { not: null },
      shift: {
        id: { not: shift.id },
        tenantId: shift.tenantId,
        branchId: shift.branchId,
        deletedAt: null,
        startTime: { lt: shift.startTime },
        ...(scope.length ? { OR: scope } : {}),
      },
    },
    include: {
      user: {
        select: {
          fullName: true,
          role: { select: { name: true } },
          profile: { select: { profilePhotoUrl: true } },
        },
      },
      shift: { select: { startTime: true, type: { select: { name: true } } } },
    },
    orderBy: { actualEndTime: 'desc' },
    take: 10,
  });

  return logs
    .filter((log) => log.handoverNotes?.trim())
    .map((log) => ({
      id: log.id,
      staffId: log.userId,
      staffName: log.user.fullName,
      staffRole: log.user.role?.name ?? null,
      staffAvatarUrl: log.user.profile?.profilePhotoUrl ?? null,
      shiftName: log.shift.type?.name ?? 'Previous Shift',
      startTime: log.shift.startTime.toISOString(),
      endTime: log.actualEndTime?.toISOString() ?? null,
      handoverNotes: log.handoverNotes!.trim(),
    }));
}
