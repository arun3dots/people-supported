import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { careJourneyTaskFromForm, ModalTasksSection } from "./ModalTasksSection";

const mocks = vi.hoisted(() => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock("../../../../../lib/queries/care-journey", () => ({
  useCreateCareTaskMutation: () => ({
    mutateAsync: mocks.createTask,
    isPending: false,
  }),
  useUpdateCareTaskMutation: () => ({
    mutate: mocks.updateTask,
    isPending: false,
  }),
}));

describe("ModalTasksSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps target time, shift, and optional date window to the care-journey contract", () => {
    expect(
      careJourneyTaskFromForm({
        title: "Check skin",
        instructions: "Inspect heels",
        precautions: "Report new redness",
        category: "Clinical",
        frequency: "Daily",
        timeOfDay: ["Morning"],
        targetTime: "21:30",
        startsOn: "2026-11-05",
        endsOn: "2026-11-20",
        priority: "High",
        careTaskRole: "Nurse",
      }),
    ).toEqual({
      title: "Check skin",
      description: "Inspect heels\n\nPrecautions: Report new redness",
      time: "21:30",
      shift: "Night",
      role: "Nurse",
      recurrence: { type: "daily", days: [] },
      startsOn: "2026-11-05",
      endsOn: "2026-11-20",
    });
  });

  it("maps shift-only tasks without requiring a target time", () => {
    expect(
      careJourneyTaskFromForm({
        title: "Night pad check",
        category: "Personal Care",
        frequency: "Daily",
        timeOfDay: ["Night"],
        targetTime: "",
        priority: "Medium",
        careTaskRole: "Carer",
      }),
    ).toEqual({
      title: "Night pad check",
      description: null,
      time: "",
      shift: "Night",
      role: "Carer",
      recurrence: { type: "daily", days: [] },
    });
  });

  it("submits a care task with shift selected and without mandatory task time", async () => {
    const onPendingTasksChange = vi.fn();
    render(
      <ModalTasksSection
        residentId="resident-1"
        planId={null}
        tasks={[]}
        pendingTasks={[]}
        onPendingTasksChange={onPendingTasksChange}
        isAgreed={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Check heels and sacrum"),
      { target: { value: "Inspect skin" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        "e.g. Use standing hoist with 2 carers. Ensure non-slip footwear is worn before transfer.",
      ),
      { target: { value: "Inspect heels and sacrum" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        "e.g. Resident gets dizzy when standing quickly. Check blood pressure first.",
      ),
      { target: { value: "Escalate any new redness" } },
    );
    // Switch from default Morning to Night shift without setting Target Time
    fireEvent.click(screen.getByRole("button", { name: "Morning" }));
    fireEvent.click(screen.getByRole("button", { name: "Night" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Task" }));

    await waitFor(() => {
      expect(onPendingTasksChange).toHaveBeenCalledWith([
        {
          title: "Inspect skin",
          description:
            "Inspect heels and sacrum\n\nPrecautions: Escalate any new redness",
          time: "",
          shift: "Night",
          role: "Carer",
          recurrence: { type: "daily", days: [] },
        },
      ]);
    });
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("requires either a shift slot or target time when all shift slots are deselected", async () => {
    const onPendingTasksChange = vi.fn();
    render(
      <ModalTasksSection
        residentId="resident-1"
        planId={null}
        tasks={[]}
        pendingTasks={[]}
        onPendingTasksChange={onPendingTasksChange}
        isAgreed={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Check heels and sacrum"),
      { target: { value: "Morning wash" } },
    );
    // Deselect default Morning slot without choosing Target Time
    fireEvent.click(screen.getByRole("button", { name: "Morning" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Task" }));

    expect(
      await screen.findByText(
        "Select at least one shift slot or choose a target time",
      ),
    ).toBeDefined();
    expect(onPendingTasksChange).not.toHaveBeenCalled();
  });

  it("makes task details read-only after the care plan is agreed", () => {
    render(
      <ModalTasksSection
        residentId="resident-1"
        planId="plan-1"
        tasks={[
          {
            id: "task-1",
            carePlanId: "plan-1",
            areaKey: "mobility",
            area: "Mobility and falls",
            stepIndex: 0,
            title: "Check mobility",
            description: null,
            shift: "Day",
            time: "08:00",
            role: "Carer",
            recurrence: { type: "daily", days: [] },
            isActive: true,
            startsOn: null,
            endsOn: null,
          },
        ]}
        pendingTasks={[]}
        onPendingTasksChange={vi.fn()}
        isAgreed
      />,
    );

    expect(screen.getByRole("switch", { name: "Check mobility active" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Add task" })).toBeNull();
    expect(screen.getByText(/read-only/i)).toBeInTheDocument();
  });
});
