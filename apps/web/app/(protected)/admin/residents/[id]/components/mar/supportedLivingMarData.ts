import type { CreateMedicationStockTransactionDTO } from "@repo/schema";
import type {
  MedicationPrescriptionRow,
  MedicationRoundRow,
} from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import {
  formatUkTime,
  getUkDateString,
} from "../../../../../../../lib/utils/uk-date-time";

export interface MarMatrixRow {
  id: string;
  drugName: string;
  doseAndForm: string;
  timeLabel: string;
  rounds: MedicationRoundRow[];
}

export function recordedDay(value: string | null | undefined): string | null {
  if (!value || !Number.isFinite(new Date(value).getTime())) return null;
  return getUkDateString(value);
}

export function latestAdministration(round: MedicationRoundRow) {
  return [...(round.administrations ?? [])]
    .filter((entry) => !entry.deletedAt && !entry.isSuperseded)
    .sort(
      (a, b) =>
        (Date.parse(b.administeredAt || b.createdAt) || 0) -
        (Date.parse(a.administeredAt || a.createdAt) || 0),
    )[0];
}

export function isPrnRound(round: MedicationRoundRow): boolean {
  return (
    round.isPRN === true ||
    round.isAdhoc === true ||
    /\bPRN\b/i.test(round.form ?? "")
  );
}

export function isCurrentPrescription(
  rx: MedicationPrescriptionRow,
  today: string,
): boolean {
  const start = recordedDay(rx.startDate);
  const end = recordedDay(rx.endDate);
  return (
    rx.status === "Active" &&
    Boolean(start && end && start <= today && today <= end)
  );
}

export function currentRegularMedicines(
  prescriptions: MedicationPrescriptionRow[],
  rounds: MedicationRoundRow[],
  today: string,
  includeAll = false,
) {
  const medicines = prescriptions
    .filter((rx) => includeAll || isCurrentPrescription(rx, today))
    .map((rx) => ({
      id: rx.id,
      stockId: rx.id as string | null,
      drugName: rx.drugName,
      dose: rx.dose,
      form: rx.form as string | null,
      instructions: rx.instructions,
      times: rx.times,
      label: includeAll ? rx.status : "Regular",
      startDate: rx.startDate as string | null,
      endDate: rx.endDate as string | null,
    }));
  const standalone = new Map<string, (typeof medicines)[number]>();
  rounds
    .filter(
      (round) =>
        !round.prescriptionId &&
        !isPrnRound(round) &&
        (includeAll || recordedDay(round.scheduledTime) === today) &&
        (includeAll ||
          !["Stopped", "Cancelled", "Canceled", "Paused", "On Hold"].includes(
            round.status,
          )),
    )
    .forEach((round) => {
      const key = JSON.stringify([
        round.drugName,
        round.dose,
        round.form,
        round.route,
        includeAll ? recordedDay(round.scheduledTime) : null,
      ]);
      const existing = standalone.get(key);
      const time = recordedDay(round.scheduledTime)
        ? formatUkTime(round.scheduledTime!)
        : null;
      if (existing)
        existing.times = [
          ...new Set([...existing.times, ...(time ? [time] : [])]),
        ].sort();
      else
        standalone.set(key, {
          id: round.id,
          stockId: null,
          drugName: round.drugName,
          dose: round.dose,
          form: round.form,
          instructions: round.instructions,
          times: time ? [time] : [],
          label: includeAll ? round.status : "Scheduled",
          startDate: round.scheduledTime,
          endDate: null,
        });
    });
  return [...medicines, ...standalone.values()];
}

export function marRoundState(round: MedicationRoundRow, now: Date): string {
  const administration = latestAdministration(round);
  if (administration) return administration.status || "Not recorded";
  if (["Paused", "On Hold", "Withheld"].includes(round.status))
    return "On hold";
  if (["Stopped", "Cancelled", "Canceled"].includes(round.status))
    return "Cancelled";
  if (round.status === "Missed") return "Missed";
  if (round.status !== "Pending" && round.status !== "Due")
    return "Not recorded";
  return round.scheduledTime && new Date(round.scheduledTime) <= now
    ? "Not recorded"
    : "Not yet due";
}

export function canRecordMarRound(
  round: MedicationRoundRow,
  now: Date,
): boolean {
  return (
    !latestAdministration(round) &&
    ["Pending", "Due"].includes(round.status) &&
    recordedDay(round.scheduledTime) === getUkDateString(now) &&
    Boolean(round.scheduledTime && new Date(round.scheduledTime) <= now)
  );
}

/** One row per recorded medicine/time. Every cell retains its own dated round ID. */
export function buildMarMatrixRows(
  prescriptions: MedicationPrescriptionRow[],
  rounds: MedicationRoundRow[],
  days: string[],
): MarMatrixRow[] {
  const window = new Set(days);
  const groups = new Map<string, MarMatrixRow>();
  const seen = new Set<string>();
  const append = (
    round: MedicationRoundRow,
    prescription?: MedicationPrescriptionRow,
  ) => {
    const day = recordedDay(round.scheduledTime);
    if (
      !round.id ||
      !day ||
      !window.has(day) ||
      isPrnRound(round) ||
      seen.has(round.id)
    )
      return;
    seen.add(round.id);
    const timeLabel = formatUkTime(round.scheduledTime!);
    const drugName = prescription?.drugName ?? round.drugName;
    const dose = prescription?.dose ?? round.dose;
    const form = prescription?.form ?? round.form;
    const key = JSON.stringify([
      prescription?.id ?? null,
      drugName,
      dose,
      form,
      timeLabel,
    ]);
    const group = groups.get(key) ?? {
      id: key,
      drugName,
      doseAndForm:
        [dose, form].filter(Boolean).join(" ") || "Dose/form not recorded",
      timeLabel,
      rounds: [],
    };
    group.rounds.push(round);
    groups.set(key, group);
  };
  prescriptions.forEach((rx) =>
    rx.rounds.forEach((round) => append(round, rx)),
  );
  rounds
    .filter((round) => !round.prescriptionId)
    .forEach((round) => append(round));
  return [...groups.values()].sort(
    (a, b) =>
      a.drugName.localeCompare(b.drugName) ||
      a.timeLabel.localeCompare(b.timeLabel),
  );
}

export function marAdherence(rows: MarMatrixRow[], now: Date) {
  const due = rows
    .flatMap((row) => row.rounds)
    .filter((round) => {
      if (!round.scheduledTime || new Date(round.scheduledTime) > now)
        return false;
      return !["On hold", "Cancelled"].includes(marRoundState(round, now));
    });
  const totalGiven = due.filter(
    (round) => latestAdministration(round)?.status === "Given",
  ).length;
  return {
    totalDue: due.length,
    totalGiven,
    pct: due.length ? Math.round((totalGiven / due.length) * 100) : null,
  };
}

/** The backend orders the ledger newest first; unlinked balances cannot be attributed to a prescription. */
export function prescriptionStockBalances(
  ledger: CreateMedicationStockTransactionDTO[],
) {
  const balances = new Map<string, number>();
  ledger.forEach((entry) => {
    if (
      entry.prescriptionId &&
      !balances.has(entry.prescriptionId) &&
      Number.isFinite(entry.balanceAfter) &&
      entry.balanceAfter >= 0
    ) {
      balances.set(entry.prescriptionId, entry.balanceAfter);
    }
  });
  return balances;
}
