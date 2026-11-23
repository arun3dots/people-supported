import { describe, expect, it } from "vitest";
import type { CreateMedicationStockTransactionDTO } from "@repo/schema";
import type {
  MedicationPrescriptionRow,
  MedicationRoundRow,
} from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import {
  buildMarMatrixRows,
  canRecordMarRound,
  currentRegularMedicines,
  isPrnRound,
  latestAdministration,
  marAdherence,
  marRoundState,
  prescriptionStockBalances,
  recordedDay,
} from "./supportedLivingMarData";

export const now = new Date("2026-11-13T12:00:00Z");
export function dose(
  id: string,
  scheduledTime: string,
  outcome?: string,
): MedicationRoundRow {
  return {
    id,
    prescriptionId: "rx-1",
    drugName: "Recorded medicine",
    dose: "5 mg",
    form: "Tablet",
    route: null,
    frequency: null,
    instructions: null,
    imageUrls: [],
    scheduledTime,
    status: "Pending",
    administrations: outcome
      ? [
          {
            id: `admin-${id}`,
            status: outcome,
            administeredAt: scheduledTime,
            createdAt: scheduledTime,
            performedBy: null,
          },
        ]
      : [],
  };
}
export function prescription(
  rounds: MedicationRoundRow[],
): MedicationPrescriptionRow {
  return {
    id: "rx-1",
    drugName: "Recorded medicine",
    dose: "5 mg",
    form: "Tablet",
    instructions: null,
    imageUrls: [],
    times: ["10:00"],
    startDate: "2026-11-01T00:00:00Z",
    endDate: "2026-11-30T00:00:00Z",
    allowLateAdministration: true,
    mandatoryObservations: [],
    status: "Active",
    stopReason: null,
    supersedesId: null,
    pauses: [],
    rounds,
  };
}
const days = ["2026-11-12", "2026-11-13"];

describe("MAR from recorded backend data", () => {
  it("has no invented medicine, dose or adherence when records are empty", () => {
    const rows = buildMarMatrixRows([], [], days);
    expect(rows).toEqual([]);
    expect(marAdherence(rows, now)).toEqual({
      totalDue: 0,
      totalGiven: 0,
      pct: null,
    });
    expect(buildMarMatrixRows([prescription([])], [], days)).toEqual([]);
  });

  it("groups a medicine/time once and retains the correct dose ID on each date", () => {
    const rounds = [
      dose("yesterday", "2026-11-12T10:00:00Z", "Given"),
      dose("today", "2026-11-13T10:00:00Z"),
    ];
    const rows = buildMarMatrixRows([prescription(rounds)], rounds, days);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.rounds.map((round) => round.id)).toEqual([
      "yesterday",
      "today",
    ]);
    expect(rows[0]?.timeLabel).toBe("10:00");
  });

  it("counts actual due doses once, excludes future and cancelled doses, and does not mark missing records given", () => {
    const rounds = [
      dose("given", "2026-11-12T10:00:00Z", "Given"),
      dose("refused", "2026-11-13T10:00:00Z", "Refused"),
      dose("unrecorded", "2026-11-13T11:00:00Z"),
      dose("future", "2026-11-13T18:00:00Z"),
      { ...dose("cancelled", "2026-11-13T09:00:00Z"), status: "Cancelled" },
      dose("outside", "2026-10-01T10:00:00Z", "Given"),
    ];
    expect(
      marAdherence(buildMarMatrixRows([prescription(rounds)], [], days), now),
    ).toEqual({ totalDue: 3, totalGiven: 1, pct: 33 });
  });

  it("keeps a late administration on the scheduled dose's calendar date", () => {
    const round = dose("late", "2026-11-12T23:00:00Z", "Given");
    round.administrations[0]!.administeredAt = "2026-11-13T00:30:00Z";
    expect(recordedDay(round.scheduledTime)).toBe("2026-11-12");
    expect(marRoundState(round, now)).toBe("Given");
  });

  it("retains stopped prescription history without counting it as a current medicine", () => {
    const rx = {
      ...prescription([dose("given", "2026-11-12T10:00:00Z", "Given")]),
      status: "Stopped" as const,
    };
    expect(buildMarMatrixRows([rx], [], days)).toHaveLength(1);
    expect(currentRegularMedicines([rx], [], "2026-11-13")).toEqual([]);
  });

  it("does not use deleted or superseded administrations as the current outcome", () => {
    const round = dose("corrected", "2026-11-13T10:00:00Z", "Omitted");
    round.administrations.push({
      ...round.administrations[0]!,
      id: "old",
      status: "Given",
      isSuperseded: true,
    });
    round.administrations.push({
      ...round.administrations[0]!,
      id: "deleted",
      status: "Given",
      deletedAt: "2026-11-13T11:00:00Z",
    });
    expect(latestAdministration(round)?.status).toBe("Omitted");
  });

  it("only enables the actual unrecorded due dose today", () => {
    expect(canRecordMarRound(dose("today", "2026-11-13T10:00:00Z"), now)).toBe(
      true,
    );
    expect(
      canRecordMarRound(dose("yesterday", "2026-11-12T10:00:00Z"), now),
    ).toBe(false);
    expect(canRecordMarRound(dose("future", "2026-11-13T18:00:00Z"), now)).toBe(
      false,
    );
    expect(
      canRecordMarRound(
        dose("refused", "2026-11-13T10:00:00Z", "Refused"),
        now,
      ),
    ).toBe(false);
  });

  it("uses UK calendar days at the BST midnight boundary", () => {
    expect(recordedDay("2026-07-12T23:30:00Z")).toBe("2026-07-13");
  });

  it("includes actual standalone scheduled medicines and recognizes PRN forms", () => {
    const round = {
      ...dose("single", "2026-11-13T10:00:00Z"),
      prescriptionId: null,
    };
    expect(currentRegularMedicines([], [round], "2026-11-13")).toHaveLength(1);
    expect(isPrnRound({ ...round, form: "Liquid (PRN)" })).toBe(true);
    expect(buildMarMatrixRows([], [{ ...round, isAdhoc: true }], days)).toEqual(
      [],
    );
  });

  it("uses the latest linked stock balance without assigning unknown stock a healthy value", () => {
    const ledger: CreateMedicationStockTransactionDTO[] = [
      {
        residentId: "person",
        prescriptionId: "rx-1",
        drugName: "Recorded medicine",
        transactionType: "Adjusted",
        quantityDelta: -10,
        balanceAfter: 0,
      },
      {
        residentId: "person",
        prescriptionId: "rx-1",
        drugName: "Recorded medicine",
        transactionType: "Received",
        quantityDelta: 10,
        balanceAfter: 10,
      },
    ];
    const balances = prescriptionStockBalances(ledger);
    expect(balances.get("rx-1")).toBe(0);
    expect(balances.has("unrecorded")).toBe(false);
  });
});
