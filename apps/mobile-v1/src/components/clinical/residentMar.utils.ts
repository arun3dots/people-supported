import { formatUkTime, formatUkDate, getUkDateString } from '../../lib/date';
import type {
  ScheduledMedication,
  PrnMedication,
  RecentMedicationAdmin,
} from './residentMar.types';

export function mapRawRoundsToMarLists(rawRounds: Array<Record<string, unknown>>): {
  scheduledList: ScheduledMedication[];
  prnList: PrnMedication[];
  recentList: RecentMedicationAdmin[];
} {
  const scheduled: ScheduledMedication[] = [];
  const prn: PrnMedication[] = [];
  const recent: RecentMedicationAdmin[] = [];

  for (const round of rawRounds) {
    const isPrn = Boolean(
      round.isPRN ||
      round.isAdhoc ||
      String(round.form || '').toLowerCase().includes('prn')
    );
    const rawStatus = String(round.status || 'Due');
    const status: ScheduledMedication['status'] =
      rawStatus === 'Administered'
        ? 'Administered'
        : rawStatus === 'Missed'
          ? 'Missed'
          : rawStatus === 'On Hold' || rawStatus === 'Withheld'
            ? 'On Hold'
            : 'Due';

    const timeStr = round.scheduledTime
      ? formatUkTime(round.scheduledTime)
      : '08:00 AM';

    if (isPrn) {
      prn.push({
        id: String(round.id),
        drugName: String(round.drugName || 'Medication'),
        dose: String(round.dose || '1 Dose'),
        route: String(round.route || 'Oral'),
        indication:
          typeof round.instructions === 'string'
            ? round.instructions
            : 'As needed',
        maxDose: 'As prescribed',
        isControlledDrug: Boolean(round.isControlledDrug),
        notes:
          typeof round.instructions === 'string'
            ? round.instructions
            : undefined,
      });
    } else {
      scheduled.push({
        id: String(round.id),
        drugName: String(round.drugName || 'Medication'),
        dose: String(round.dose || '1 Dose'),
        route: String(round.route || 'Oral'),
        frequency: 'Daily',
        scheduledTime: timeStr,
        prescribedBy: 'Prescribing Clinician',
        startDate: round.createdAt ? formatUkDate(round.createdAt) : 'Active',
        notes:
          typeof round.instructions === 'string' && round.instructions
            ? round.instructions
            : 'Take as directed',
        status,
        isControlledDrug: Boolean(round.isControlledDrug),
        rawScheduledDate: round.scheduledTime as string | Date | null,
      });
    }

    const admins = Array.isArray(round.administrations)
      ? round.administrations
      : [];
    for (const adm of admins) {
      const admCarer = adm.carer as Record<string, unknown> | undefined;
      recent.push({
        id: String(adm.id || `adm-${Math.random()}`),
        drugName: String(round.drugName || 'Medication'),
        dose: String(round.dose || '1 Dose'),
        route: String(round.route || 'Oral'),
        time: adm.administeredAt ? formatUkTime(adm.administeredAt) : timeStr,
        dateStr: adm.administeredAt
          ? formatUkDate(adm.administeredAt, { day: 'numeric', month: 'short' })
          : 'Today',
        administeredBy: String(
          admCarer?.fullName || adm.witnessName || 'Care Staff'
        ),
      });
    }
  }

  return { scheduledList: scheduled, prnList: prn, recentList: recent };
}

export function filterScheduledByDate(
  scheduledList: ScheduledMedication[],
  scheduleFilter: 'today' | 'all'
): ScheduledMedication[] {
  if (scheduleFilter === 'all') return scheduledList;
  const todayStr = getUkDateString(new Date());
  return scheduledList.filter((s) => {
    if (!s.rawScheduledDate) return true;
    try {
      return getUkDateString(s.rawScheduledDate) === todayStr;
    } catch {
      return true;
    }
  });
}

