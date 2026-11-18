import { resolveShiftTimings, formatTime } from './shift-timing.util';
import { formatShiftTimeRemaining } from './shift-continuity.util';

export interface ShiftStaffLogSummary {
  id?: string;
  status: string;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  handoverNotes?: string | null;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface ShiftRecordForMapping {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  type: { name: string } | null;
  wing: { name: string } | null;
  assignments: Array<{ userId: string; assignedRoomIds?: string[] }>;
  staffLogs?: ShiftStaffLogSummary[];
  [key: string]: unknown;
}

function resolveShiftLifecycleFlags(
  shift: ShiftRecordForMapping,
  now: Date,
  hasContinuousNextShift: boolean,
) {
  const latestLog = shift.staffLogs?.[0] || null;
  const isPast = shift.endTime.getTime() < now.getTime();
  const isCompleted = latestLog?.status === 'Completed';
  const hasStartedLog = !isCompleted && latestLog?.status === 'Started';
  // Keep started shifts open past endTime unless superseded by a continuous follower.
  const isStarted = hasStartedLog && !(isPast && hasContinuousNextShift);
  const isContinuing = isStarted && isPast;
  const timings = resolveShiftTimings(shift.startTime, shift.endTime);

  return {
    latestLog,
    isPast,
    isCompleted,
    isStarted,
    isContinuing,
    timings,
  };
}

export function buildMyShiftItem(
  shift: ShiftRecordForMapping,
  params: {
    now: Date;
    userId: string;
    hasContinuousNextShift: boolean;
    roomMap: Map<string, string>;
    completedTasksCount: number;
    todayTasksCount: number;
  },
): Record<string, unknown> {
  const { now, userId, hasContinuousNextShift, roomMap } = params;
  const { latestLog, isPast, isCompleted, isStarted, isContinuing, timings } =
    resolveShiftLifecycleFlags(shift, now, hasContinuousNextShift);

  const tasksCompleted =
    params.completedTasksCount > 0
      ? params.completedTasksCount
      : latestLog?.tasksCompleted || 0;
  const tasksTotal =
    params.todayTasksCount > 0
      ? params.todayTasksCount
      : latestLog?.tasksTotal || 0;

  const userAssignment = shift.assignments.find((a) => a.userId === userId);
  const userRoomIds = userAssignment?.assignedRoomIds || [];
  const assignedRoomNames = userRoomIds
    .map((rid) => roomMap.get(rid))
    .filter(Boolean);
  const location =
    assignedRoomNames.length > 0
      ? `Room ${assignedRoomNames.join(', ')}`
      : shift.wing?.name || null;

  let actualHoursWorked: number | null = null;
  if (isCompleted) {
    const start = latestLog?.actualStartTime
      ? new Date(latestLog.actualStartTime)
      : shift.startTime;
    const end = latestLog?.actualEndTime
      ? new Date(latestLog.actualEndTime)
      : shift.endTime;
    const diffMs = end.getTime() - start.getTime();
    actualHoursWorked = Math.max(
      0,
      Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10,
    );
  }

  const computedStatus =
    shift.status === 'Cancelled'
      ? 'Cancelled'
      : shift.status === 'Absent'
        ? 'Absent'
        : shift.status === 'Draft'
          ? 'Draft'
          : isCompleted
            ? 'Completed'
            : isContinuing
              ? 'Continuing'
              : isPast
                ? latestLog?.status === 'Started'
                  ? 'Ended'
                  : 'Missed'
                : isStarted
                  ? 'Started'
                  : shift.status || 'Scheduled';

  const timeRemainingStr = formatShiftTimeRemaining(timings.rawEndTime, now, {
    isStarted,
    isCompleted,
    hasContinuousNextShift,
  });

  return {
    ...shift,
    id: shift.id,
    name: shift.type?.name || 'Shift',
    location,
    wardName: location,
    actualHoursWorked,
    startTime: shift.startTime,
    endTime: shift.endTime,
    formattedStartTime: timings.startTime,
    formattedEndTime: timings.endTime,
    rawStartTime: timings.rawStartTime,
    rawEndTime: timings.rawEndTime,
    timingFormatted: `${timings.startTime} - ${timings.endTime}`,
    timeRemainingStr,
    isStarted,
    isCompleted,
    isContinuing,
    hasContinuousNextShift,
    currentLog: latestLog,
    status: computedStatus,
    shiftStatus: computedStatus,
    tasksCompleted,
    tasksTotal,
  };
}

export function buildActiveShiftItem(
  shiftItem: ShiftRecordForMapping | null,
  now: Date,
  hasContinuousNextShift = false,
): Record<string, unknown> | null {
  if (!shiftItem) return null;
  const { latestLog, isCompleted, isStarted, isContinuing, timings } =
    resolveShiftLifecycleFlags(shiftItem, now, hasContinuousNextShift);

  const timeRemainingStr = formatShiftTimeRemaining(timings.rawEndTime, now, {
    isStarted,
    isCompleted,
    hasContinuousNextShift,
  });

  return {
    ...shiftItem,
    id: shiftItem.id,
    name: shiftItem.type?.name || 'Shift',
    wardName: shiftItem.wing?.name || null,
    startTime: shiftItem.startTime,
    endTime: shiftItem.endTime,
    formattedStartTime: timings.startTime,
    formattedEndTime: timings.endTime,
    rawStartTime: timings.rawStartTime,
    rawEndTime: timings.rawEndTime,
    timingFormatted: `${timings.startTime} - ${timings.endTime}`,
    actualStartedTime: latestLog?.actualStartTime
      ? formatTime(new Date(latestLog.actualStartTime))
      : null,
    timeRemainingStr,
    isStarted,
    isCompleted,
    isContinuing,
    hasContinuousNextShift,
    currentLog: latestLog,
    status: isContinuing
      ? 'Continuing'
      : latestLog?.status || shiftItem.status || 'Scheduled',
    shiftStatus: isContinuing
      ? 'Continuing'
      : latestLog?.status ||
        (isStarted ? 'Started' : isCompleted ? 'Completed' : 'Scheduled'),
    tasksCompleted: latestLog?.tasksCompleted || 0,
    tasksTotal: latestLog?.tasksTotal || 0,
  };
}
