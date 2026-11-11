"use client";

import React from "react";
import { Button, Badge, Text } from "@repo/ui/components/ui";
import { Clock, Edit2, Trash2, ShieldAlert } from "lucide-react";
import { GoalTaskItem } from "./CarePlanGoalList";

interface CarePlanTaskRoutineCardProps {
  task: GoalTaskItem;
  isEditable?: boolean;
  onEditTask?: (task: GoalTaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function CarePlanTaskRoutineCard({
  task,
  isEditable = false,
  onEditTask,
  onDeleteTask,
}: CarePlanTaskRoutineCardProps): React.JSX.Element {
  const getPriorityBadge = (priority?: string | null) => {
    switch ((priority || "Medium").toLowerCase()) {
      case "critical":
        return <Badge state="danger" className="text-md px-2 py-0.5 shadow-none">Critical</Badge>;
      case "high":
        return <Badge state="warning" className="text-md px-2 py-0.5 shadow-none">High Priority</Badge>;
      case "low":
        return <Badge state="inactive" className="text-md px-2 py-0.5 shadow-none">Low</Badge>;
      default:
        return <Badge state="info" className="text-md px-2 py-0.5 shadow-none">Medium</Badge>;
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-surface-card-grey border border-slate-200/60 hover:bg-slate-100/70 transition-colors space-y-2 font-sans">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="size-2 rounded-full bg-emerald-800 shrink-0" />
          <Text size="sm" weight="bold" className="text-slate-900">{task.title}</Text>
          {getPriorityBadge(task.priority)}
          <Badge state="inactive" className="text-md px-2 py-0.5 shadow-none">
            {task.category}
          </Badge>
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-slate-400" />
            <Text size="sm" variant="muted">
              {task.timeOfDay?.join(", ") || task.frequency}
              {task.targetTime ? ` (${task.targetTime})` : ""}
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {task.assignedStaff && (
            <Badge state="inactive" className="text-md px-2 py-0.5 shadow-none">
              Assigned: {task.assignedStaff.fullName}
            </Badge>
          )}
          {isEditable && (
            <div className="flex items-center gap-1">
              {onEditTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditTask(task)}
                  className="size-7 p-0 text-slate-400 hover:text-slate-900 rounded-lg"
                >
                  <Edit2 className="size-3.5" />
                </Button>
              )}
              {onDeleteTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteTask(task.id)}
                  className="size-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {task.instructions && (
        <div className="pl-3">
          <Text size="sm" variant="muted" className="leading-relaxed">
            <span className="font-semibold text-slate-700">Instructions:</span> {task.instructions}
          </Text>
        </div>
      )}

      {task.precautions && (
        <div className="ml-3 flex items-start gap-1.5 p-2 rounded-xl border border-amber-200/70 bg-amber-50">
          <ShieldAlert className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
          <Text size="sm" className="text-amber-900">
            <span className="font-semibold">Safety Check:</span> {task.precautions}
          </Text>
        </div>
      )}
    </div>
  );
}
