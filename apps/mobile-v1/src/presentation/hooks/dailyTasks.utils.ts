import { formatUkTime, getUkTimeParts } from '../../lib/date';
import type { CareTaskDayDTO, CareTaskListItemDTO } from '@repo/schema';
import type { Resident } from '../../domain/entities/Resident';

export interface MobileTaskItem {
  id: string;
  source?: 'legacy' | 'care-plan';
  residentId: string;
  residentName: string;
  residentAvatar?: string;
  bedNumber: string;
  roomDisplay: string;
  locationDisplay: string;
  title: string;
  time: string;
  period?: 'AM' | 'PM';
  timeSlot?: string;
  dueBy: string;
  targetTime?: string;
  category: string;
  goalTitle?: string;
  instructions: string;
  description: string;
  priority?: string;
  escalateIfSkipped?: boolean;
  assignedStaffId?: string;
  assignedStaffName?: string;
  status: 'Completed' | 'Overdue' | 'Pending' | 'Skipped' | 'Refused';
  rawStatus: string;
  statusDetail: string;
  completedAt?: string;
  completedByName?: string;
  notes?: string;
  skipReason?: string;
  scheduledDate?: string;
}

export interface RawDailyTask {
  id: string;
  residentId?: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  precautions?: string | null;
  category?: string;
  priority?: string;
  status: string;
  scheduledDate: string;
  timeSlot?: string | null;
  targetTime?: string | null;
  completedAt?: string | null;
  completedById?: string | null;
  completedBy?: {
    id?: string;
    fullName?: string | null;
  } | null;
  assignedStaffId?: string | null;
  assignedStaff?: {
    id?: string;
    fullName?: string | null;
  } | null;
  skipReason?: string | null;
  notes?: string | null;
  resident?: {
    id: string;
    fullName: string;
    photoUrl?: string | null;
    bed?: {
      number?: string | null;
      bedLabel?: string | null;
      room?: {
        roomNumber?: string | null;
        name?: string | null;
      } | null;
    } | null;
  } | null;
  carePlanTask?: {
    category?: string;
    instructions?: string | null;
    targetTime?: string | null;
    priority?: string | null;
    escalateIfSkipped?: boolean | null;
    goal?: {
      id?: string;
      title?: string | null;
    } | null;
  } | null;
}

export function parseTaskTiming(task: RawDailyTask): {
  time: string;
  period?: 'AM' | 'PM';
  isOverdue: boolean;
  statusDetail: string;
} {
  let targetHours: number | null = null;
  let targetMinutes = 0;

  const configuredTime = task.targetTime ?? task.carePlanTask?.targetTime;
  const targetTimeMatch = configuredTime?.match(/^(\d{1,2}):(\d{2})$/);
  if (targetTimeMatch) {
    const hours = Number(targetTimeMatch[1]);
    const minutes = Number(targetTimeMatch[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      targetHours = hours;
      targetMinutes = minutes;
    }
  }

  const rawLower = (task.status || '').toLowerCase();
  const isCompleted = rawLower === 'completed' || rawLower === 'done';
  const isSkipped = rawLower === 'skipped' || rawLower === 'missed';
  const isRefused = rawLower === 'refused';

  const period: 'AM' | 'PM' | undefined =
    targetHours === null ? undefined : targetHours >= 12 ? 'PM' : 'AM';
  const displayHours =
    targetHours === null ? null : targetHours % 12 === 0 ? 12 : targetHours % 12;
  const time =
    displayHours === null
      ? task.timeSlot?.toLowerCase() === 'allday'
        ? 'All day'
        : task.timeSlot || 'Unscheduled'
      : `${String(displayHours).padStart(2, '0')}:${String(targetMinutes).padStart(2, '0')}`;

  if (isCompleted) {
    return {
      time,
      period,
      isOverdue: false,
      statusDetail: task.completedAt ? formatUkTime(task.completedAt) : 'Completed',
    };
  }

  if (isRefused) {
    return {
      time,
      period,
      isOverdue: false,
      statusDetail: 'Refused',
    };
  }

  if (isSkipped) {
    return {
      time,
      period,
      isOverdue: false,
      statusDetail: 'Skipped',
    };
  }

  if (targetHours === null) {
    return { time, period, isOverdue: false, statusDetail: 'Scheduled' };
  }

  const { totalMinutes: currentMinutes } = getUkTimeParts();
  const targetTotalMinutes = targetHours * 60 + targetMinutes;
  let isOverdue = false;
  let statusDetail = 'Scheduled';
  if (currentMinutes > targetTotalMinutes + 15) {
    isOverdue = true;
    const diffMins = currentMinutes - targetTotalMinutes;
    if (diffMins < 60) {
      statusDetail = `${diffMins}mins delay`;
    } else {
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      statusDetail = mins > 0 ? `${hrs}h ${mins}m delay` : `${hrs}h delay`;
    }
  } else {
    const remMins = targetTotalMinutes - currentMinutes;
    if (remMins > 0) {
      if (remMins < 60) {
        statusDetail = `Due in ${remMins}m`;
      } else {
        const hrs = Math.floor(remMins / 60);
        const mins = remMins % 60;
        statusDetail = mins > 0 ? `Due in ${hrs}h ${mins}m` : `Due in ${hrs}h`;
      }
    } else {
      statusDetail = 'Due Now';
    }
  }

  return { time, period, isOverdue, statusDetail };
}

export function mapRawTaskToMobile(item: RawDailyTask): MobileTaskItem {
  const timing = parseTaskTiming(item);
  const rawStatus = item.status || 'Pending';
  const rawStatusLower = rawStatus.toLowerCase();
  const isCompleted = rawStatusLower === 'completed' || rawStatusLower === 'done';
  const isSkipped = rawStatusLower === 'skipped' || rawStatusLower === 'missed';
  const isRefused = rawStatusLower === 'refused';
  const isOverdue = !isCompleted && !isSkipped && !isRefused && timing.isOverdue;

  let status: 'Completed' | 'Overdue' | 'Pending' | 'Skipped' | 'Refused' = 'Pending';
  if (isCompleted) {
    status = 'Completed';
  } else if (isRefused) {
    status = 'Refused';
  } else if (isSkipped) {
    status = 'Skipped';
  } else if (isOverdue) {
    status = 'Overdue';
  }

  const bedLabel = item.resident?.bed?.bedLabel?.trim();
  const bedNum = item.resident?.bed?.number?.trim();
  const roomNum = item.resident?.bed?.room?.roomNumber?.trim();

  const rawBed = bedLabel || bedNum || '';
  const bedNumber = rawBed || roomNum || '';
  const locationDisplay =
    roomNum && rawBed
      ? `Room ${roomNum} · Bed ${rawBed}`
      : roomNum
        ? `Room ${roomNum}`
        : rawBed
          ? `Bed ${rawBed}`
          : 'Room unassigned';
  const roomDisplay = roomNum
    ? `Room ${roomNum}`
    : bedNum
      ? `Bed ${bedNum}`
      : bedLabel
        ? `Bed ${bedLabel}`
        : 'Room unassigned';

  const timeSlot = item.timeSlot || undefined;
  const dueBy =
    timeSlot?.toLowerCase() === 'allday'
      ? 'continuous'
      : timeSlot
        ? `by ${timeSlot}`
        : 'by 12:00';

  const targetTime = item.targetTime ?? item.carePlanTask?.targetTime ?? timing.time;
  const category = item.category || item.carePlanTask?.category || 'Plan v1';
  const goalTitle = item.carePlanTask?.goal?.title || undefined;
  const instructions =
    item.carePlanTask?.instructions ||
    item.instructions ||
    item.description ||
    '';

  const residentId = item.resident?.id || item.residentId || '';
  const residentName = item.resident?.fullName || 'Person Supported';

  return {
    id: item.id,
    source: 'legacy',
    residentId,
    residentName,
    residentAvatar: item.resident?.photoUrl || undefined,
    bedNumber,
    roomDisplay,
    locationDisplay,
    title: item.title,
    time: timing.time,
    period: timing.period,
    timeSlot,
    dueBy,
    targetTime,
    category,
    goalTitle,
    instructions,
    description: instructions,
    priority: item.priority || item.carePlanTask?.priority || undefined,
    escalateIfSkipped: Boolean(item.carePlanTask?.escalateIfSkipped),
    assignedStaffId: item.assignedStaffId || item.assignedStaff?.id || undefined,
    assignedStaffName: item.assignedStaff?.fullName || undefined,
    status,
    rawStatus,
    statusDetail: timing.statusDetail,
    completedAt: item.completedAt ? formatUkTime(item.completedAt) : undefined,
    completedByName: item.completedBy?.fullName || undefined,
    notes: item.notes || undefined,
    skipReason: item.skipReason || undefined,
    scheduledDate: item.scheduledDate,
  };
}

export function mapCareTaskToMobile(
  item: CareTaskListItemDTO,
  resident: Resident,
  date: string,
  shift: CareTaskDayDTO['shift'],
): MobileTaskItem {
  const mapped = mapRawTaskToMobile({
    id: item.taskId,
    residentId: resident.id,
    title: item.title,
    description: item.description,
    instructions: item.description,
    category: item.carePlan.area,
    status:
      item.status === 'Done'
        ? 'Completed'
        : item.status === 'Declined'
          ? 'Skipped'
          : 'Pending',
    scheduledDate: date,
    targetTime: item.time,
    timeSlot: shift,
    completedAt: item.status === 'Done' ? item.record?.recordedAt : undefined,
    completedBy: item.status === 'Done' && item.record?.recordedByName
      ? { fullName: item.record.recordedByName }
      : undefined,
    notes: item.status === 'Done' ? item.record?.note : undefined,
    skipReason: item.status === 'Declined' ? item.record?.note : undefined,
    resident: {
      id: resident.id,
      fullName: resident.fullName,
      photoUrl: resident.photoUrl,
      bed: {
        number: resident.bedNumber,
        room: { roomNumber: resident.roomNumber },
      },
    },
  });

  return { ...mapped, source: 'care-plan' };
}
