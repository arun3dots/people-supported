import {
  differenceInCalendarDays,
  endOfDay,
  format,
  formatDistanceToNow,
  startOfDay,
} from "date-fns";
import type { BadgeState } from "../../../../../../lib/components/shared/tableColumns";
import type { LeaveRequestItem } from "../../../../../../lib/queries/shifts";
import type { Shift } from "../../../../../../lib/types/shifts";

export function getLeaveStaffInitials(fullName?: string | null): string {
  if (!fullName?.trim()) return "ST";
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getLeaveDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}

export function formatLeavePeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  const startStr = format(start, "dd MMM yyyy");
  const endStr = format(end, "dd MMM yyyy");
  return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
}

export function getLeaveStatusBadgeState(
  status: LeaveRequestItem["status"],
): BadgeState {
  switch (status) {
    case "Approved":
      return "success";
    case "Declined":
      return "danger";
    case "Cancelled":
      return "inactive";
    default:
      return "warning";
  }
}

export function getLeaveTypeBadgeState(
  type: LeaveRequestItem["type"],
): BadgeState {
  switch (type) {
    case "Sick Leave":
      return "danger";
    case "Training":
      return "info";
    case "Compassionate":
      return "warning";
    case "TOIL":
      return "success";
    default:
      return "inactive";
  }
}

/**
 * Returns real scheduled shifts assigned to the requesting staff member
 * that overlap the requested leave date range.
 */
export function getOverlappingShiftsForLeave(
  request: LeaveRequestItem,
  shifts: Shift[],
): Shift[] {
  const reqStart = new Date(request.startDate);
  const reqEnd = new Date(request.endDate);
  if (Number.isNaN(reqStart.getTime()) || Number.isNaN(reqEnd.getTime())) {
    return [];
  }

  const windowStartMs = startOfDay(reqStart).getTime();
  const windowEndMs = endOfDay(reqEnd).getTime();

  return shifts.filter((shift) => {
    const isAssigned =
      shift.assignments?.some((a) => a.user?.id === request.staffId) ||
      shift.userIds?.includes(request.staffId);
    if (!isAssigned) return false;

    const shiftStartMs = new Date(shift.startTime).getTime();
    const shiftEndMs = new Date(shift.endTime).getTime();
    if (!Number.isFinite(shiftStartMs) || !Number.isFinite(shiftEndMs)) {
      return false;
    }

    return shiftStartMs <= windowEndMs && shiftEndMs >= windowStartMs;
  });
}

/**
 * Sums calendar days overlapping the current month for a leave period.
 */
export function getDaysInCurrentMonth(
  startDate: string,
  endDate: string,
  referenceDate: Date,
): number {
  const reqStart = new Date(startDate);
  const reqEnd = new Date(endDate);
  if (Number.isNaN(reqStart.getTime()) || Number.isNaN(reqEnd.getTime())) {
    return 0;
  }

  const monthStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
  );
  const monthEnd = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  );

  const clampedStart =
    startOfDay(reqStart) > monthStart ? startOfDay(reqStart) : monthStart;
  const clampedEnd =
    startOfDay(reqEnd) < monthEnd ? startOfDay(reqEnd) : monthEnd;

  if (clampedEnd < clampedStart) return 0;
  return differenceInCalendarDays(clampedEnd, clampedStart) + 1;
}

export function formatShiftRequestDateRange(
  startTime: string,
  endTime: string,
): string {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) ||
      1;
    return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")} (${days} day${days > 1 ? "s" : ""})`;
  } catch {
    return "—";
  }
}

export function formatShiftDateTime(
  startTime: string | Date,
  endTime: string | Date,
): string {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${format(start, "d MMM yyyy")}, ${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
  } catch {
    return "—";
  }
}

export function formatRequestedAt(createdAt?: string | null): string {
  if (!createdAt) return "—";
  try {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "—";
    return `${formatDistanceToNow(date, { addSuffix: true })} (${format(date, "dd MMM yyyy, HH:mm")})`;
  } catch {
    return "—";
  }
}
