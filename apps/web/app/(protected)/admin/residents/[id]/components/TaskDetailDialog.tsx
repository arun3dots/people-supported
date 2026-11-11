"use client";

import React from "react";
import {
  Calendar,
  Clock,
  User,
  AlertTriangle,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Clock4,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui";

export interface TaskHistoryItem {
  id: string;
  dateTime: string;
  timeDisplay: string;
  dateValue: string;
  nurseName: string;
  taskTitle: string;
  taskSubtitle: string;
  category: string;
  completedBy: string;
  completedByRole: string;
  completedByInitials: string;
  status: string;
  notes: string;
  instructions?: string | null;
  precautions?: string | null;
  skipReason?: string | null;
}

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskHistoryItem | null;
}

export function TaskDetailDialog({ open, onOpenChange, task }: TaskDetailDialogProps) {
  if (!task) return null;

  const renderStatusBadge = () => {
    switch (task.status.toLowerCase()) {
      case "completed":
        return (
          <Badge variant="secondary" state="success" className="px-2.5 py-1 flex items-center gap-1.5 shadow-none">
            <CheckCircle2 className="size-3.5" />
            <span>Completed</span>
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" state="warning" className="px-2.5 py-1 flex items-center gap-1.5 shadow-none">
            <Clock4 className="size-3.5" />
            <span>Pending</span>
          </Badge>
        );
      case "skipped":
      case "missed":
        return (
          <Badge variant="secondary" state="danger" className="px-2.5 py-1 flex items-center gap-1.5 shadow-none">
            <XCircle className="size-3.5" />
            <span>{task.status}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" state="inactive" className="px-2.5 py-1 shadow-none">
            {task.status}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden font-sans min-w-0">
        {/* Header */}
        <DialogHeader className="space-y-2 pb-4 border-b border-slate-100 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" state="info" className="px-2.5 py-1 shadow-none font-medium">
              {task.category}
            </Badge>
            {renderStatusBadge()}
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight break-words break-all [overflow-wrap:anywhere]">
            {task.taskTitle}
          </DialogTitle>
          {task.taskSubtitle && task.taskSubtitle !== "-" && (
            <DialogDescription className="text-sm text-slate-600 font-normal break-words break-all [overflow-wrap:anywhere] leading-relaxed">
              {task.taskSubtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content Body */}
        <div className="py-4 space-y-5 min-w-0 w-full">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 w-full">
            {/* Date & Time */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Calendar className="size-4 text-slate-400" />
                <span>Date & Time</span>
              </div>
              <div className="text-sm font-semibold text-slate-800 break-words break-all [overflow-wrap:anywhere]">
                {task.dateTime}
              </div>
              {task.timeDisplay && (
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="size-3.5" />
                  <span>{task.timeDisplay}</span>
                </div>
              )}
            </div>

            {/* Performed / Completed By */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <User className="size-4 text-slate-400" />
                <span>Completed / Recorded By</span>
              </div>
              <div className="flex items-center gap-2.5 pt-0.5 min-w-0">
                <div className="size-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0">
                  {task.completedByInitials || "ST"}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {task.completedBy || "Staff Member"}
                  </div>
                  <div className="text-sm text-slate-500 truncate">
                    {task.completedByRole || "Staff"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skip Reason if any */}
          {task.skipReason && (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 text-rose-800 text-sm font-bold uppercase tracking-wider">
                <AlertTriangle className="size-4 text-rose-600" />
                <span>Reason for Skipping / Incompletion</span>
              </div>
              <p className="text-sm text-rose-900 font-medium break-words break-all [overflow-wrap:anywhere]">{task.skipReason}</p>
            </div>
          )}

          {/* Instructions & Precautions */}
          {(task.instructions || task.precautions) && (
            <div className="space-y-3 min-w-0 w-full">
              {task.instructions && (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1 min-w-0 overflow-hidden">
                  <span className="text-sm font-bold text-blue-800 uppercase tracking-wider">Instructions</span>
                  <p className="text-sm text-blue-900 break-words break-all [overflow-wrap:anywhere]">{task.instructions}</p>
                </div>
              )}
              {task.precautions && (
                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-amber-800 uppercase tracking-wider">
                    <ShieldAlert className="size-4 text-amber-600" />
                    <span>Precautions</span>
                  </div>
                  <p className="text-sm text-amber-900 break-words break-all [overflow-wrap:anywhere]">{task.precautions}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          <div className="space-y-2 min-w-0 w-full">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
              <FileText className="size-4 text-slate-400" />
              <span>Full Notes & Summary</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed break-words break-all [overflow-wrap:anywhere] min-w-0 w-full overflow-hidden">
              {task.notes && task.notes !== "-" ? task.notes : "No additional notes recorded for this task."}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto cursor-pointer text-sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
