"use client";

import React from "react";
import {
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { Plus, Edit2, Trash2, CheckCircle2, ListTodo, Droplets, Scale } from "lucide-react";
import { CarePlanTaskRoutineCard } from "./CarePlanTaskRoutineCard";
import { GoalItem, GoalTaskItem, DailyTaskRef } from "./CarePlanGoalList";

interface CarePlanGoalCardProps {
  goal: GoalItem;
  allTasks?: GoalTaskItem[];
  dailyTasks?: DailyTaskRef[];
  isEditable?: boolean;
  onEditGoal?: (goal: GoalItem) => void;
  onDeleteGoal?: (goalId: string) => void;
  onAddTaskToGoal?: (goalId?: string | null) => void;
  onEditTask?: (task: GoalTaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function CarePlanGoalCard({
  goal,
  allTasks = [],
  dailyTasks = [],
  isEditable = false,
  onEditGoal,
  onDeleteGoal,
  onAddTaskToGoal,
  onEditTask,
  onDeleteTask,
}: CarePlanGoalCardProps): React.JSX.Element {
  const getGoalStatusBadgeState = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "achieved":
        return "success";
      case "discontinued":
      case "retired":
        return "inactive";
      default:
        return "warning";
    }
  };

  const isRetired = goal.status.toLowerCase() === "retired";
  const goalTasks =
    goal.tasks && goal.tasks.length > 0
      ? goal.tasks
      : allTasks.filter((t) => t.goalId === goal.id);

  // 1. Routine Adherence from Daily Tasks
  const goalTaskIds = new Set(goalTasks.map((t) => t.id));
  const todayOccurrences = dailyTasks.filter(
    (dt) => dt.carePlanTaskId && goalTaskIds.has(dt.carePlanTaskId)
  );
  const todayCompleted = todayOccurrences.filter(
    (dt) => dt.status === "Completed" || dt.status === "completed"
  ).length;
  const todayTotal = todayOccurrences.length;

  // 2. Outcome Progress calculation
  const outcomeProgress =
    goal.status.toLowerCase() === "achieved"
      ? 100
      : (goal.progressPercent ?? 0);

  // 3. Category detection & metadata parsing
  const isWeightGoal =
    goal.category === "Nutrition" &&
    (goal.targetDescription?.toLowerCase().includes("weight") ||
      goal.targetDescription?.toLowerCase().includes("kg") ||
      goal.targetDescription?.toLowerCase().includes("lbs"));

  const isFluidGoal =
    goal.targetDescription?.toLowerCase().includes("fluid") ||
    goal.targetDescription?.toLowerCase().includes("hydration") ||
    goal.targetDescription?.toLowerCase().includes("ml");

  return (
    <div
      className={`bg-white rounded-2xl p-5 border transition-all ${isRetired
        ? "border-slate-200 bg-slate-50/50 opacity-60"
        : "border-slate-200/80 hover:border-slate-300 shadow-none"
        }`}
    >
      {/* Goal Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" state="inactive" className="text-sm font-semibold px-2 py-0.5">
              {goal.category}
            </Badge>
            <Badge
              variant="secondary"
              state={getGoalStatusBadgeState(goal.status)}
              className="text-sm font-semibold px-2 py-0.5"
            >
              {goal.status}
            </Badge>

            {/* Category-Specific Target Pill */}
            {isWeightGoal && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                <Scale className="size-3 text-emerald-700" /> Target Metric
              </span>
            )}
            {isFluidGoal && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg">
                <Droplets className="size-3 text-sky-600" /> Hydration Goal
              </span>
            )}

            <Text size="sm" weight="bold" className="text-slate-900">
              {goal.title}
            </Text>
          </div>

          <Text size="sm" className="text-slate-600 leading-relaxed">
            {goal.targetDescription}
          </Text>

          {goal.whyItMattersToResident && (
            <div className="mt-1.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-md text-amber-900 flex items-start gap-1.5">
              <span className="font-semibold text-amber-800 shrink-0">Why this matters:</span>
              <span className="italic">"{goal.whyItMattersToResident}"</span>
            </div>
          )}

          {goal.retirementReason && (
            <div className="mt-1 p-2 rounded-xl bg-amber-50 border border-amber-200 text-md text-amber-800">
              <span className="font-semibold">Retirement rationale:</span> {goal.retirementReason}
            </div>
          )}
        </div>

        {/* Actions */}
        {isEditable && (
          <div className="flex items-center gap-1 shrink-0">
            {onEditGoal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditGoal(goal)}
                className="size-8 p-0 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
                title="Edit Goal"
              >
                <Edit2 className="size-3.5" />
              </Button>
            )}
            {onDeleteGoal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteGoal(goal.id)}
                className="size-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                title="Delete Goal"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Category-Aware Progress & Routine Adherence Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-md text-slate-500">
        {/* Outcome Progress Bar */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-800 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, outcomeProgress))}%`,
              }}
            />
          </div>
          <span className="font-semibold text-slate-900 shrink-0">
            {outcomeProgress}% Outcome Progress
          </span>
        </div>

        {/* Live Shift Routine Executions Badge */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {todayTotal > 0 ? (
            <Badge
              variant="secondary"
              state={todayCompleted === todayTotal ? "success" : "inactive"}
              className="text-sm font-semibold gap-1 px-2.5 py-1"
            >
              <CheckCircle2 className="size-3 text-emerald-700" />
              Routines: {todayCompleted}/{todayTotal} Done Today
            </Badge>
          ) : (
            <span className="text-sm text-slate-400">
              {goalTasks.length} linked routine{goalTasks.length === 1 ? "" : "s"}
            </span>
          )}

          <span className="text-sm text-slate-400">
            Reviewed {(goal.reviewFrequency || "weekly").toLowerCase()}
          </span>
        </div>
      </div>

      {/* Routine Interventions under this Goal */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ListTodo className="size-3.5 text-emerald-800" />
            <Text size="sm" weight="semibold" className="text-slate-800">
              Assigned Care Routines &amp; Interventions ({goalTasks.length})
            </Text>
          </div>

          {isEditable && onAddTaskToGoal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddTaskToGoal(goal.id)}
              className="h-7 text-md font-semibold text-emerald-800 hover:bg-emerald-50 rounded-xl gap-1 cursor-pointer"
            >
              <Plus className="size-3" /> Add Routine Task
            </Button>
          )}
        </div>

        {goalTasks.length > 0 ? (
          <div className="space-y-2">
            {goalTasks.map((task) => (
              <CarePlanTaskRoutineCard
                key={task.id}
                task={task}
                isEditable={isEditable}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-center text-md text-slate-400">
            No routine intervention tasks assigned to this goal yet.
          </div>
        )}
      </div>
    </div>
  );
}
