import { Resident } from '../../domain/entities/Resident';
import { formatUkTime } from '../../lib/date';
import { parseShiftTimestamp } from './useClockInEligibility';

export interface HandoverPersonInfo {
  id?: string;
  name: string;
  role: string;
  shiftHours: string;
  avatarUrl?: string | null;
}

export interface PreviousShiftHandoverInfo {
  shiftName?: string | null;
  staffName?: string | null;
  endTime?: string | Date | null;
  handoverNotes: string;
}

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
  urgentAlertsCount: number;
  incidentCount: number;
  status?: string;
  isStarted?: boolean;
  isCompleted?: boolean;
  shiftNotes?: string | null;
  nextShiftName?: string | null;
  nextShiftStartTime?: string | null;
  nextShiftHandoverPerson?: HandoverPersonInfo | null;
  previousShiftHandover?: PreviousShiftHandoverInfo | null;
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
  shiftNotes?: string | null;
  notes?: string | null;
  previousShiftHandover?: PreviousShiftHandoverInfo | null;
  nextShift?: {
    name?: string | null;
    startTime?: string | null;
    handoverPerson?: HandoverPersonInfo | null;
  } | null;
}

export function normalizeShiftTimeRemaining(
  value: string | null | undefined,
  isStarted: boolean,
  isCompleted: boolean
): string | undefined {
  if (isCompleted) return 'Shift ended';
  if (value?.trim().toLowerCase() === 'shift ended') {
    return 'Shift ended';
  }
  return value || undefined;
}

export function isShiftPast(
  shift?: {
    rawStartTime?: string | Date;
    rawEndTime?: string | Date;
    startTime?: string;
    endTime?: string;
  } | null
): boolean {
  if (!shift?.rawEndTime && !shift?.endTime) return false;
  const startMs = parseShiftTimestamp(shift.rawStartTime, shift.startTime, shift.rawStartTime);
  let endMs = parseShiftTimestamp(shift.rawEndTime, shift.endTime, shift.rawStartTime);
  if (startMs && endMs && endMs <= startMs) {
    endMs += 24 * 60 * 60 * 1000;
  }
  return Boolean(endMs && endMs < Date.now());
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
  const isStarted = !isCompleted && !isPast && Boolean(item.isStarted);
  const status = isCompleted
    ? 'Completed'
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
    isCompleted
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
  return apiResidents.map((r, idx) => ({
    id: r.id || `res_${idx}`,
    fullName: r.fullName || 'Resident',
    roomNumber: r.roomNumber || '',
    bedNumber: r.bedNumber || '',
    wingName: r.wingName || '',
    dateOfBirth: '',
    age: r.age ?? 0,
    gender: r.gender || 'Not specified',
    status: 'Active',
    allergies: [],
    dnacpr: false,
    photoUrl: r.photoUrl || null,
    riskRatings: { fallRisk: 'Low', pressureUlcerRisk: 'Low', chokingRisk: 'Low' },
    mustScore: 0,
    fluidTargetMl: 2000,
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
  if (!rawResidentsList || rawResidentsList.length === 0) return residents;

  const locMap = new Map<string, { roomNumber: string; bedNumber: string; wingName: string }>();
  rawResidentsList.forEach((item) => {
    const bed = item.bed as
      | {
          bedLabel?: string;
          number?: string;
          wingName?: string;
          room?: { roomNumber?: string; wing?: { name?: string } };
        }
      | undefined;
    const roomNum = bed?.room?.roomNumber || (item.roomNumber as string) || '';
    const rawBed = bed?.bedLabel || bed?.number || (item.bedNumber as string) || '';
    const rawWing =
      bed?.wingName ||
      bed?.room?.wing?.name ||
      (item.wingName as string) ||
      '';
    if (item.id) {
      locMap.set(String(item.id), {
        roomNumber: roomNum,
        bedNumber: rawBed,
        wingName: rawWing,
      });
    }
  });

  return residents.map((r) => {
    const loc = locMap.get(r.id);
    if (!loc) return r;
    return {
      ...r,
      roomNumber: loc.roomNumber || r.roomNumber,
      bedNumber: loc.bedNumber || r.bedNumber,
      wingName: loc.wingName || r.wingName,
    };
  });
}
