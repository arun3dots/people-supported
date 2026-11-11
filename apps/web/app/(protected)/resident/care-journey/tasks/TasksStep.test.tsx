import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TasksStep } from "./TasksStep";

const mocks = vi.hoisted(() => ({
  user: { roleName: "Admin" },
  isRecorded: false,
  record: vi.fn(),
  undo: vi.fn(),
  createNote: vi.fn(),
}));

vi.mock("../../../../../lib/context/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../../../../lib/queries/care-journey", () => ({
  useGetCareTaskDayQuery: () => ({
    isLoading: false,
    data: {
      residentId: "resident-1",
      date: "2026-11-04",
      shift: "Day",
      items: [
        {
          taskId: "task-1",
          time: "08:00",
          shift: "Day",
          title: "Assist with morning care",
          description: null,
          role: "Carer",
          carePlan: {
            id: "plan-1",
            areaKey: "personalCare",
            area: "Personal care",
          },
          status: mocks.isRecorded ? ("Done" as const) : ("Pending" as const),
          record: mocks.isRecorded
            ? {
                id: "record-1",
                outcome: "Done",
                note: null,
                recordedAt: "2026-11-04T08:00:00.000Z",
                recordedByName: "Carer",
              }
            : null,
        },
      ],
      progress: { recorded: 0, total: 1 },
      mustKnow: [
        {
          label: "Allergies",
          value: "Penicillin — swelling of lips and face, difficulty breathing; Latex — skin irritation",
          tone: "danger",
        },
      ],
      notes: [],
    },
  }),
  useRecordCareTaskMutation: () => ({
    mutate: mocks.record,
    isPending: false,
  }),
  useUndoCareTaskMutation: () => ({
    mutate: mocks.undo,
    isPending: false,
  }),
  useCreateShiftNoteMutation: () => ({
    mutate: mocks.createNote,
    isPending: false,
  }),
}));

describe("TasksStep", () => {
  beforeEach(() => {
    mocks.user.roleName = "Admin";
    mocks.isRecorded = false;
  });

  it("does not show task record actions in the admin view", () => {
    const rendered = render(
      <TasksStep residentId="resident-1" onBack={vi.fn()} />,
    );

    expect(screen.queryByRole("button", { name: "Record" })).toBeNull();
    expect(
      screen.getByText(
        "Penicillin — swelling of lips and face, difficulty breathing; Latex — skin irritation",
      ).closest('[data-slot="badge"]'),
    ).toHaveClass("whitespace-normal", "break-words");

    mocks.isRecorded = true;
    rendered.rerender(
      <TasksStep residentId="resident-1" onBack={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("shows task record actions to carers", () => {
    mocks.user.roleName = "Carer";
    render(<TasksStep residentId="resident-1" onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    expect(screen.getByRole("button", { name: "Save record" })).toBeInTheDocument();
  });
});
