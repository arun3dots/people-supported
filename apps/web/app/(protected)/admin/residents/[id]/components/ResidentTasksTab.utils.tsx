import React from "react";
import { format, isValid } from "date-fns";
import { Clock4, PlayCircle, XCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@repo/ui/components/ui";
import { type TaskHistoryItem } from "./TaskDetailDialog";

export interface DailyTaskOccurrence {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  precautions?: string | null;
  category: string;
  priority: string;
  status: string;
  timeSlot?: string | null;
  targetTime?: string | null;
  scheduledDate: string | Date;
  dueAt?: string | Date | null;
  assignedStaff?: {
    id: string;
    fullName: string;
  } | null;
  completedBy?: {
    id: string;
    fullName: string;
  } | null;
  completedAt?: string | Date | null;
  skipReason?: string | null;
  notes?: string | null;
}

export const STATUS_FILTERS = [
  { id: "Pending", label: "Pending" },
  { id: "Completed", label: "Completed" },
  { id: "Skipped", label: "Skipped" },
  { id: "ALL", label: "All Tasks" },
] as const;

export const TIME_SLOTS = ["All", "Morning", "Afternoon", "Evening", "Night"] as const;

export function toTaskHistoryItem(t: DailyTaskOccurrence): TaskHistoryItem {
  const sDate = t.scheduledDate ? new Date(t.scheduledDate) : new Date();
  const isVal = isValid(sDate);
  return {
    id: t.id,
    dateTime: isVal ? format(sDate, "dd MMM yyyy") : "Scheduled",
    timeDisplay: t.targetTime || t.timeSlot || "Anytime",
    dateValue: isVal ? format(sDate, "yyyy-MM-dd") : "",
    nurseName: t.completedBy?.fullName || t.assignedStaff?.fullName || "Staff",
    taskTitle: t.title,
    taskSubtitle: t.description || t.instructions || "-",
    category: t.category,
    completedBy: t.completedBy?.fullName || t.assignedStaff?.fullName || "Unassigned",
    completedByRole: "Care Staff",
    completedByInitials: (t.completedBy?.fullName || "ST")
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2),
    status: t.status,
    notes: t.notes || "-",
    instructions: t.instructions,
    precautions: t.precautions,
    skipReason: t.skipReason,
  };
}

export function renderTaskStatus(status: string): React.JSX.Element {
  const s = status.toLowerCase();
  if (s === "pending") {
    return (
      <div className="flex items-center gap-1.5 font-medium text-amber-800 text-md">
        <Clock4 className="size-4 text-amber-600 shrink-0" />
        <span>Pending</span>
      </div>
    );
  }
  if (s === "inprogress" || s === "in_progress") {
    return (
      <div className="flex items-center gap-1.5 font-medium text-blue-800 text-md">
        <PlayCircle className="size-4 text-blue-600 shrink-0" />
        <span>In Progress</span>
      </div>
    );
  }
  if (s === "skipped" || s === "missed") {
    return (
      <div className="flex items-center gap-1.5 font-medium text-rose-800 text-md">
        <XCircle className="size-4 text-rose-600 shrink-0" />
        <span className="capitalize">{status}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 font-medium text-emerald-800 text-md">
      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
      <span>Completed</span>
    </div>
  );
}

export function renderTaskPriority(priority: string): React.JSX.Element {
  const p = priority.toLowerCase();
  const state = p === "critical" ? "danger" : p === "high" ? "warning" : p === "medium" ? "info" : "inactive";
  return (
    <Badge variant="secondary" state={state} className="px-2 py-0.5 text-md shadow-none">
      {priority}
    </Badge>
  );
}
