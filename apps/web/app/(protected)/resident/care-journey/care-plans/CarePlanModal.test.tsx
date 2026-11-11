import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { NeedCarePlanRecordDTO } from "@repo/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CarePlanModal } from "./CarePlanModal";

const mocks = vi.hoisted(() => ({
  createPlan: vi.fn(),
  savePlan: vi.fn(),
  createTask: vi.fn(),
  agreePlan: vi.fn(),
  agreePlanAsync: vi.fn(),
}));

vi.mock("../../../../../lib/queries/care-journey", () => ({
  useCreateNeedCarePlanMutation: () => ({
    mutateAsync: mocks.createPlan,
    isPending: false,
  }),
  useSaveNeedCarePlanMutation: () => ({
    mutateAsync: mocks.savePlan,
    isPending: false,
  }),
  useCreateCareTaskMutation: () => ({
    mutateAsync: mocks.createTask,
    isPending: false,
  }),
  useAgreeNeedCarePlanMutation: () => ({
    mutate: mocks.agreePlan,
    mutateAsync: mocks.agreePlanAsync,
    isPending: false,
  }),
}));

vi.mock("./CarePlanContentSections", () => ({
  CarePlanContentSections: () => null,
}));

vi.mock("./ModalTasksSection", () => ({
  ModalTasksSection: () => null,
}));

const draftPlan: NeedCarePlanRecordDTO = {
  id: "plan-1",
  residentId: "resident-1",
  assessmentId: null,
  areaKey: "mobility",
  area: "Mobility and falls",
  supportLevel: null,
  risk: null,
  content: {
    source: null,
    found: null,
    needs: null,
    prefs: null,
    strengths: null,
    outcome: null,
    steps: [],
    monitor: null,
    escalation: null,
    consent: null,
    restrictions: null,
  },
  agreement: null,
  status: "Draft",
  versionNumber: 1,
  isCurrent: true,
  reviewDate: null,
  agreedAt: null,
  taskCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("CarePlanModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.savePlan.mockResolvedValue(draftPlan);
    mocks.createPlan.mockResolvedValue(draftPlan);
  });

  it("saves agreement participants on a draft without recording formal agreement", async () => {
    render(
      <CarePlanModal
        open
        onOpenChange={vi.fn()}
        residentId="resident-1"
        areaKey="mobility"
        need={null}
        linkedRisk={null}
        existingPlan={draftPlan}
        tasks={[]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("e.g. Margaret"), {
      target: { value: "Margaret" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Resident, daughter"), {
      target: { value: "Daughter" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save care plan" }));

    await waitFor(() => expect(mocks.savePlan).toHaveBeenCalledOnce());
    expect(mocks.savePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: "plan-1",
        data: expect.objectContaining({
          content: expect.objectContaining({
            consultationPeople: [{ name: "Margaret", role: "Daughter" }],
          }),
        }),
      }),
    );
    expect(mocks.agreePlanAsync).not.toHaveBeenCalled();
  });

  it("hydrates saved consultation participants when reopening a draft", () => {
    render(
      <CarePlanModal
        open
        onOpenChange={vi.fn()}
        residentId="resident-1"
        areaKey="mobility"
        need={null}
        linkedRisk={null}
        existingPlan={{
          ...draftPlan,
          content: {
            ...draftPlan.content,
            consultationPeople: [{ name: "Margaret", role: "Daughter" }],
          },
        }}
        tasks={[]}
      />,
    );

    expect(screen.getByDisplayValue("Margaret")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Daughter")).toBeInTheDocument();
  });

  it("creates a care plan using a custom assessment area's key and label", async () => {
    const customAreaKey = "custom:123e4567-e89b-12d3-a456-426614174000";
    render(
      <CarePlanModal
        open
        onOpenChange={vi.fn()}
        residentId="resident-1"
        areaKey={customAreaKey}
        need={{
          areaKey: customAreaKey,
          customAreaLabel: "Oral health",
          supportLevel: null,
          found: "Needs denture care",
          source: null,
          toolKey: null,
          becomesCarePlan: true,
        }}
        linkedRisk={null}
        existingPlan={null}
        tasks={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save care plan" }));

    await waitFor(() => expect(mocks.createPlan).toHaveBeenCalledOnce());
    expect(mocks.createPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        areaKey: customAreaKey,
        area: "Oral health",
        content: expect.objectContaining({ found: "Needs denture care" }),
      }),
    );
  });

  it("does not offer edits or saving for an agreed care plan", () => {
    render(
      <CarePlanModal
        open
        onOpenChange={vi.fn()}
        residentId="resident-1"
        areaKey="mobility"
        need={null}
        linkedRisk={null}
        existingPlan={{
          ...draftPlan,
          status: "Agreed",
          agreedAt: "2026-11-04T00:00:00.000Z",
          agreement: {
            agreedBy: [{ name: "Resident", role: "Self" }],
            note: null,
            agreedAt: "2026-11-04T00:00:00.000Z",
          },
        }}
        tasks={[]}
      />,
    );

    expect(screen.getByText(/read-only/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save care plan" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add task" })).toBeNull();
    expect(screen.getByText(/Resident \(Self\)/)).toBeInTheDocument();
  });
});
