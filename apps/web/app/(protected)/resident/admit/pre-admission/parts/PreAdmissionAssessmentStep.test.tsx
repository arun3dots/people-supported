import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PreAdmissionAssessmentStep } from "./PreAdmissionAssessmentStep";

const mockSaveMutateAsync = vi.fn();
const mockSaveMutate = vi.fn();
const mockCreateMutate = vi.fn();

const sampleRisks = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Fall Risk",
    category: "Clinical",
    tool: "Morse Fall Scale",
    status: "Active",
    inherentScore: 16,
    inherentLevel: "High",
    residualScore: 12,
    residualLevel: "High",
    hazardDescription: "Requires assistance on stairs and has a history of one fall in the last 6 months.",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Pressure Ulcer Risk",
    category: "Clinical",
    tool: "Waterlow",
    status: "Active",
    inherentScore: 15,
    inherentLevel: "High",
    residualScore: null,
    residualLevel: null,
    hazardDescription: "Skin is fragile and at risk of pressure sores.",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Nutrition / Hydration Risk",
    category: "Clinical",
    tool: "MUST",
    status: "Archived",
    inherentScore: 4,
    inherentLevel: "Low",
    residualScore: null,
    residualLevel: null,
    hazardDescription: "Archived note",
  },
];

let currentRisks = sampleRisks;
let currentPlans: Array<{ id: string; areaKey: string; area: string; status: string; taskCount: number }> = [];

vi.mock("../../../../../../lib/queries/risk", () => ({
  useGetRiskAssessmentsQuery: () => ({
    data: currentRisks,
    isLoading: false,
  }),
}));

vi.mock("../../../../../../lib/queries/care-journey", () => ({
  useGetAssessmentQuery: () => ({
    data: {
      id: "ass-1",
      residentId: "res-1",
      preAdmissionId: "pre-1",
      versionNumber: 1,
      status: "Draft",
      isCurrent: true,
      tools: [],
      needs: [],
      dols: null,
      assessedAt: null,
      assessedByName: null,
      completedAt: null,
      createdAt: "2026-11-12T10:00:00.000Z",
      updatedAt: "2026-11-12T10:00:00.000Z",
    },
    isLoading: false,
  }),
  useListNeedCarePlansQuery: () => ({ data: currentPlans }),
  useListCareTaskDefinitionsQuery: () => ({ data: [] }),
  useCreateAssessmentMutation: () => ({
    isPending: false,
    mutate: mockCreateMutate,
  }),
  useSaveAssessmentMutation: () => ({
    isPending: false,
    mutate: mockSaveMutate,
    mutateAsync: mockSaveMutateAsync,
  }),
}));

vi.mock("../../../care-journey/care-plans/CarePlanModal", () => ({
  CarePlanModal: ({
    open,
    areaKey,
    need,
  }: {
    open: boolean;
    areaKey: string | null;
    need: { found?: string | null } | null;
  }) =>
    open ? (
      <div data-testid="care-plan-modal">
        Modal:{areaKey}:{need?.found}
      </div>
    ) : null,
}));

describe("PreAdmissionAssessmentStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentRisks = sampleRisks;
    currentPlans = [];
    mockSaveMutateAsync.mockResolvedValue({});
  });

  it("renders only tracked non-archived Step 5 risks as cards and opens CarePlanModal", async () => {
    render(
      <PreAdmissionAssessmentStep
        residentId="res-1"
        onGoToStepOne={vi.fn()}
        onGoToRiskStep={vi.fn()}
      />,
    );

    expect(screen.getByText("Support Needs Assessment")).toBeInTheDocument();
    expect(screen.getByText("Mobility and falls")).toBeInTheDocument();
    expect(screen.getByText("Skin and pressure care")).toBeInTheDocument();
    // Archived & untracked areas are excluded
    expect(screen.queryByText("Eating, drinking and diabetes")).not.toBeInTheDocument();
    expect(screen.queryByText("Continence")).not.toBeInTheDocument();

    expect(
      screen.getByDisplayValue(/Requires assistance on stairs/),
    ).toBeInTheDocument();

    const riskSelect = screen.getByLabelText("Associated risk for Mobility and falls");
    fireEvent.click(riskSelect);

    for (const option of [
      "Fall Risk",
      "Pressure Ulcer Risk",
      "Malnutrition Risk",
      "Dehydration Risk",
      "Choking Risk",
      "Infection Risk",
      "No associated risk",
    ]) {
      expect(screen.getByRole("option", { name: option })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("option", { name: "Infection Risk" }));

    const createButtons = screen.getAllByRole("button", { name: /Create Support Plan/i });
    expect(createButtons).toHaveLength(2);
    fireEvent.click(createButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId("care-plan-modal")).toHaveTextContent(
        "Modal:mobility:Requires assistance on stairs",
      );
    });
    expect(mockSaveMutateAsync).toHaveBeenCalled();
  });

  it("adds a custom support need through the modal and removes it again", async () => {
    render(
      <PreAdmissionAssessmentStep
        residentId="res-1"
        onGoToStepOne={vi.fn()}
        onGoToRiskStep={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Add custom support need/i }),
    );

    const nameInput = await screen.findByLabelText("Custom support need name");
    const submit = screen.getByRole("button", { name: "Add support need" });
    expect(submit).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: "Community access" } });
    fireEvent.change(screen.getByLabelText("Custom support need finding"), {
      target: { value: "Needs escort to local shops" },
    });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByText("Community access")).toBeInTheDocument();
    });
    expect(
      screen.getByDisplayValue("Needs escort to local shops"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Create Support Plan/i }),
    ).toHaveLength(3);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove custom need Community access" }),
    );
    await waitFor(() => {
      expect(screen.queryByText("Community access")).not.toBeInTheDocument();
    });
  });

  it("shows empty guidance when no risks have been tracked yet", () => {
    currentRisks = [];
    const onGoToRiskStep = vi.fn();
    render(
      <PreAdmissionAssessmentStep
        residentId="res-1"
        onGoToStepOne={vi.fn()}
        onGoToRiskStep={onGoToRiskStep}
      />,
    );

    expect(screen.getByText(/No risks have been tracked in Step 5 yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Go to Risk Step/i }));
    expect(onGoToRiskStep).toHaveBeenCalledTimes(1);
  });
});
