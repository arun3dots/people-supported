"use client";

import { CheckCircle2, Clock, XCircle, ListTodo } from "lucide-react";
import { Text } from "@repo/ui/components/ui";

export interface TaskOccurrenceItem {
  id: string;
  title: string;
  status: string;
  skipReason?: string;
}

interface CarePlanShiftRoutineProgressProps {
  dailyTasks?: TaskOccurrenceItem[];
  onViewTodayTasks?: () => void;
}

export function CarePlanShiftRoutineProgress({
  dailyTasks = [],
  onViewTodayTasks,
}: CarePlanShiftRoutineProgressProps) {
  const total = dailyTasks.length;
  const completed = dailyTasks.filter(
    (t) => t.status === "Completed" || t.status === "completed"
  ).length;
  const skipped = dailyTasks.filter(
    (t) => t.status === "Skipped" || t.status === "skipped"
  ).length;
  const pending = total - completed - skipped;

  const percentCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
  const percentSkipped = total > 0 ? Math.round((skipped / total) * 100) : 0;
  const percentPending = total > 0 ? 100 - percentCompleted - percentSkipped : 0;

  return (
    <button
      type="button"
      onClick={onViewTodayTasks}
      className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl transition-all text-left group cursor-pointer w-full sm:w-auto min-w-[220px] font-['Outfit',sans-serif]"
      title="Click to view shift routine tasks"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-1.5">
          <ListTodo className="size-4 text-emerald-800" />
          <Text size="md" weight="semibold" className="text-slate-800">
            Today&apos;s Routines
          </Text>
        </div>
        <span className="text-md font-bold text-slate-900">
          {completed}/{total}{" "}
          <span className="text-slate-400 font-normal">({percentCompleted}%)</span>
        </span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
        {completed > 0 && (
          <div
            style={{ width: `${percentCompleted}%` }}
            className="bg-emerald-600 h-full transition-all"
            title={`${completed} Completed`}
          />
        )}
        {skipped > 0 && (
          <div
            style={{ width: `${percentSkipped}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`${skipped} Skipped`}
          />
        )}
        {pending > 0 && (
          <div
            style={{ width: `${percentPending}%` }}
            className="bg-slate-300 h-full transition-all"
            title={`${pending} Pending`}
          />
        )}
      </div>

      {/* Counters Breakdown */}
      <div className="flex items-center justify-between gap-2 mt-2 text-md text-slate-500">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="size-3 text-emerald-600" />
          <strong className="text-slate-700">{completed}</strong> done
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3 text-slate-400" />
          <strong className="text-slate-700">{pending}</strong> left
        </span>
        {skipped > 0 && (
          <span className="flex items-center gap-1">
            <XCircle className="size-3 text-rose-500" />
            <strong className="text-rose-600">{skipped}</strong> skipped
          </span>
        )}
      </div>
    </button>
  );
}
