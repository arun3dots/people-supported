"use client";

import React from "react";
import {
  Button,
  Card,
  Text,
} from "@repo/ui/components/ui";
import { Target, Plus } from "lucide-react";
import { CarePlanTaskRoutineCard } from "./CarePlanTaskRoutineCard";
import { CarePlanGoalCard } from "./CarePlanGoalCard";

export interface GoalTaskItem {
  id: string;
  goalId?: string | null;
  title: string;
  category: string;
  frequency: string;
  timeOfDay: string[];
  targetTime?: string | null;
  instructions?: string | null;
  precautions?: string | null;
  priority?: string | null;
  status?: string | null;
  isActive?: boolean;
  assignedStaff?: { id: string; fullName: string } | null;
}

export interface GoalItem {
  id: string;
  title: string;
  targetDescription: string;
  whyItMattersToResident?: string | null;
  category: string;
  reviewFrequency: string;
  progressPercent: number;
  status: string;
  nextReviewDate?: string | Date | null;
  retirementReason?: string | null;
  tasks?: GoalTaskItem[];
}

export interface DailyTaskRef {
  id: string;
  carePlanTaskId?: string | null;
  title: string;
  status: string;
}

interface CarePlanGoalListProps {
  goals: GoalItem[];
  unassignedTasks?: GoalTaskItem[];
  allTasks?: GoalTaskItem[];
  dailyTasks?: DailyTaskRef[];
  isEditable?: boolean;
  onAddGoal?: () => void;
  onEditGoal?: (goal: GoalItem) => void;
  onDeleteGoal?: (goalId: string) => void;
  onAddTaskToGoal?: (goalId?: string | null) => void;
  onEditTask?: (task: GoalTaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function CarePlanGoalList({
  goals,
  unassignedTasks = [],
  allTasks,
  dailyTasks = [],
  isEditable = false,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onAddTaskToGoal,
  onEditTask,
  onDeleteTask,
}: CarePlanGoalListProps): React.JSX.Element {
  const resolvedUnassignedTasks =
    unassignedTasks.length > 0
      ? unassignedTasks
      : (allTasks || []).filter((t) => !t.goalId);

  return (
    <Card
      variant="surface"
    >
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-6">
          <Target className="size-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
          <Text size="md" weight="semibold" className="text-slate-700">No clinical goals defined yet</Text>
          <Text size="md" variant="muted" className="mt-1">Define outcomes to structure care routines and track resident progress.</Text>
          {isEditable && onAddGoal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddGoal}
              className="mt-3 gap-1 rounded-xl text-md font-semibold h-8 px-3.5 shadow-none cursor-pointer"
            >
              <Plus className="size-3.5" /> Define First Goal
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <CarePlanGoalCard
              key={goal.id}
              goal={goal}
              allTasks={allTasks}
              dailyTasks={dailyTasks}
              isEditable={isEditable}
              onEditGoal={onEditGoal}
              onDeleteGoal={onDeleteGoal}
              onAddTaskToGoal={onAddTaskToGoal}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Unassigned Tasks Section */}
      {resolvedUnassignedTasks.length > 0 && (
        <div className="pt-6 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <Text size="md" weight="semibold" className="text-slate-900">
              General / Unassigned Interventions ({resolvedUnassignedTasks.length})
            </Text>
            {isEditable && onAddTaskToGoal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTaskToGoal(null)}
                className="h-7 text-md font-semibold text-slate-700 hover:bg-slate-100 rounded-xl gap-1 cursor-pointer"
              >
                <Plus className="size-3" /> Add General Task
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {resolvedUnassignedTasks.map((task) => (
              <CarePlanTaskRoutineCard
                key={task.id}
                task={task}
                isEditable={isEditable}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
