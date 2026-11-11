import { format, isToday } from "date-fns";
import type {
  MedicationPrescriptionRow,
  MedicationRoundRow,
} from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";

export interface MedGroup {
  key: string;
  isLegacy: boolean;
  status: MedicationPrescriptionRow["status"] | null;
  drugName: string;
  dose: string;
  form: string | null;
  route: string | null;
  instructions: string | null;
  imageUrls: string[];
  times: string[];
  rounds: MedicationRoundRow[];
}

function sortByTime(rounds: MedicationRoundRow[]): MedicationRoundRow[] {
  return [...rounds].sort((a, b) => (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""));
}

/** Legacy rounds (created before prescriptions existed) have no parent, so they are bucketed by their attributes. */
function legacyKey(round: MedicationRoundRow): string {
  return [
    round.drugName,
    round.dose,
    round.route,
    round.frequency,
    round.scheduledTime ? format(new Date(round.scheduledTime), "HH:mm") : "daily",
  ].join("|");
}

export function buildScheduledGroups(
  prescriptions: MedicationPrescriptionRow[],
  legacyRounds: MedicationRoundRow[],
  todayOnly: boolean,
): MedGroup[] {
  const keep = (round: MedicationRoundRow) =>
    !todayOnly || (Boolean(round.scheduledTime) && isToday(new Date(round.scheduledTime as string)));

  const prescriptionGroups: MedGroup[] = prescriptions
    .map((rx) => {
      const rounds = sortByTime(rx.rounds.filter(keep));
      return {
        key: `rx:${rx.id}`,
        isLegacy: false,
        status: rx.status,
        drugName: rx.drugName,
        dose: rx.dose,
        form: rx.form,
        route: rounds[0]?.route ?? null,
        instructions: rx.instructions,
        imageUrls: rx.imageUrls,
        times: rx.times,
        rounds,
      };
    })
    .filter((group) => group.rounds.length > 0);

  const legacyBuckets = new Map<string, MedicationRoundRow[]>();
  legacyRounds.filter(keep).forEach((round) => {
    const key = legacyKey(round);
    legacyBuckets.set(key, [...(legacyBuckets.get(key) ?? []), round]);
  });

  const legacyGroups: MedGroup[] = Array.from(legacyBuckets.entries()).map(([key, items]) => {
    const rounds = sortByTime(items);
    const first = rounds[0]!;
    return {
      key: `legacy:${key}`,
      isLegacy: true,
      status: null,
      drugName: first.drugName,
      dose: first.dose,
      form: first.form,
      route: first.route,
      instructions: first.instructions,
      imageUrls: first.imageUrls,
      times: first.scheduledTime ? [format(new Date(first.scheduledTime), "HH:mm")] : [],
      rounds,
    };
  });

  return [...prescriptionGroups, ...legacyGroups];
}

export function summarizeGroup(group: MedGroup) {
  const rounds = group.rounds;
  const total = rounds.length;
  const isGiven = (item: MedicationRoundRow) =>
    item.status === "Administered" || item.administrations[0]?.status === "Given";
  const takenCount = rounds.filter(isGiven).length;
  const missedCount = rounds.filter(
    (item) => item.status === "Missed" || item.administrations[0]?.status === "Missed",
  ).length;
  return {
    rounds,
    total,
    takenCount,
    lastAdmin: rounds.flatMap((item) => item.administrations)[0],
    pendingRound: rounds.find((item) => !isGiven(item)),
    isTaken: takenCount === total,
    isMissed: missedCount > 0 && takenCount + missedCount === total,
    dates: rounds
      .map((item) => item.scheduledTime)
      .filter(Boolean)
      .map((date) => new Date(date as string)),
  };
}
