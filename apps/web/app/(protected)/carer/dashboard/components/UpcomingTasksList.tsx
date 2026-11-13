"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ListTodo,
  Flame,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Skeleton,
} from "@repo/ui/components/ui";
import { RaiseEscalationDialog } from "../../../../shared/components/escalations/RaiseEscalationDialog";
import { TaskSkipAndEscalateDialogs } from "./TaskSkipAndEscalateDialogs";
import { EscalationReason } from "@repo/schema";

export interface CarerTaskItem {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  category?: string | null;
  timeSlot?: string | null;
  targetTime?: string | null;
  residentId?: string;
  resident?: {
    id: string;
    fullName: string;
    bed?: {
      room?: {
        roomNumber?: string;
      };
    } | null;
  } | null;
  carePlanTask?: {
    category?: string;
    priority?: string;
  } | null;
}

interface UpcomingTasksListProps {
  tasks: CarerTaskItem[];
  isLoading: boolean;
  onCompleteTask: (taskId: string) => void;
  onSkipTask?: (taskId: string, skipReason: string) => void;
}

export function UpcomingTasksList({
  tasks = [],
  isLoading,
  onCompleteTask,
  onSkipTask,
}: UpcomingTasksListProps) {
  const router = useRouter();
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState("");

  // Escalation prompt state
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [escalationData, setEscalationData] = useState<{
    residentId?: string;
    residentName?: string;
    taskId?: string;
    taskTitle?: string;
    reason?: EscalationReason;
    notes?: string;
  }>({});
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);

  const pendingTasks = tasks?.filter((t) => t.status === "Pending") || [];

  const handleOpenSkip = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSkipReason("");
    setSkipDialogOpen(true);
  };

  const handleConfirmSkip = () => {
    if (!selectedTaskId || !skipReason.trim() || !onSkipTask) return;
    const task = tasks.find((t) => t.id === selectedTaskId);
    const reasonText = skipReason;

    onSkipTask(selectedTaskId, reasonText);
    setSkipDialogOpen(false);
    setSelectedTaskId(null);
    setSkipReason("");

    const lower = reasonText.toLowerCase();
    const indicatesDeterioration =
      lower.includes("unwell") ||
      lower.includes("refus") ||
      lower.includes("sick") ||
      lower.includes("pain") ||
      lower.includes("breathless") ||
      lower.includes("fall") ||
      lower.includes("hospital");

    if (indicatesDeterioration && task) {
      setEscalationData({
        residentId: task.residentId || task.resident?.id,
        residentName: task.resident?.fullName || "Resident",
        taskId: task.id,
        taskTitle: task.title,
        reason: lower.includes("refus") ? "RefusedMedication" : "SkippedTask",
        notes: `Task '${task.title}' skipped: ${reasonText}`,
      });
      setShowAutoPrompt(true);
    }
  };

  const getPriorityBadgeClass = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
      case "critical":
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <Card
      id="upcoming-tasks-section"
      className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl space-y-6 shadow-xs font-['Outfit',sans-serif]"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Upcoming Shift Tasks
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-bold bg-[#3D5C57]/10 text-[#3D5C57]">
              {pendingTasks.length} Pending
            </span>
          </div>
          <p className="text-md text-slate-500 font-medium mt-1">
            Prioritised daily care tasks for your assigned residents.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEscalationData({});
              setIsEscalationOpen(true);
            }}
            className="h-9 px-3.5 rounded-xl text-md font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 gap-1.5 cursor-pointer shadow-none"
          >
            <Flame className="size-3.5 text-rose-600" />
            Raise Urgent Alert
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/carer/residents")}
            className="h-9 px-3.5 rounded-xl text-md font-semibold text-[#3D5C57] border-slate-200 hover:bg-slate-50 gap-1.5 cursor-pointer shadow-none"
          >
            Residents <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 w-full max-w-md">
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))
        ) : pendingTasks.length > 0 ? (
          pendingTasks.map((task) => {
            const residentName = task.resident?.fullName || "Resident";
            const roomNumber = task.resident?.bed?.room?.roomNumber;
            const category = task.category || task.carePlanTask?.category || "General Care";
            const priority = task.priority || task.carePlanTask?.priority || "Medium";
            const timeSlot = task.timeSlot || "AllDay";
            const targetTime = task.targetTime ? ` (${task.targetTime})` : "";

            return (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left Task Information */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="size-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center font-bold text-md text-[#3D5C57] shrink-0 shadow-2xs">
                    <ListTodo className="size-4 text-[#3D5C57]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-md font-bold text-slate-800 tracking-tight truncate">
                        {task.title}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`text-md font-semibold px-2 py-0.5 border ${getPriorityBadgeClass(priority)}`}
                      >
                        {priority}
                      </Badge>
                      <Badge variant="outline" className="text-md font-medium text-slate-500 border-slate-200">
                        {category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-md text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <User className="size-3.5 text-slate-400" />
                        {residentName} {roomNumber ? `(Room ${roomNumber})` : ""}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="size-3.5 text-slate-400" />
                        {timeSlot}{targetTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {onSkipTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenSkip(task.id)}
                      className="h-8 px-2.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 text-md font-semibold gap-1 cursor-pointer"
                      title="Skip this routine task"
                    >
                      <XCircle className="size-4 text-slate-400 group-hover:text-amber-600" />
                      <span className="hidden sm:inline">Skip</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => onCompleteTask(task.id)}
                    className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-md font-semibold gap-1.5 shadow-none cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Complete
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4 rounded-xl bg-slate-50/50 border border-dashed border-slate-200">
            <div className="size-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mx-auto mb-2">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="text-md font-bold text-slate-800">All caught up!</p>
            <p className="text-md text-slate-500 font-medium mt-0.5">
              No pending care tasks scheduled for your assigned shift right now.
            </p>
          </div>
        )}
      </div>

      <TaskSkipAndEscalateDialogs
        skipDialogOpen={skipDialogOpen}
        onCloseSkipDialog={() => setSkipDialogOpen(false)}
        skipReason={skipReason}
        onSkipReasonChange={setSkipReason}
        onConfirmSkip={handleConfirmSkip}
        showAutoPrompt={showAutoPrompt}
        onCloseAutoPrompt={() => setShowAutoPrompt(false)}
        onConfirmAutoPrompt={() => {
          setShowAutoPrompt(false);
          setIsEscalationOpen(true);
        }}
        escalationData={escalationData}
      />

      <RaiseEscalationDialog
        isOpen={isEscalationOpen}
        onClose={() => setIsEscalationOpen(false)}
        presetResidentId={escalationData.residentId}
        presetResidentName={escalationData.residentName}
        presetTaskId={escalationData.taskId}
        presetTaskTitle={escalationData.taskTitle}
        presetReason={escalationData.reason}
        presetNotes={escalationData.notes}
      />
    </Card>
  );
}
