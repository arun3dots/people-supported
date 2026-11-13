"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  type CareTaskDefinitionDTO,
  type CareTaskRecurrenceDTO,
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
import { careJourneyTaskFromForm } from "./careJourneyTaskForm";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const describeRecurrence = (r: CareTaskRecurrenceDTO): string =>
  r.type === "daily" ? "Every day" : r.days.map((d) => WEEKDAYS[d]).join(", ");

interface PlanTasksEditorProps {
  residentId: string;
  planId: string;
  tasks: CareTaskDefinitionDTO[];
  steps: string[];
  isAgreed: boolean;
}

export function PlanTasksEditor({
  residentId,
  planId,
  tasks,
  steps,
  isAgreed,
}: PlanTasksEditorProps) {
  const create = useCreateCareTaskMutation(residentId);
  const update = useUpdateCareTaskMutation(residentId);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const submit = async (form: TaskFormData) => {
    await create.mutateAsync({
      planId,
      data: careJourneyTaskFromForm(form),
    });
    setTaskDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      {!isAgreed && tasks.length > 0 && (
        <p className="text-md text-slate-600">
          These tasks appear on the carer list once the plan has been agreed.
        </p>
      )}
      {isAgreed && (
        <p className="text-md text-slate-600">
          Tasks on an agreed care plan are read-only. Changes require a formal
          amendment.
        </p>
      )}

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/80 px-3 py-2"
          >
            <span className="font-mono text-md font-bold text-slate-800 w-20 shrink-0">
              {task.time || `${task.shift} shift`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-md font-medium text-slate-800 truncate">
                {task.title}
              </p>
              <p className="text-md text-slate-600">
                {task.role} · {describeRecurrence(task.recurrence)}
              </p>
            </div>
            <label className="flex items-center gap-2 text-md text-slate-700">
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
        ))}
        {tasks.length === 0 && (
          <li className="text-md text-slate-600">
            No timed tasks. This plan applies at all times.
          </li>
        )}
      </ul>

      {!isAgreed && (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setTaskDialogOpen(true)}
            className="rounded-xl font-semibold shadow-none"
          >
            <Plus className="size-4" />
            Add task
          </Button>
          <CarePlanTaskDialog
            isOpen={taskDialogOpen}
            onClose={() => setTaskDialogOpen(false)}
            onSubmit={(form) => void submit(form)}
            residentId={residentId}
            carePlanId={planId}
            careJourneyMode
            isLoading={create.isPending}
          />
        </>
      )}
    </div>
  );
}
