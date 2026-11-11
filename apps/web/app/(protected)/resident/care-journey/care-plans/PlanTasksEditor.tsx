"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  shiftForTime,
  type CareTaskDefinitionDTO,
  type CareTaskRecurrenceDTO,
  type CareTaskRole,
} from "@repo/schema";
import { Button, Input, Label, Switch } from "@repo/ui/components/ui";
import {
  useCreateCareTaskMutation,
  useUpdateCareTaskMutation,
} from "../../../../../lib/queries/care-journey";
import { SelectField } from "../../admit/pre-admission/shared/fields";

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
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("08:00");
  const [role, setRole] = useState<CareTaskRole>("Carer");
  const [weekly, setWeekly] = useState(false);
  const [days, setDays] = useState<number[]>([]);

  const reset = () => {
    setAdding(false);
    setTitle("");
    setTime("08:00");
    setRole("Carer");
    setWeekly(false);
    setDays([]);
  };

  const valid =
    title.trim().length > 0 &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(time) &&
    (!weekly || days.length > 0);

  const submit = async () => {
    await create.mutateAsync({
      planId,
      data: {
        title: title.trim(),
        time,
        role,
        shift: shiftForTime(time),
        recurrence: weekly ? { type: "weekly", days } : { type: "daily", days: [] },
      },
    });
    reset();
  };

  return (
    <div className="space-y-3">
      {!isAgreed && tasks.length > 0 && (
        <p className="text-sm text-slate-600">
          These tasks appear on the carer list once the plan has been agreed.
        </p>
      )}
      {isAgreed && (
        <p className="text-sm text-slate-600">
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
              <p className="text-sm text-slate-600">
                {task.role} · {describeRecurrence(task.recurrence)}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
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

      {!isAgreed && !adding ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setAdding(true)}
          className="rounded-xl font-semibold shadow-none"
        >
          <Plus className="size-4" />
          Add task
        </Button>
      ) : !isAgreed ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_8rem] gap-x-4 gap-y-1.5">
            <div className="space-y-1.5">
              <Label required>Task</Label>
              <Input
                list={`steps-${planId}`}
                placeholder="e.g. Check heels and sacrum"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <datalist id={`steps-${planId}`}>
                {steps.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label required>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <SelectField
              label="Who"
              value={role}
              options={["Carer", "Nurse"]}
              onChange={(v) => setRole(v as CareTaskRole)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-md text-slate-700">
              <Switch checked={weekly} onCheckedChange={setWeekly} />
              Only on certain days
            </label>
            {weekly &&
              WEEKDAYS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={days.includes(index)}
                  onClick={() =>
                    setDays((prev) =>
                      prev.includes(index)
                        ? prev.filter((d) => d !== index)
                        : [...prev, index],
                    )
                  }
                  className="px-3 py-1 rounded-full border text-sm font-medium border-slate-300 text-slate-700 aria-pressed:bg-emerald-800 aria-pressed:text-white aria-pressed:border-emerald-800"
                >
                  {label}
                </button>
              ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={reset} className="rounded-xl shadow-none">
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!valid || create.isPending}
              onClick={() => void submit()}
              className="rounded-xl font-semibold shadow-none"
            >
              {create.isPending ? "Adding…" : "Add task"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
