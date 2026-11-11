"use client";


import { Clock, CheckCircle2, XCircle, User } from "lucide-react";
import { Card, Badge, Button, Text } from "@repo/ui/components/ui";

export interface TaskItem {
  id: string;
  title: string;
  status: string;
  timeSlot?: string;
  priority?: string;
  targetTime?: string;
  instructions?: string;
  precautions?: string;
  skipReason?: string;
  resident?: {
    id: string;
    fullName: string;
  };
  assignedStaff?: {
    id: string;
    fullName: string;
  };
  carePlanTask?: {
    priority?: string;
    timeOfDay?: string[];
    instructions?: string;
    precautions?: string;
    targetTime?: string;
  };
}

interface DailyTaskCardProps {
  task: TaskItem;
  showActions?: boolean;
  onComplete: (id: string) => void;
  onSkip: (id: string, title: string) => void;
}

export function DailyTaskCard({
  task,
  showActions = true,
  onComplete,
  onSkip,
}: DailyTaskCardProps) {
  const instructions = task.instructions || task.carePlanTask?.instructions;
  const precautions = task.precautions || task.carePlanTask?.precautions;
  const priority = task.priority || task.carePlanTask?.priority || "Medium";
  const targetTime = task.targetTime || task.carePlanTask?.targetTime;

  const getPriorityBadge = (p?: string) => {
    const norm = (p || "Medium").toLowerCase();
    if (norm === "critical") {
      return (
        <Badge variant="secondary" state="danger" className="px-2 py-0.5 shadow-none">
          Critical
        </Badge>
      );
    }
    if (norm === "high") {
      return (
        <Badge variant="secondary" state="warning" className="px-2 py-0.5 shadow-none">
          High
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" state="inactive" className="px-2 py-0.5 shadow-none">
        Med
      </Badge>
    );
  };

  return (
    <Card
      className="p-4 space-y-2.5 bg-white border border-slate-200 rounded-2xl shadow-none hover:shadow-xs transition-all font-['Outfit',sans-serif]"
    >
      <div className="flex items-start justify-between gap-1.5">
        <Text size="sm" weight="bold" className="text-slate-900 leading-snug">
          {task.title}
        </Text>
        <div className="flex items-center gap-1 shrink-0">
          {getPriorityBadge(priority)}
          <Badge variant="secondary" state="inactive" className="px-1.5 py-0.5 shadow-none">
            {task.timeSlot || "Anytime"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Text size="sm" weight="regular" className="text-slate-500">
          Resident: <span className="font-semibold text-slate-800">{task.resident?.fullName || "Resident"}</span>
        </Text>
        {targetTime && (
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-slate-400" />
            <Text size="sm" weight="regular" className="text-slate-500">{targetTime}</Text>
          </div>
        )}
      </div>

      {task.assignedStaff && (
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl">
          <User className="size-3 text-slate-400" />
          <Text size="sm" weight="regular" className="text-slate-500">Assigned: {task.assignedStaff.fullName}</Text>
        </div>
      )}

      {instructions && (
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <Text size="sm" weight="regular" className="text-slate-500 line-clamp-2 leading-relaxed">
            <span className="font-semibold text-slate-700">Instr:</span> {instructions}
          </Text>
        </div>
      )}

      {precautions && (
        <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
          <Text size="sm" className="text-amber-900 font-medium">
            <span className="font-semibold">Note:</span> {precautions}
          </Text>
        </div>
      )}

      {task.skipReason && (
        <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
          <Text size="sm" className="text-red-700 font-medium">
            Skipped reason: {task.skipReason}
          </Text>
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onComplete(task.id)}
            className="flex-1 h-8 rounded-xl shadow-none cursor-pointer gap-1"
          >
            <CheckCircle2 className="size-3.5" /> Done
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSkip(task.id, task.title)}
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 shadow-none rounded-xl cursor-pointer gap-1"
          >
            <XCircle className="size-3.5" /> Skip
          </Button>
        </div>
      )}
    </Card>
  );
}
