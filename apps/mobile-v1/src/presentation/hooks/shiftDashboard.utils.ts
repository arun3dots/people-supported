import type { Resident } from '../../domain/entities/Resident';
import { enrichResidentFromRecord } from './residentRecordedData';
import type { ResidentDetailData } from './useResidentDetail';
import { formatUkTime } from '../../lib/date';
import { parseShiftTimestamp } from './useClockInEligibility';
import type { PreviousShiftHandoverDTO } from '@repo/schema';

export interface HandoverPersonInfo {
  id?: string;
  name: string;
  role: string;
  shiftHours: string;
  avatarUrl?: string | null;
}

export type PreviousShiftHandoverInfo = PreviousShiftHandoverDTO;

export interface ShiftInfo {
  id: string;
  name: string;
  wardName?: string;
  startTime: string;
  endTime: string;
  rawStartTime?: string | Date;
  rawEndTime?: string | Date;
  actualStartedTime?: string | null;
  timeRemainingStr?: string;
  tasksCompleted: number;
  tasksTotal: number;
  taskProgressLoading?: boolean;
  taskProgressError?: boolean;
  urgentAlertsCount: number;
  incidentCount: number;
  status?: string;
  isStarted?: boolean;
  isCompleted?: boolean;
  isContinuing?: boolean;
  hasContinuousNextShift?: boolean;
  shiftNotes?: string | null;
  handoverNotes?: string | null;
  nextShiftName?: string | null;
  nextShiftStartTime?: string | null;
  nextShiftHandoverPerson?: HandoverPersonInfo | null;
  previousShiftHandover?: PreviousShiftHandoverInfo | null;
  previousShiftHandovers?: PreviousShiftHandoverInfo[];
}

export interface ShiftDetailsApiResponse {
  assignedResidents?: Array<{
    id: string;
    fullName: string;
    roomNumber?: string | null;
    bedNumber?: string | null;
    wingName?: string | null;
    age?: number | null;
    gender?: string | null;
    flags?: string[];
    photoUrl?: string | null;
  }>;
  tasksCompleted?: number;
  tasksTotal?: number;
  incidentCount?: number;
  timeRemainingStr?: string | null;
  wardName?: string | null;
  isContinuing?: boolean;
  hasContinuousNextShift?: boolean;
  shiftNotes?: string | null;
  notes?: string | null;
  handoverNotes?: string | null;
  previousShiftHandover?: PreviousShiftHandoverInfo | null;
  previousShiftHandovers?: PreviousShiftHandoverInfo[];
  nextShift?: {
    name?: string | null;
    startTime?: string | null;
    handoverPerson?: HandoverPersonInfo | null;
  } | null;
}

export const CONTINUOUS_SHIFT_MAX_GAP_MS = 30 * 60 * 1000;

export interface ShiftScheduleTimestamps {
  id?: string;
  status?: string;
  rawStartTime?: string | Date;
  rawEndTime?: string | Date;
  startTime?: string;
  endTime?: string;
}

function parseFullDateTimestamp(value?: string | Date): number | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.getTime() : null;
  }
  const trimmed = value.trim();
  if (!trimmed || /^\d{1,2}:\d{2}/.test(trimmed)) return null;
  const ms = Date.parse(trimmed);
  return Number.isFinite(ms) ? ms : null;
}

export function resolveShiftStartEndMs(
  shift?: ShiftScheduleTimestamps | null,
): { startMs: number | null; endMs: number | null } {
  if (!shift?.rawEndTime && !shift?.endTime && !shift?.rawStartTime) {
    return { startMs: null, endMs: null };
  }
  const fullStartMs = parseFullDateTimestamp(shift.rawStartTime);
  const fullEndMs = parseFullDateTimestamp(shift.rawEndTime);
  if (fullStartMs !== null && fullEndMs !== null) {
    return { startMs: fullStartMs, endMs: fullEndMs };
  }
  const startMs =
    fullStartMs ?? parseShiftTimestamp(shift.rawStartTime, shift.startTime, shift.rawStartTime);
  let endMs =
    fullEndMs ?? parseShiftTimestamp(shift.rawEndTime, shift.endTime, shift.rawStartTime);
  if (startMs && endMs && endMs <= startMs) {
    endMs += 24 * 60 * 60 * 1000;
  }
  return { startMs, endMs };
}

export function isShiftPast(
  shift?: ShiftScheduleTimestamps | null,
  nowMs: number = Date.now(),
): boolean {
  const { endMs } = resolveShiftStartEndMs(shift);
  return Boolean(endMs && endMs < nowMs);
}

export function isContinuousNextShift(
  current?: ShiftScheduleTimestamps | null,
  candidate?: ShiftScheduleTimestamps | null,
): boolean {
  if (!current || !candidate) return false;
  if (current.id && candidate.id && current.id === candidate.id) return false;
  if (candidate.status === 'Cancelled' || candidate.status === 'Draft') return false;
  const { endMs: currentEndMs } = resolveShiftStartEndMs(current);
  const { startMs: nextStartMs, endMs: nextEndMs } = resolveShiftStartEndMs(candidate);
  if (!currentEndMs || !nextStartMs || !nextEndMs || nextEndMs <= nextStartMs) return false;
  const gapMs = nextStartMs - currentEndMs;
  return gapMs >= 0 && gapMs <= CONTINUOUS_SHIFT_MAX_GAP_MS;
}

export function formatContinuingTimeRemaining(
  shift?: ShiftScheduleTimestamps | null,
  nowMs: number = Date.now(),
): string {
  const { endMs } = resolveShiftStartEndMs(shift);
  if (!endMs || nowMs <= endMs) return 'Continuing';
  const totalMins = Math.floor((nowMs - endMs) / 60_000);
  if (totalMins < 1) return 'Continuing (just past end)';
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hrs === 0
    ? `Continuing (+${mins}m)`
    : `Continuing (+${hrs}h ${String(mins).padStart(2, '0')}m)`;
}

export function normalizeShiftTimeRemaining(
  value: string | null | undefined,
  isStarted: boolean,
  isCompleted: boolean,
  options?: {
    isContinuing?: boolean;
    shift?: ShiftScheduleTimestamps | null;
    nowMs?: number;
  },
): string | undefined {
  if (isCompleted) return 'Shift ended';
  if (isStarted && options?.isContinuing) {
    return options.shift
      ? formatContinuingTimeRemaining(options.shift, options.nowMs)
      : value && value.trim().toLowerCase().startsWith('continuing')
        ? value
        : 'Continuing';
  }
  if (value?.trim().toLowerCase() === 'shift ended') {
    return isStarted ? 'In progress' : 'Shift ended';
  }
  return value || undefined;
}

export function mapApiShift(item: Record<string, unknown> | null | undefined): ShiftInfo | null {
  if (!item || typeof item !== 'object' || !item.id) return null;

  const id = String(item.id);
  const name = String(
    item.name || (item.type as Record<string, unknown> | undefined)?.name || 'Shift'
  );
  const wardName = String(
    item.wardName ||
      (item.wing as Record<string, unknown> | undefined)?.name ||
      (item.unit as Record<string, unknown> | undefined)?.name ||
      ''
  );

  const rawStartTime = (item.rawStartTime || item.startTime) as string | Date | undefined;
  const rawEndTime = (item.rawEndTime || item.endTime) as string | Date | undefined;
  const startTime = rawStartTime
    ? formatUkTime(rawStartTime)
    : formatUkTime(item.formattedStartTime as string | undefined);
  const endTime = rawEndTime
    ? formatUkTime(rawEndTime)
    : formatUkTime(item.formattedEndTime as string | undefined);
  const actualStartedTime = item.actualStartedTime
    ? formatUkTime(item.actualStartedTime)
    : null;
  const isPast = isShiftPast({ rawStartTime, rawEndTime, startTime, endTime });
  const isCompleted =
    item.status === 'Completed' ||
    item.shiftStatus === 'Completed' ||
    Boolean(item.isCompleted);
  const hasContinuousNextShift = Boolean(item.hasContinuousNextShift);
  const hasStartedFlag =
    Boolean(item.isStarted) ||
    item.status === 'Continuing' ||
    item.shiftStatus === 'Continuing';
  const isStarted = !isCompleted && hasStartedFlag && !(isPast && hasContinuousNextShift);
  const isContinuing =
    isStarted && (isPast || Boolean(item.isContinuing) || item.status === 'Continuing');
  const status = isCompleted
    ? 'Completed'
    : isContinuing
      ? 'Continuing'
      : isPast
        ? 'Ended'
        : isStarted
          ? 'Started'
          : 'Scheduled';

  const tasksCompleted = typeof item.tasksCompleted === 'number' ? item.tasksCompleted : 0;
  const tasksTotal =
    typeof item.tasksTotal === 'number'
      ? item.tasksTotal
      : typeof item.totalTasksCount === 'number'
        ? item.totalTasksCount
        : 0;

  const timeRemainingStr = normalizeShiftTimeRemaining(
    typeof item.timeRemainingStr === 'string' ? item.timeRemainingStr : undefined,
    isStarted,
    isCompleted,
    {
      isContinuing,
      shift: { rawStartTime, rawEndTime, startTime, endTime },
    },
  );

  const shiftNotes =
    typeof item.shiftNotes === 'string' && item.shiftNotes.trim()
      ? item.shiftNotes.trim()
      : typeof item.notes === 'string' && item.notes.trim()
        ? item.notes.trim()
        : null;

  return {
    id,
    name,
    wardName,
    startTime,
    endTime,
    rawStartTime,
    rawEndTime,
    actualStartedTime,
    timeRemainingStr,
    tasksCompleted,
    tasksTotal,
    urgentAlertsCount: 0,
    incidentCount: typeof item.incidentCount === 'number' ? item.incidentCount : 0,
    status,
    isStarted,
    isCompleted,
    isContinuing,
    hasContinuousNextShift,
    shiftNotes,
    nextShiftName: null,
    nextShiftStartTime: null,
    nextShiftHandoverPerson: null,
    previousShiftHandover: null,
  };
}

export function mapAssignedResidents(
  apiResidents: ShiftDetailsApiResponse['assignedResidents']
): Resident[] {
  if (!apiResidents || apiResidents.length === 0) return [];
  return apiResidents.filter((r) => Boolean(r.id && r.fullName)).map((r) => ({
    id: r.id,
    fullName: r.fullName,
    roomNumber: r.roomNumber ?? '',
    bedNumber: r.bedNumber ?? undefined,
    wingName: r.wingName ?? undefined,
    dateOfBirth: '',
    age: r.age ?? undefined,
    gender: r.gender ?? '',
    photoUrl: r.photoUrl,
    riskRatings: {},
  }));
}

export function filterAssignedResidents(
  residents: Resident[],
  rawResidentsList: Array<Record<string, unknown>>,
): Resident[] {
  const assignedIds = new Set(
    rawResidentsList
      .map((resident) => resident.id)
      .filter((id): id is string => typeof id === 'string'),
  );
  return residents.filter((resident) => assignedIds.has(resident.id));
}

export function resolveAssignedResidents(
  residents: Resident[],
  response:
    | { data?: Array<Record<string, unknown>> }
    | Array<Record<string, unknown>>
    | null,
  isCarer: boolean,
): Resident[] {
  const rawResidentsList = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];
  const scopedResidents = isCarer
    ? filterAssignedResidents(residents, rawResidentsList)
    : residents;
  return enrichResidentsLocation(scopedResidents, rawResidentsList);
}

export function enrichResidentsLocation(
  residents: Resident[],
  rawResidentsList: Array<Record<string, unknown>>
): Resident[] {
  const records = new Map(rawResidentsList.map((item) => [item.id, item]));
  return residents.map((resident) => {
    const record = records.get(resident.id);
    return record ? enrichResidentFromRecord(resident, record as unknown as ResidentDetailData) : resident;
  });
}
