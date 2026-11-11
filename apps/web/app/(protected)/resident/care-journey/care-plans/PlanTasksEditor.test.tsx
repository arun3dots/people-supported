import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CareTaskDefinitionDTO } from "@repo/schema";
import { PlanTasksEditor } from "./PlanTasksEditor";

vi.mock("../../../../../lib/queries/care-journey", () => ({
  useCreateCareTaskMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCareTaskMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

const task: CareTaskDefinitionDTO = {
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
};

describe("PlanTasksEditor", () => {
  it("renders agreed plan tasks without task-edit actions", () => {
    render(
      <PlanTasksEditor
        residentId="resident-1"
        planId="plan-1"
        tasks={[task]}
        steps={[]}
        isAgreed
      />,
    );

    expect(screen.getByText("Check mobility")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Check mobility active" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Add task" })).toBeNull();
    expect(screen.getByText(/read-only/i)).toBeInTheDocument();
  });
});
