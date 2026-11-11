"use client";

import { useState } from "react";
import type { CareTaskShift } from "@repo/schema";
import { Button, Spinner } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { useAuth } from "../../../../../lib/context/AuthContext";
import { useGetCareTaskDayQuery } from "../../../../../lib/queries/care-journey";
import { TaskRow } from "./TaskRow";
import { MustKnowCard, NotesCard } from "./TaskSidePanels";

const SHIFT_LABELS: Record<CareTaskShift, string> = {
  Day: "Day 06:00–21:00",
  Night: "Night 21:00–06:00",
};

const currentShift = (): CareTaskShift => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 21 ? "Day" : "Night";
};

interface TasksStepProps {
  residentId: string;
  onBack: () => void;
  /** Hidden when embedded in the resident record, which has no stepper. */
  showNav?: boolean;
}

export function TasksStep({ residentId, onBack, showNav = true }: TasksStepProps) {
  const { user } = useAuth();
  const [shift, setShift] = useState<CareTaskShift>(currentShift);
  const dayQuery = useGetCareTaskDayQuery(residentId, shift);
  const day = dayQuery.data;

  const canRecordTasks = user?.roleName?.toUpperCase() === "CARER";
  const percent =
    day && day.progress.total > 0
      ? Math.round((day.progress.recorded / day.progress.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="tablist" aria-label="Shift">
          {(["Day", "Night"] as const).map((s) => (
            <Button
              key={s}
              type="button"
              role="tab"
              aria-selected={shift === s}
              variant={shift === s ? "primary" : "outline"}
              onClick={() => setShift(s)}
              className="rounded-xl font-semibold shadow-none"
            >
              {SHIFT_LABELS[s]}
            </Button>
          ))}
        </div>
        {day && (
          <div className="flex items-center gap-3 min-w-[14rem]">
            <div
              className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn("h-full rounded-full bg-emerald-500 transition-all")}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-md font-bold text-slate-800">
              {day.progress.recorded} of {day.progress.total} recorded
            </span>
          </div>
        )}
      </div>

      {dayQuery.isLoading || !day ? (
        <div className="flex items-center justify-center min-h-[240px]">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
          <ul className="min-w-0 space-y-3">
            {day.items.length === 0 && (
              <li className="bg-white rounded-2xl border border-slate-100 p-6 text-md text-slate-600">
                No tasks for this shift. Tasks appear here once a care plan is
                agreed and has tasks added.
              </li>
            )}
            {day.items.map((item) => (
              <TaskRow
                key={item.taskId}
                residentId={residentId}
                item={item}
                date={day.date}
                canRecordTasks={canRecordTasks}
              />
            ))}
          </ul>
          <div className="min-w-0 space-y-4">
            <MustKnowCard items={day.mustKnow} />
            <NotesCard
              residentId={residentId}
              shift={shift}
              date={day.date}
              notes={day.notes}
            />
          </div>
        </div>
      )}

      {showNav && (
        <div className="flex">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            Back to care plans
          </Button>
        </div>
      )}
    </div>
  );
}
