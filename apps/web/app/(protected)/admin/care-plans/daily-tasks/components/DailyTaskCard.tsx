"use client";


import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, Badge, Button, Text } from "@repo/ui/components/ui";
import type { CareTaskBoardItemDTO } from "@repo/schema";

export type TaskItem = CareTaskBoardItemDTO;

interface DailyTaskCardProps {
  task: TaskItem;
  showActions?: boolean;
  onComplete: (task: TaskItem) => void;
  onSkip: (task: TaskItem) => void;
}

export function DailyTaskCard({
  task,
  showActions = true,
  onComplete,
  onSkip,
}: DailyTaskCardProps) {
  const shiftState = task.timeSlot === "Night" ? "inactive" : "success";
  const roleState = task.role === "Nurse" ? "warning" : "inactive";

  return (
    <Card
      className="p-4 space-y-2.5 bg-white border border-slate-200 rounded-2xl shadow-none hover:shadow-xs transition-all font-['Outfit',sans-serif]"
    >
      <div className="flex items-start justify-between gap-1.5">
        <Text size="md" weight="bold" className="text-slate-900 leading-snug">
          {task.title}
        </Text>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="secondary" state={shiftState} className="px-1.5 py-0.5 shadow-none">
            {task.timeSlot} shift
          </Badge>
          <Badge variant="secondary" state={roleState} className="px-1.5 py-0.5 shadow-none">
            {task.role}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Text size="md" weight="regular" className="text-slate-500">
          Resident: <span className="font-semibold text-slate-800">{task.resident.fullName}</span>
        </Text>
        {task.targetTime && (
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-slate-400" />
            <Text size="md" weight="regular" className="text-slate-500">{task.targetTime}</Text>
          </div>
        )}
      </div>

      <Text size="md" weight="medium" className="text-emerald-800">
        Care plan: {task.carePlan.area}
      </Text>

      {task.instructions && (
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <Text size="md" weight="regular" className="text-slate-500 line-clamp-2 leading-relaxed">
            <span className="font-semibold text-slate-700">Instructions:</span> {task.instructions}
          </Text>
        </div>
      )}

      {task.skipReason && (
        <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
          <Text size="md" className="text-red-700 font-medium">
            Skipped reason: {task.skipReason}
          </Text>
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onComplete(task)}
            className="flex-1 h-8 rounded-xl shadow-none cursor-pointer gap-1"
          >
            <CheckCircle2 className="size-3.5" /> Done
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSkip(task)}
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 shadow-none rounded-xl cursor-pointer gap-1"
          >
            <XCircle className="size-3.5" /> Skip
          </Button>
        </div>
      )}
    </Card>
  );
}
