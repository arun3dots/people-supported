import { prisma } from '@repo/db';

export const CONTINUOUS_SHIFT_MAX_GAP_MS = 30 * 60 * 1000;
export const SHIFT_OVERRUN_GRACE_MS = 10 * 60 * 1000;

export interface ShiftTimeWindow {
  id: string;
  startTime: Date;
  endTime: Date;
  status?: string | null;
  deletedAt?: Date | null;
}

/**
 * Checks whether `candidate` is an immediately continuous Published shift following `current`
 * within the allowed handover gap (0 to 30 minutes).
 */
export function isContinuousFollowUpShift(
  current: ShiftTimeWindow,
  candidate: ShiftTimeWindow,
): boolean {
  if (candidate.id === current.id) return false;
  if (candidate.deletedAt) return false;
  if (candidate.status && candidate.status !== 'Published') return false;
  if (candidate.endTime.getTime() <= candidate.startTime.getTime())
    return false;

  const gapMs = candidate.startTime.getTime() - current.endTime.getTime();
  return gapMs >= 0 && gapMs <= CONTINUOUS_SHIFT_MAX_GAP_MS;
}

/** Finds the earliest continuous follow-up shift from an in-memory shift list. */
export function findContinuousFollowUpShiftInList<T extends ShiftTimeWindow>(
  current: ShiftTimeWindow,
  candidates: readonly T[],
): T | null {
  let earliest: T | null = null;
  for (const candidate of candidates) {
    if (!isContinuousFollowUpShift(current, candidate)) continue;
    if (
      !earliest ||
      candidate.startTime.getTime() < earliest.startTime.getTime()
    ) {
      earliest = candidate;
    }
  }
  return earliest;
}

/** Queries Postgres to verify if the carer has a continuous Published shift after `shift`. */
export async function hasContinuousFollowingShiftForUser(
  tenantId: string,
  userId: string,
  shift: ShiftTimeWindow,
): Promise<boolean> {
  const windowUpper = new Date(
    shift.endTime.getTime() + CONTINUOUS_SHIFT_MAX_GAP_MS,
  );
  const candidate = await prisma.shift.findFirst({
    where: {
      tenantId,
      id: { not: shift.id },
      deletedAt: null,
      status: 'Published',
      startTime: {
        gte: shift.endTime,
        lte: windowUpper,
      },
      assignments: {
        some: {
          userId,
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      deletedAt: true,
    },
    orderBy: { startTime: 'asc' },
  });

  return candidate ? isContinuousFollowUpShift(shift, candidate) : false;
}

export function formatContinuingDuration(endTime: Date, now: Date): string {
  const overrunMs = Math.max(0, now.getTime() - endTime.getTime());
  const totalMins = Math.floor(overrunMs / (1000 * 60));
  if (totalMins < 1) {
    return 'Continuing (just past end)';
  }
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) {
    return `Continuing (+${mins}m)`;
  }
  return `Continuing (+${hrs}h ${String(mins).padStart(2, '0')}m)`;
}

export function formatShiftTimeRemaining(
  endTime: Date,
  now: Date,
  options?: {
    isStarted?: boolean;
    isCompleted?: boolean;
    hasContinuousNextShift?: boolean;
  },
): string {
  if (options?.isCompleted) {
    return 'Shift ended';
  }
  const msDiff = endTime.getTime() - now.getTime();
  if (msDiff > 0) {
    const hrs = Math.floor(msDiff / (1000 * 60 * 60));
    const mins = Math.floor((msDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `Ends in ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} hrs`;
  }
  if (options?.isStarted && !options?.hasContinuousNextShift) {
    return formatContinuingDuration(endTime, now);
  }
  return 'Shift ended';
}
