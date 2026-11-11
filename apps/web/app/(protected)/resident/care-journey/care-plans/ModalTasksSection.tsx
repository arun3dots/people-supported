"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  shiftForTime,
  type CareTaskDefinitionDTO,
  type CareTaskRecurrenceDTO,
  type CareTaskShift,
  type CreateCareTaskDTO,
} from "@repo/schema";
import { Button, Switch } from "@repo/ui/components/ui";
import {
  useCreateCareTaskMutation,
  useUpdateCareTaskMutation,
} from "../../../../../lib/queries/care-journey";
import {
  CarePlanTaskDialog,
  type TaskFormData,
} from "../../../../shared/components/care-plan/CarePlanTaskDialog";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const describeTaskRecurrence = (r?: CareTaskRecurrenceDTO | null): string =>
  !r || r.type === "daily"
    ? "Every day"
    : r.days.map((d) => WEEKDAYS[d]).join(", ");

export const formatTaskDateWindow = (
  startsOn?: string | null,
  endsOn?: string | null,
): string | null => {
  if (startsOn && endsOn) return `${startsOn} to ${endsOn}`;
  if (startsOn) return `From ${startsOn}`;
  if (endsOn) return `Until ${endsOn}`;
  return null;
};

export function careJourneyTaskFromForm(data: TaskFormData): CreateCareTaskDTO {
  const rawTime = data.targetTime?.trim() ?? "";
  const hasValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime);
  const slots = data.timeOfDay ?? [];
  const hasDaySlot = slots.some(
    (s) =>
      s === "Morning" ||
      s === "Afternoon" ||
      s === "Evening" ||
      s === "AllDay",
  );
  const shift: CareTaskShift = hasValidTime
    ? shiftForTime(rawTime)
    : !hasDaySlot && slots.includes("Night")
      ? "Night"
      : "Day";

  const instructions = data.instructions?.trim();
  const precautions = data.precautions?.trim();
  const description = [
    instructions,
    precautions ? `Precautions: ${precautions}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const startsOn = data.startsOn?.trim() || undefined;
  const endsOn = data.endsOn?.trim() || undefined;
  const recurrence: CareTaskRecurrenceDTO =
    data.frequency === "Weekly" && (data.recurrenceDays ?? []).length > 0
      ? { type: "weekly", days: data.recurrenceDays ?? [] }
      : { type: "daily", days: [] };

  return {
    title: data.title.trim(),
    description: description || null,
    time: hasValidTime ? rawTime : "",
    shift,
    role: data.careTaskRole ?? "Carer",
    recurrence,
    ...(startsOn ? { startsOn } : {}),
    ...(endsOn ? { endsOn } : {}),
  };
}

interface ModalTasksSectionProps {
  residentId: string;
  planId: string | null;
  tasks: CareTaskDefinitionDTO[];
  pendingTasks: CreateCareTaskDTO[];
  onPendingTasksChange: (next: CreateCareTaskDTO[]) => void;
  isAgreed: boolean;
}

export function ModalTasksSection({
  residentId,
  planId,
  tasks,
  pendingTasks,
  onPendingTasksChange,
  isAgreed,
}: ModalTasksSectionProps) {
  const create = useCreateCareTaskMutation(residentId);
  const update = useUpdateCareTaskMutation(residentId);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const submitTask = async (form: TaskFormData) => {
    if (isAgreed) return;
    const dto = careJourneyTaskFromForm(form);
    if (planId) {
      await create.mutateAsync({ planId, data: dto });
    } else {
      onPendingTasksChange([...pendingTasks, dto]);
    }
    setTaskDialogOpen(false);
  };

  const hasAny = tasks.length > 0 || pendingTasks.length > 0;

  return (
    <div className="space-y-3 font-sans">
      {isAgreed && (
        <p className="text-md text-slate-600">
          Tasks on an agreed care plan are read-only. Changes require a formal
          amendment.
        </p>
      )}
      {!isAgreed && hasAny && (
        <p className="text-md text-slate-600">
          Created tasks appear in the final review step and on the carer shift list once the plan is agreed.
        </p>
      )}

      <ul className="space-y-2">
        {tasks.map((task) => {
          const dateWindow = formatTaskDateWindow(task.startsOn, task.endsOn);
          return (
            <li
              key={task.id}
              className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5"
            >
              <span className="font-mono text-md font-bold text-slate-800 w-24 shrink-0">
                {task.time || `${task.shift} shift`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-slate-800 truncate">
                  {task.title}
                </p>
                <p className="text-md text-slate-600">
                  {[
                    task.role,
                    task.time ? `${task.shift} shift` : null,
                    describeTaskRecurrence(task.recurrence),
                    dateWindow,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <label className="flex items-center gap-2 text-md text-slate-700 cursor-pointer">
                <Switch
                  checked={task.isActive}
                  disabled={isAgreed || update.isPending}
                  onCheckedChange={(checked) =>
                    update.mutate({ taskId: task.id, data: { isActive: checked } })
                  }
                  aria-label={`${task.title} active`}
                />
                Active
              </label>
            </li>
          );
        })}

        {pendingTasks.map((task, idx) => {
          const shiftLabel = task.shift ?? "Day";
          const dateWindow = formatTaskDateWindow(task.startsOn, task.endsOn);
          return (
            <li
              key={`${task.title}-${task.time || shiftLabel}-${idx}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5"
            >
              <span className="font-mono text-md font-bold text-slate-800 w-24 shrink-0">
                {task.time || `${shiftLabel} shift`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-md font-medium text-slate-800 truncate">
                  {task.title}
                </p>
                <p className="text-md text-slate-600">
                  {[
                    task.role,
                    task.time ? `${shiftLabel} shift` : null,
                    describeTaskRecurrence(task.recurrence),
                    dateWindow,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Remove pending task ${task.title}`}
                onClick={() =>
                  onPendingTasksChange(pendingTasks.filter((_, i) => i !== idx))
                }
                className="shadow-none cursor-pointer"
              >
                <Trash2 className="size-4 text-slate-600" />
              </Button>
            </li>
          );
        })}

        {!hasAny && (
          <li className="text-md text-slate-600">
            No scheduled tasks yet. Add tasks below or leave empty if this plan applies at all times.
          </li>
        )}
      </ul>

      {!isAgreed && (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setTaskDialogOpen(true)}
            className="rounded-xl text-md font-semibold shadow-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add task
          </Button>
          <CarePlanTaskDialog
            isOpen={taskDialogOpen}
            onClose={() => setTaskDialogOpen(false)}
            onSubmit={(form) => void submitTask(form)}
            residentId={residentId}
            carePlanId={planId ?? undefined}
            careJourneyMode
            isLoading={create.isPending}
          />
        </>
      )}
    </div>
  );
}
