"use client";

import {
  Card,
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { Target, Plus, ListTodo, Trash2, Edit } from "lucide-react";
import { GoalFormData } from "../../../../../shared/components/care-plan/CarePlanGoalDialog";
import { TaskFormData } from "../../../../../shared/components/care-plan/CarePlanTaskDialog";

interface GoalsAndTasksStepProps {
  goals: GoalFormData[];
  tasks: TaskFormData[];
  onOpenAddGoal: () => void;
  onOpenEditGoal: (goal: GoalFormData) => void;
  onDeleteGoal: (goalId: string) => void;
  onOpenAddTask: () => void;
  onOpenEditTask: (task: TaskFormData) => void;
  onDeleteTask: (taskId: string) => void;
}

export function GoalsAndTasksStep({
  goals,
  tasks,
  onOpenAddGoal,
  onOpenEditGoal,
  onDeleteGoal,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
}: GoalsAndTasksStepProps) {
  return (
    <div className="space-y-6 font-['Outfit',sans-serif]">
      {/* Goals Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Target className="size-5 text-emerald-800" />
              <Text as="h3" size="md" weight="medium" className="text-slate-900">
                Clinical Goals &amp; Interventions
              </Text>
            </div>
            <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
              Define measurable clinical outcomes and target timelines.
            </Text>
          </div>
          <Button size="sm" onClick={onOpenAddGoal} className="gap-1.5 rounded-xl cursor-pointer">
            <Plus className="size-3.5" /> Add Goal
          </Button>
        </div>

        <div className="space-y-3">
          {goals.map((goal, idx) => (
            <div
              key={goal.id || idx}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Text size="md" weight="semibold" className="text-slate-900">{goal.title}</Text>
                  <Badge variant="outline" className="shadow-none">
                    {goal.category}
                  </Badge>
                  <Text size="md" weight="regular" className="text-slate-500">
                    Cadence: {goal.reviewFrequency}
                  </Text>
                </div>
                <Text size="md" weight="regular" className="text-slate-500">{goal.targetDescription}</Text>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onOpenEditGoal(goal)} className="cursor-pointer">
                  <Edit className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => goal.id && onDeleteGoal(goal.id)} className="cursor-pointer">
                  <Trash2 className="size-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily Tasks Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ListTodo className="size-5 text-emerald-800" />
              <Text as="h3" size="md" weight="medium" className="text-slate-900">
                Daily Care Tasks Schedule
              </Text>
            </div>
            <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
              Configure concrete tasks carers will complete during each shift.
            </Text>
          </div>
          <Button size="sm" onClick={onOpenAddTask} className="gap-1.5 rounded-xl cursor-pointer">
            <Plus className="size-3.5" /> Add Task
          </Button>
        </div>

        <div className="space-y-3">
          {tasks.map((task, idx) => (
            <div
              key={task.id || idx}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Text size="md" weight="semibold" className="text-slate-900">{task.title}</Text>
                  <Badge variant="outline" className="shadow-none">
                    {task.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`shadow-none ${task.priority === "High" || task.priority === "Critical"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : ""
                      }`}
                  >
                    {task.priority}
                  </Badge>
                  <Text size="md" weight="regular" className="text-slate-500">
                    Slots: {task.timeOfDay?.join(", ") || "AllDay"}
                  </Text>
                </div>
                {task.instructions && (
                  <Text size="md" weight="regular" className="text-slate-500">{task.instructions}</Text>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onOpenEditTask(task)} className="cursor-pointer">
                  <Edit className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => task.id && onDeleteTask(task.id)} className="cursor-pointer">
                  <Trash2 className="size-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
