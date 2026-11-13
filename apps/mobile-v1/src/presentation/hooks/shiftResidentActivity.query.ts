import { GET_RESIDENT_TIMELINE } from '@repo/endpoints';
import type { Resident } from '../../domain/entities/Resident';
import { makeMobileApiCall } from '../../data/api/client';
import type { ResidentTimelineItem } from './useResidentDetail';

export interface ShiftResidentActivity extends ResidentTimelineItem {
  residentName: string;
  residentId: string;
  activityKind: 'medication' | 'task';
  title: string;
}

const UUID_PATTERN = /\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/gi;

/** Resolve known names and hide identifiers whose display names are unavailable. */
export function activityDisplayText(text: string, names: ReadonlyMap<string, string>): string {
  return text
    .replace(UUID_PATTERN, (id) => (names.get(id.toLowerCase()) ?? '').replace(UUID_PATTERN, ''))
    .replace(/\[(?:Resident|Person Supported|Staff|User):\s*\]/gi, '')
    .replace(/\[Resident:/gi, '[Person Supported:')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function activityKind(
  activity: ResidentTimelineItem,
): ShiftResidentActivity['activityKind'] | null {
  const event = activity.eventType.replace(/[^a-z0-9]/gi, '').toUpperCase();
  if (
    [
      'MEDICATIONADMINISTERED',
      'MEDICATIONADMINISTEREDADHOC',
      'MEDICATIONADMINISTRATIONAMENDED',
      'MEDICATIONNOTE',
      'MEDICATION',
    ].includes(event)
  )
    return 'medication';

  if (
    [
      'TASKCOMPLETED',
      'TASKSKIPPED',
      'TASKDECLINED',
      'CARETASKCOMPLETED',
      'CARETASKDECLINED',
    ].includes(event)
  ) {
    return 'task';
  }
  // Legacy timeline tasks include scheduled items; only recorded outcomes are activity.
  if (
    event.startsWith('TASK') &&
    'status' in activity &&
    (activity.status === 'Completed' || activity.status === 'Skipped')
  )
    return 'task';
  return null;
}

export function mapSupportActivity(
  activity: ResidentTimelineItem,
  resident: Pick<Resident, 'id' | 'fullName'>,
  names: ReadonlyMap<string, string>,
): ShiftResidentActivity | null {
  if ('residentId' in activity && activity.residentId !== resident.id) return null;
  const kind = activityKind(activity);
  if (!kind || !Number.isFinite(new Date(activity.timestamp).getTime())) return null;
  const displayNames = new Map(names);
  displayNames.set(resident.id.toLowerCase(), resident.fullName);
  const carerId =
    activity.carer && 'id' in activity.carer && typeof activity.carer.id === 'string'
      ? activity.carer.id.toLowerCase()
      : null;
  if (carerId && activity.carer?.fullName && !displayNames.has(carerId)) {
    displayNames.set(carerId, activity.carer.fullName);
  }
  const carerName = (carerId ? displayNames.get(carerId) : null) ?? activity.carer?.fullName ?? '';
  const event = activity.eventType.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const title =
    'title' in activity && typeof activity.title === 'string'
      ? activity.title
      : kind === 'task'
        ? 'Task activity'
        : ['MEDICATIONNOTE', 'MEDICATION'].includes(event)
          ? 'Medication note'
          : event === 'MEDICATIONADMINISTRATIONAMENDED'
            ? 'Medication record amended'
            : 'Medication administration';

  return {
    ...activity,
    activityKind: kind,
    residentId: resident.id,
    residentName: activityDisplayText(resident.fullName, displayNames) || 'Person supported',
    title:
      activityDisplayText(title, displayNames) ||
      (kind === 'task' ? 'Task activity' : 'Medication activity'),
    summary: activityDisplayText(activity.summary, displayNames),
    carer: { fullName: activityDisplayText(carerName, displayNames) || 'Staff member' },
  };
}

/** The resident detail feed follows the same assignment and event rules as the dashboard. */
export function residentSupportActivities(
  resident: Pick<Resident, 'id' | 'fullName'>,
  timeline: ResidentTimelineItem[],
  assignedResidents: Pick<Resident, 'id' | 'fullName'>[],
  now = Date.now(),
): ShiftResidentActivity[] {
  if (!assignedResidents.some((assigned) => assigned.id === resident.id)) return [];
  const names = new Map(
    assignedResidents.map((assigned) => [assigned.id.toLowerCase(), assigned.fullName]),
  );
  return timeline
    .map((event) => mapSupportActivity(event, resident, names))
    .filter(
      (event): event is ShiftResidentActivity =>
        event !== null && new Date(event.timestamp).getTime() <= now,
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

export async function loadAssignedSupportActivity(
  residents: Resident[],
  currentUserId?: string,
  currentUserName?: string,
): Promise<ShiftResidentActivity[]> {
  const names = new Map(
    residents.map((resident) => [resident.id.toLowerCase(), resident.fullName]),
  );
  if (currentUserId && currentUserName) names.set(currentUserId.toLowerCase(), currentUserName);
  const groups = await Promise.all(
    residents.map(async (resident) => {
      const timeline = await makeMobileApiCall<ResidentTimelineItem[]>(
        GET_RESIDENT_TIMELINE,
        undefined,
        undefined,
        { id: resident.id },
      );
      if (!Array.isArray(timeline)) throw new Error('Unable to load support activity');
      return timeline
        .map((event) => mapSupportActivity(event, resident, names))
        .filter((event): event is ShiftResidentActivity => event !== null);
    }),
  );
  return groups
    .flat()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);
}
