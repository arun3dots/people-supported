"use client";

import React, { useState } from "react";
import { z } from "zod";

const SkipTaskSchema = z.object({
  skipReason: z.string().trim().min(1, "Please provide a clinical or operational reason"),
});
import {
  Card,
  Button,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
} from "@repo/ui/components/ui";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";

interface DailyTaskOccurrence {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  timeSlot?: string;
  targetTime?: string;
  instructions?: string;
  precautions?: string;
  completedAt?: string | null;
  completedBy?: { fullName: string } | null;
  skipReason?: string | null;
}

interface DailyTasksScheduleCardProps {
  tasks: DailyTaskOccurrence[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onUpdateStatus: (taskId: string, status: "Completed" | "Skipped", skipReason?: string) => void;
  isEditable?: boolean;
  onAddTask?: () => void;
}

export function DailyTasksScheduleCard({
  tasks = [],
  selectedDate,
  onDateChange,
  onUpdateStatus,
  isEditable,
  onAddTask,
}: DailyTasksScheduleCardProps) {
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [skipReasonError, setSkipReasonError] = useState<string | null>(null);
  const [slotFilter, setSlotFilter] = useState("ALL");

  const handleOpenSkip = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSkipReason("");
    setSkipDialogOpen(true);
  };

  const handleConfirmSkip = () => {
    if (!selectedTaskId || !skipReason.trim()) return;
    onUpdateStatus(selectedTaskId, "Skipped", skipReason);
    setSkipDialogOpen(false);
    setSelectedTaskId(null);
    setSkipReason("");
  };

  const filteredTasks =
    slotFilter === "ALL"
      ? tasks
      : tasks.filter((t) => (t.timeSlot || "AllDay").toLowerCase() === slotFilter.toLowerCase());

  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;

  return (
    <Card variant="surface" border="secondary" className="p-5 sm:p-6 space-y-4 rounded-2xl bg-white shadow-xs font-sans">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-secondary/30 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-md font-bold text-text-primary  tracking-wider">
              Daily Care Tasks Schedule
            </h3>
            <span className="text-md text-text-description">
              ({completedCount} done, {pendingCount} pending)
            </span>
          </div>
          <p className="text-md text-text-description mt-0.5">
            Shift execution checklist generated from master care plan tasks
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateChange(subDays(selectedDate, 1))}
              className="size-7 p-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-md font-bold px-2 text-text-primary">
              {format(selectedDate, "EEE, MMM d")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateChange(addDays(selectedDate, 1))}
              className="size-7 p-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {isEditable && onAddTask && (
            <Button variant="outline" size="sm" onClick={onAddTask} className="gap-1 rounded-xl cursor-pointer">
              <Plus className="size-3.5" /> Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Time Slot Filter Pills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {["ALL", "Morning", "Afternoon", "Evening", "Night", "AllDay"].map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => setSlotFilter(slot)}
            className={`px-3 py-1 rounded-full text-md font-semibold cursor-pointer transition-colors ${slotFilter === slot
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            {slot}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3 pt-1">
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-md text-text-description">
            No care tasks scheduled for this day/slot.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === "Completed";
            const isSkipped = task.status === "Skipped";

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${isCompleted
                  ? "bg-emerald-50/30 border-emerald-200/60"
                  : isSkipped
                    ? "bg-slate-50 border-slate-200 opacity-80"
                    : "bg-white border-border-secondary/50 hover:bg-slate-50/50"
                  }`}
              >
                {/* Left: Task Info */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-md font-bold text-text-primary">{task.title}</span>
                    <Badge variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none">
                      {task.category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      state={task.priority === "High" || task.priority === "Critical" ? "danger" : "inactive"}
                      className="px-2.5 py-0.5 shadow-none"
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-md text-text-description flex items-center gap-1">
                      <Clock className="size-3" /> {task.timeSlot || "AllDay"} {task.targetTime ? `(${task.targetTime})` : ""}
                    </span>
                  </div>

                  {task.instructions && (
                    <p className="text-md text-text-body leading-relaxed">{task.instructions}</p>
                  )}

                  {task.precautions && (
                    <p className="text-sm text-amber-700 font-medium">Precaution: {task.precautions}</p>
                  )}

                  {isCompleted && task.completedBy && (
                    <p className="text-sm text-emerald-700 font-medium">
                      Completed by {task.completedBy.fullName} at {task.completedAt ? format(new Date(task.completedAt), "HH:mm") : ""}
                    </p>
                  )}

                  {isSkipped && task.skipReason && (
                    <p className="text-sm text-slate-600 italic">
                      Skipped reason: &quot;{task.skipReason}&quot;
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isCompleted && !isSkipped ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(task.id, "Completed")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-md h-8 px-3 gap-1"
                      >
                        <CheckCircle2 className="size-3.5" /> Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSkip(task.id)}
                        className="text-slate-600 hover:text-slate-900 text-md h-8 px-3 gap-1"
                      >
                        <XCircle className="size-3.5" /> Skip
                      </Button>
                    </>
                  ) : (
                    <span
                      className={`px-2.5 py-1 rounded-full text-sm font-semibold border ${isCompleted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                    >
                      {task.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Skip Task Reason Modal */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-text-primary">
              Skip Care Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-md text-text-description">
              Please provide a clinical or operational reason for skipping this task (required for regulatory audit).
            </p>
            <Textarea
              placeholder="e.g. Resident declined, asleep during scheduled slot, or completed by family"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="text-md min-h-[90px]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setSkipDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!skipReason.trim()}
              onClick={handleConfirmSkip}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirm Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
