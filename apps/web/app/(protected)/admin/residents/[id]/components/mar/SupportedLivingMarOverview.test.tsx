import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type {
  MedicationPrescriptionRow,
  MedicationRoundRow,
} from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import { SupportedLivingMarOverview } from "./SupportedLivingMarOverview";

const yesterday: MedicationRoundRow = {
  id: "yesterday-dose",
  prescriptionId: "rx",
  drugName: "Recorded medicine",
  dose: "5 mg",
  form: "Tablet",
  route: null,
  frequency: null,
  instructions: null,
  imageUrls: [],
  status: "Administered",
  scheduledTime: "2026-11-12T10:00:00Z",
  administrations: [
    {
      id: "administration",
      status: "Given",
      administeredAt: "2026-11-12T10:10:00Z",
      createdAt: "2026-11-12T10:10:00Z",
      performedBy: null,
    },
  ],
};
const today = {
  ...yesterday,
  id: "today-dose",
  scheduledTime: "2026-11-13T10:00:00Z",
  status: "Pending",
  administrations: [],
};
const rx: MedicationPrescriptionRow = {
  id: "rx",
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
  rounds: [yesterday, today],
};

describe("supported living MAR overview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T12:00:00Z"));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows honest empty states without the sample medicine, doctor, stock or perfect adherence", () => {
    render(
      <SupportedLivingMarOverview
        prescriptions={[]}
        prnCount={0}
        onAddMedication={vi.fn()}
        onAdministerRound={vi.fn()}
      />,
    );
    expect(
      screen.getByText("No MAR prescriptions or scheduled doses recorded."),
    ).toBeInTheDocument();
    expect(screen.getByText("No doses due")).toBeInTheDocument();
    expect(
      screen.queryByText(/Levothyroxine|Dr A\. Malik|21 days stock|100%/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "No scheduled medication doses recorded for this period.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the backend medicine and counts only its actual due doses", () => {
    render(
      <SupportedLivingMarOverview
        prescriptions={[rx]}
        prnCount={0}
        onAddMedication={vi.fn()}
        onAdministerRound={vi.fn()}
      />,
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(
      screen.getByText("1 of 2 due scheduled doses given"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Recorded medicine")).toHaveLength(2);
    expect(screen.getByText("Prescriber not recorded")).toBeInTheDocument();
  });

  it("opens today's actual round and keeps past doses read-only", () => {
    const administer = vi.fn();
    render(
      <SupportedLivingMarOverview
        prescriptions={[rx]}
        prnCount={0}
        onAddMedication={vi.fn()}
        onAdministerRound={administer}
      />,
    );
    const previous = screen.getByRole("button", { name: /12 Nov: Given/ });
    expect(previous).toBeDisabled();
    const current = screen.getByRole("button", {
      name: /13 Nov: Not recorded/,
    });
    fireEvent.click(current);
    expect(administer).toHaveBeenCalledExactlyOnceWith(today);
  });

  it("uses a recorded stock balance and leaves missing balances unknown", () => {
    render(
      <SupportedLivingMarOverview
        prescriptions={[rx]}
        prnCount={0}
        stockLedger={[
          {
            residentId: "person",
            prescriptionId: "rx",
            drugName: "Recorded medicine",
            transactionType: "Received",
            quantityDelta: 12,
            balanceAfter: 12,
          },
        ]}
        onAddMedication={vi.fn()}
        onAdministerRound={vi.fn()}
      />,
    );
    expect(screen.getByText("Recorded stock balance: 12")).toBeInTheDocument();
    expect(
      screen.queryByText(/All stock above 7 days|21 days stock/),
    ).not.toBeInTheDocument();
  });

  it("does not present a failed stock request as zero alerts", () => {
    const retry = vi.fn();
    render(
      <SupportedLivingMarOverview
        prescriptions={[rx]}
        prnCount={0}
        stockError
        onRetryStock={retry}
        onAddMedication={vi.fn()}
        onAdministerRound={vi.fn()}
      />,
    );
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry stock balances" }),
    );
    expect(retry).toHaveBeenCalledOnce();
  });

  it("shows medicines saved in onboarding even when no MAR prescription exists", () => {
    render(
      <SupportedLivingMarOverview
        prescriptions={[]}
        prnCount={0}
        onboardingMedicines={[
          {
            name: "Onboarding medicine",
            dose: "10 mg",
            form: "Tablet",
            route: "Oral",
            prn: false,
            prescriber: "Saved prescriber",
            times: ["09:00"],
          },
        ]}
        onAddMedication={vi.fn()}
        onAdministerRound={vi.fn()}
      />,
    );
    expect(screen.getByText("Onboarding medicine")).toBeInTheDocument();
    expect(
      screen.getByText("Prescriber: Saved prescriber"),
    ).toBeInTheDocument();
    expect(screen.getByText("Timing: 09:00")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No scheduled medication doses recorded for this period.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps saved future and ended prescriptions visible instead of filtering them out", () => {
    const future = {
      ...rx,
      drugName: "Future saved medicine",
      startDate: "2026-12-01T00:00:00Z",
      endDate: "2026-12-31T00:00:00Z",
      rounds: [],
    };
    const ended = {
      ...rx,
      id: "ended",
      drugName: "Ended saved medicine",
      endDate: "2026-11-01T00:00:00Z",
      rounds: [],
    };
    render(
      <SupportedLivingMarOverview
        prescriptions={[future, ended]}
        prnCount={0}
        onAddMedication={vi.fn()}
        onAdministerRound={vi.fn()}
      />,
    );
    expect(screen.getByText("Future saved medicine")).toBeInTheDocument();
    expect(screen.getByText("Ended saved medicine")).toBeInTheDocument();
    expect(screen.getByText("No doses due")).toBeInTheDocument();
  });
});
