import { formatUkTime, formatUkDate, getUkDateString } from '../../lib/date';
import type {
  ScheduledMedication,
  PrnMedication,
  RecentMedicationAdmin,
} from './residentMar.types';

const recordedText = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : 'Not recorded';
const validDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

export function mapRawRoundsToMarLists(rawRounds: Array<Record<string, unknown>>): {
  scheduledList: ScheduledMedication[];
  prnList: PrnMedication[];
  recentList: RecentMedicationAdmin[];
} {
  const scheduled: ScheduledMedication[] = [];
  const prn: PrnMedication[] = [];
  const recent: RecentMedicationAdmin[] = [];
  for (const round of rawRounds) {
    if (typeof round.id !== 'string' || !round.id) continue;
    const admins = (Array.isArray(round.administrations) ? round.administrations : [])
      .map(asRecord)
      .filter((adm) => !adm.isSuperseded && !adm.deletedAt)
      .sort(
        (a, b) =>
          new Date(String(b.administeredAt)).getTime() -
          new Date(String(a.administeredAt)).getTime(),
      );
    const rawStatus = admins[0]?.status ?? round.status;
    const status: ScheduledMedication['status'] =
      rawStatus === 'Given' || rawStatus === 'Administered'
        ? 'Administered'
        : rawStatus === 'Pending' || rawStatus === 'Due'
          ? 'Due'
          : rawStatus === 'Missed'
            ? 'Missed'
            : rawStatus === 'On Hold' || rawStatus === 'Withheld' || rawStatus === 'Paused'
              ? 'On Hold'
              : rawStatus === 'Refused' || rawStatus === 'Omitted' || rawStatus === 'NPO'
                ? rawStatus
                : 'Not recorded';
    const base = {
      id: round.id,
      drugName: recordedText(round.drugName),
      dose: recordedText(round.dose),
      route: recordedText(round.route),
      isControlledDrug: round.isControlledDrug === true,
    };
    if (round.isPRN === true || round.isAdhoc === true) {
      prn.push({
        ...base,
        indication: recordedText(round.indication),
        maxDose: recordedText(round.maxDose),
        notes: recordedText(round.instructions),
      });
    } else {
      scheduled.push({
        ...base,
        frequency: recordedText(round.frequency),
        scheduledTime: validDate(round.scheduledTime)
          ? formatUkTime(round.scheduledTime)
          : 'Not recorded',
        prescribedBy: recordedText(round.prescriber),
        startDate: validDate(round.startDate) ? formatUkDate(round.startDate) : 'Not recorded',
        notes: recordedText(round.instructions),
        status,
        rawScheduledDate: validDate(round.scheduledTime) ? round.scheduledTime : null,
      });
    }
    for (const adm of admins) {
      if (typeof adm.id !== 'string' || !validDate(adm.administeredAt)) continue;
      recent.push({
        ...base,
        id: adm.id,
        status: recordedText(adm.status),
        recordedAt: adm.administeredAt,
        time: formatUkTime(adm.administeredAt),
        dateStr: formatUkDate(adm.administeredAt, { day: 'numeric', month: 'short' }),
        administeredBy: recordedText(asRecord(adm.carer).fullName),
      });
    }
  }
  recent.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  return { scheduledList: scheduled, prnList: prn, recentList: recent };
}

export function filterScheduledByDate(
  scheduledList: ScheduledMedication[],
  scheduleFilter: 'today' | 'all',
): ScheduledMedication[] {
  if (scheduleFilter === 'all') return scheduledList;
  const today = getUkDateString(new Date());
  return scheduledList.filter(
    (row) => row.rawScheduledDate && getUkDateString(row.rawScheduledDate) === today,
  );
}
