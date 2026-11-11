"use client";

import React from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import {
  Card,
  Text,
  Badge,
  Button,
  EmptyState,
} from "@repo/ui/components/ui";
import { useUpdateDailyTaskStatusMutation } from "../../../../../lib/queries/residents";
import type { HandoverDailyTaskItem } from "./HandoverResidentCard";

interface HandoverTasksSectionProps {
  tasks: Array<
    HandoverDailyTaskItem & {
      resident?: { id: string; fullName: string } | null;
    }
  >;
}

export function HandoverTasksSection({ tasks }: HandoverTasksSectionProps) {
  const updateTaskMutation = useUpdateDailyTaskStatusMutation();

  const handleMarkComplete = async (taskId: string) => {
    await updateTaskMutation.mutateAsync({
      taskId,
      data: { status: "Completed" },
    });
  };

  return (
    <Card
      variant="white"
      className="rounded-2xl border-slate-200/90 shadow-xs p-5 space-y-3 gap-0"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <Text size="sm" weight="bold" className="text-slate-900">
            Carried-Over Shift Tasks ({tasks.length})
          </Text>
          <Text size="sm" variant="subdued">
            Pending tasks scheduled during shift to be prioritized or followed up by incoming staff.
          </Text>
        </div>
      </div>

      {tasks.length > 0 ? (
        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 bg-white hover:bg-slate-50/50 transition-colors"
            >
              <div className="space-y-0.5">
                <Text size="sm" weight="semibold" className="text-slate-900">
                  {task.title}
                </Text>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{task.resident?.fullName || "Assigned resident"}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-slate-400" />
                    {task.targetTime || task.timeSlot || task.scheduledTime || "Shift task"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge
                  variant="outline"
                  state="warning"
                  className="p-0 px-2 py-0.5 text-sm font-semibold rounded-md shadow-none"
                >
                  {task.status || "Pending"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateTaskMutation.isPending}
                  onClick={() => handleMarkComplete(task.id)}
                  className="h-7 text-sm font-medium rounded-lg gap-1 border-slate-200 hover:border-emerald-600 hover:text-emerald-700 text-slate-600"
                >
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  <span>Complete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="All shift tasks completed"
          description="No pending day tasks require carry-over to incoming staff."
          className="py-4"
        />
      )}
    </Card>
  );
}
