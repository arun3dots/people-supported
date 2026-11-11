import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  CARE_AREAS,
  SaveAssessmentSchema,
  type AssessmentNeedDTO,
  type CareAreaKey,
  type NeedCarePlanRecordDTO,
} from "@repo/schema";
import type { RiskAssessmentResponse } from "../../../../../lib/queries/risk";
import { NeedsTable } from "./NeedsTable";

type StandardAssessmentNeedDTO = Extract<
  AssessmentNeedDTO,
  { areaKey: CareAreaKey }
>;

const makeNeeds = (
  overrides: Partial<
    Record<string, Partial<StandardAssessmentNeedDTO>>
  > = {},
): StandardAssessmentNeedDTO[] =>
  CARE_AREAS.map((area) => ({
    areaKey: area.key,
    supportLevel: null,
    found: null,
    source: area.source,
    toolKey: null,
    becomesCarePlan: false,
    ...(overrides[area.key] ?? {}),
  }));

const sampleRisk: RiskAssessmentResponse = {
  id: "ra-1",
  tenantId: "ten-1",
  residentId: "res-1",
  templateId: null,
  category: "Clinical",
  title: "Falls Risk",
  hazardDescription: "Unsteady gait when mobilising at night",
  tool: "Morse",
  likelihood: 4,
  severity: 4,
  inherentScore: 16,
  inherentLevel: "High",
  residualLikelihood: 3,
  residualSeverity: 4,
  residualScore: 12,
  residualLevel: "High",
  status: "Active",
  reviewFrequency: "Monthly",
  nextReviewDate: "2026-12-03T10:00:00.000Z",
  factors: null,
  approvedById: null,
  approvedAt: null,
  reviewedById: null,
  reviewedAt: null,
  createdAt: "2026-11-03T10:00:00.000Z",
  updatedAt: "2026-11-03T10:00:00.000Z",
  controls: [],
  template: null,
  resident: null,
  approver: null,
  reviewer: null,
};

const samplePlan: NeedCarePlanRecordDTO = {
  id: "plan-1",
  residentId: "res-1",
  assessmentId: "ass-1",
  areaKey: "mobility",
  area: "Evening Mobility & Falls Plan",
  supportLevel: "1",
  risk: {
    toolKey: "falls",
    name: "Falls Risk (Morse)",
    value: "Score 12 · High",
    rating: "high",
  },
  content: {
    source: "Falls tool · Part D",
    found: "Falls Risk (Morse): Score 12 · High",
    needs: "Needs steady support with Zimmer frame",
    prefs: null,
    strengths: null,
    outcome: "Walks safely between bedroom and lounge",
    steps: ["Offer Zimmer frame before standing"],
    monitor: null,
    escalation: null,
    consent: null,
    restrictions: null,
  },
  agreement: null,
  status: "Draft",
  versionNumber: 1,
  isCurrent: true,
  reviewDate: "2026-12-01",
  agreedAt: null,
  taskCount: 2,
  createdAt: "2026-11-03T10:00:00.000Z",
  updatedAt: "2026-11-03T10:00:00.000Z",
};

describe("NeedsTable", () => {
  it("renders columns in exact order without a separate support level column", () => {
    render(
      <NeedsTable
        needs={makeNeeds()}
        onChange={vi.fn()}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={vi.fn()}
      />,
    );

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent ?? "");
    expect(headers).toHaveLength(3);
    expect(headers[0]).toContain("Area of need");
    expect(headers[1]).toContain("What the assessment found");
    expect(headers[2]).toContain("Becomes care plan");
    expect(headers).not.toContain("Support level");
  });

  it("adds a custom area of need through the custom-area form", () => {
    const onAddCustomNeed = vi.fn();
    render(
      <NeedsTable
        needs={makeNeeds()}
        onChange={vi.fn()}
        onAddCustomNeed={onAddCustomNeed}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add custom area of need/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /custom area of need name/i }), {
      target: { value: "Oral health" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add area" }));

    expect(onAddCustomNeed).toHaveBeenCalledWith("Oral health");
  });

  it("accepts custom assessment needs for persistence and care-plan generation", () => {
    const customNeed: AssessmentNeedDTO = {
      areaKey: "custom:123e4567-e89b-12d3-a456-426614174000",
      customAreaLabel: "Oral health",
      supportLevel: null,
      found: "Needs support with denture care",
      source: null,
      toolKey: null,
      becomesCarePlan: false,
    };

    expect(
      SaveAssessmentSchema.safeParse({
        tools: [],
        needs: [customNeed],
        dols: null,
      }).success,
    ).toBe(true);
    expect(
      SaveAssessmentSchema.safeParse({
        tools: [],
        needs: [{ ...customNeed, becomesCarePlan: true }],
        dols: null,
      }).success,
    ).toBe(true);
  });

  it("renders custom findings and supports editing or removing a custom area", () => {
    const onChange = vi.fn();
    const onRemoveCustomNeed = vi.fn();
    const customNeed: AssessmentNeedDTO = {
      areaKey: "custom:123e4567-e89b-12d3-a456-426614174000",
      customAreaLabel: "Oral health",
      supportLevel: null,
      found: "Denture care",
      source: null,
      toolKey: null,
      becomesCarePlan: false,
    };
    render(
      <NeedsTable
        needs={[...makeNeeds(), customNeed]}
        onChange={onChange}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={onRemoveCustomNeed}
        onOpenCarePlan={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Oral health finding" }), {
      target: { value: "Needs oral care reminders" },
    });
    expect(onChange).toHaveBeenCalledWith(customNeed.areaKey, {
      found: "Needs oral care reminders",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Remove custom area Oral health" }),
    );
    expect(onRemoveCustomNeed).toHaveBeenCalledWith(customNeed.areaKey);
  });

  it("opens a care plan for a custom area and protects linked areas from removal", () => {
    const onOpenCarePlan = vi.fn();
    const customNeed: AssessmentNeedDTO = {
      areaKey: "custom:123e4567-e89b-12d3-a456-426614174000",
      customAreaLabel: "Oral health",
      supportLevel: null,
      found: null,
      source: null,
      toolKey: null,
      becomesCarePlan: true,
    };
    const customPlan = { ...samplePlan, areaKey: customNeed.areaKey, area: "Oral health" };

    render(
      <NeedsTable
        needs={[...makeNeeds(), customNeed]}
        plans={[customPlan]}
        onChange={vi.fn()}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={onOpenCarePlan}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Oral health" }));
    expect(onOpenCarePlan).toHaveBeenCalledWith(customNeed.areaKey);
    expect(
      screen.getByRole("button", { name: "Remove custom area Oral health" }),
    ).toBeDisabled();
  });

  it("displays Step 4 risk assessment chips near What the assessment found and links findings on click", () => {
    const onChange = vi.fn();
    render(
      <NeedsTable
        needs={makeNeeds()}
        riskAssessments={[sampleRisk]}
        onChange={onChange}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={vi.fn()}
      />,
    );

    const mobilityRow = screen.getAllByRole("row")[1]!;
    const chip = within(mobilityRow).getByRole("button", {
      name: /Falls Risk \(Morse\) · Score 12 · High/i,
    });
    fireEvent.click(chip);

    expect(onChange).toHaveBeenCalledWith("mobility", {
      toolKey: "falls",
      found: "Falls Risk (Morse): Score 12 · High",
    });
  });

  it("renders the saved risk assessment dropdown trigger when active assessments exist", () => {
    const { rerender } = render(
      <NeedsTable
        needs={makeNeeds()}
        riskAssessments={[]}
        onChange={vi.fn()}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("combobox", {
        name: /Select saved risk assessment for Mobility and falls/i,
      }),
    ).toBeNull();

    rerender(
      <NeedsTable
        needs={makeNeeds()}
        riskAssessments={[sampleRisk]}
        onChange={vi.fn()}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", {
        name: /Select saved risk assessment for Mobility and falls/i,
      }),
    ).toBeTruthy();
  });

  it("shows a selected non-suggested assessment as a chip below the finding", () => {
    const onChange = vi.fn();
    const otherRisk = {
      ...sampleRisk,
      id: "ra-2",
      title: "Medication Risk",
      tool: "Medication Review",
    };
    const found =
      "Medication Risk (Medication Review): Score 12 · High — Unsteady gait when mobilising at night";
    const { rerender } = render(
      <NeedsTable
        needs={makeNeeds({ mobility: { found } })}
        riskAssessments={[sampleRisk, otherRisk]}
        onChange={onChange}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={vi.fn()}
      />,
    );

    const mobilityRow = screen.getAllByRole("row")[1]!;
    const savedRiskChip = within(mobilityRow).getByRole("button", {
      name: /Medication Risk \(Medication Review\) · Score 12 · High/i,
    });
    expect(savedRiskChip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(savedRiskChip);

    expect(onChange).toHaveBeenCalledWith("mobility", {
      found: null,
    });

    rerender(
      <NeedsTable
        needs={makeNeeds()}
        riskAssessments={[sampleRisk, otherRisk]}
        onChange={onChange}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={vi.fn()}
      />,
    );
    const updatedMobilityRow = screen.getAllByRole("row")[1]!;
    expect(
      within(updatedMobilityRow).queryByRole("button", {
        name: /Medication Risk \(Medication Review\) · Score 12 · High/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows Add care plan when no plan exists and switches to the care plan name link once saved", () => {
    const onOpenCarePlan = vi.fn();
    const { rerender } = render(
      <NeedsTable
        needs={makeNeeds()}
        onChange={vi.fn()}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={onOpenCarePlan}
      />,
    );

    const rows = screen.getAllByRole("row");
    const mobilityRow = rows[1]!;
    const addBtn = within(mobilityRow).getByRole("button", { name: /Add care plan/i });
    fireEvent.click(addBtn);
    expect(onOpenCarePlan).toHaveBeenCalledWith("mobility");

    rerender(
      <NeedsTable
        needs={makeNeeds({ mobility: { becomesCarePlan: true, supportLevel: "1" } })}
        plans={[samplePlan]}
        onChange={vi.fn()}
        onAddCustomNeed={vi.fn()}
        onRemoveCustomNeed={vi.fn()}
        onOpenCarePlan={onOpenCarePlan}
      />,
    );

    const updatedRows = screen.getAllByRole("row");
    const updatedMobilityRow = updatedRows[1]!;
    expect(
      within(updatedMobilityRow).queryByRole("button", { name: /Add care plan/i }),
    ).toBeNull();

    const planLink = within(updatedMobilityRow).getByRole("button", {
      name: /Evening Mobility & Falls Plan/i,
    });
    expect(within(updatedMobilityRow).getByText(/Draft · 2 tasks/i)).toBeTruthy();

    fireEvent.click(planLink);
    expect(onOpenCarePlan).toHaveBeenCalledTimes(2);
    expect(onOpenCarePlan).toHaveBeenLastCalledWith("mobility");
  });
});
