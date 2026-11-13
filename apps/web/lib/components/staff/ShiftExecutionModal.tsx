"use client";

import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Badge, Text, Textarea, Avatar, AvatarFallback, AvatarImage, toast,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { getShiftClockInEligibility } from "../../utils/shift-timing";
import {
  Clock, MapPin, CheckCircle2, Users, ClipboardList, AlertTriangle, Play, Square, FileText,
} from "lucide-react";
import { formatUkDate, formatUkTime } from "../../utils/uk-date-time";
import { useGetShiftDetailsQuery, useStartShiftMutation, useEndShiftMutation } from "../../queries/shifts";
import { Shift } from "../../types/shifts";

interface ShiftExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
}

export function ShiftExecutionModal({
  isOpen,
  onClose,
  shift,
}: ShiftExecutionModalProps) {
  const [handoverNotes, setHandoverNotes] = useState("");
  const [isEndingShift, setIsEndingShift] = useState(false);

  const shiftId = shift?.id || "";
  const { data: details, isLoading } = useGetShiftDetailsQuery(shiftId, {
    enabled: isOpen && Boolean(shiftId),
  });

  const startShiftMutation = useStartShiftMutation();
  const endShiftMutation = useEndShiftMutation({
    onSuccess: () => {
      setIsEndingShift(false);
      setHandoverNotes("");
      onClose();
    },
  });

  if (!shift) return null;

  const handleClockIn = () => {
    if (!eligibility.canClockIn) {
      toast({
        title: "Cannot Clock In",
        description: eligibility.reason || "Shift start time has not been reached.",
        variant: "destructive",
      });
      return;
    }
    startShiftMutation.mutate({ shiftId });
  };

  const handleClockOut = () => {
    endShiftMutation.mutate({
      shiftId,
      handoverNotes: handoverNotes.trim() || undefined,
      tasksCompleted: details?.tasksCompleted,
      tasksTotal: details?.tasksTotal,
    });
  };

  const eligibility = getShiftClockInEligibility(shift);
  const isStarted = Boolean(details?.isStarted || shift.isStarted);
  const isCompleted = shift.status === "Completed" || details?.status === "Completed";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="3xl" className="max-h-[90vh] flex flex-col font-sans">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 text-md px-2.5 py-0.5 border-0 font-bold">
                {shift.type?.name || "Shift"}
              </Badge>
              <Badge
                className={
                  shift.status === "Draft"
                    ? "bg-amber-100 text-amber-800"
                    : isCompleted
                    ? "bg-slate-100 text-slate-700"
                    : isStarted
                      ? "bg-emerald-600 text-white animate-pulse"
                      : "bg-blue-100 text-blue-800"
                }
              >
                {shift.status === "Draft" ? "Draft" : isCompleted ? "Completed" : isStarted ? "In Progress" : "Scheduled"}
              </Badge>
            </div>
          </div>
          <DialogTitle asChild>
            <Text size="xl" weight="bold" className="text-slate-900 mt-2">
              Shift Operations &amp; Attendance
            </Text>
          </DialogTitle>
          <DialogDescription asChild>
            <Text size="md" weight="regular" className="text-slate-500">
              Review assigned residents, care tasks, clinical handover, and record attendance.
            </Text>
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-5 py-3 pr-1">
          {/* Shift Timing & Attendance Action Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-md font-semibold text-slate-700">
                <Clock className="size-4 text-emerald-700" />
                <span>
                  {(() => {
                    const start = shift.startTime ? new Date(shift.startTime) : null;
                    const end = shift.endTime ? new Date(shift.endTime) : null;
                    const validStart = start && !isNaN(start.getTime());
                    const validEnd = end && !isNaN(end.getTime());
                    const dayStr = validStart
                      ? formatUkDate(start, {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "";
                    const timeRange = validStart && validEnd
                      ? `${formatUkTime(start)} - ${formatUkTime(end)}`
                      : shift.timingFormatted || `${shift.formattedStartTime || ""} - ${shift.formattedEndTime || ""}`;
                    return `${dayStr}${dayStr && timeRange ? " • " : ""}${timeRange}`;
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-md text-slate-500">
                <MapPin className="size-3.5 text-slate-400" />
                <span>{shift.wing?.name || (shift as any).wardName || "Main Facility"}</span>
              </div>
            </div>

            {/* Attendance Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {!isStarted && !isCompleted && shift.status !== "Draft" && (
                <Button
                  onClick={handleClockIn}
                  disabled={!eligibility.canClockIn || startShiftMutation.isPending}
                  title={eligibility.reason || "Clock In"}
                  className={cn(
                    "bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-md h-9 px-4 rounded-xl gap-1.5 shadow-xs",
                    eligibility.canClockIn && !startShiftMutation.isPending
                      ? "cursor-pointer"
                      : "opacity-60 cursor-not-allowed",
                  )}
                >
                  <Play className="size-3.5 fill-current" />
                  {startShiftMutation.isPending
                    ? "Starting..."
                    : !eligibility.isTimeReached && eligibility.formattedStartTime
                      ? `Clock in at ${eligibility.formattedStartTime}`
                      : "Clock In"}
                </Button>
              )}

              {shift.status === "Draft" && (
                <span className="text-md font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Draft (Unpublished)
                </span>
              )}
              {isStarted && !isEndingShift && (
                <Button
                  onClick={() => setIsEndingShift(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-md h-9 px-4 rounded-xl gap-1.5 shadow-xs cursor-pointer"
                >
                  <Square className="size-3.5 fill-current" />
                  End Shift &amp; Handover
                </Button>
              )}

              {isCompleted && (
                <div className="flex items-center gap-1.5 text-md font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Shift Completed</span>
                </div>
              )}
            </div>
          </div>

          {/* Handover Input Form (Shown when ending shift) */}
          {isEndingShift && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <Text size="md" weight="bold" className="text-amber-900 flex items-center gap-2">
                  <FileText className="size-4 text-amber-700" />
                  CQC Shift Handover &amp; Summary Notes
                </Text>
                <button
                  type="button"
                  onClick={() => setIsEndingShift(false)}
                  className="text-md text-amber-800 hover:underline font-medium"
                >
                  Cancel
                </button>
              </div>
              <p className="text-md text-amber-800 leading-relaxed">
                Provide concise clinical handover notes for the incoming shift lead (e.g. resident observations, skipped tasks, escalations).
              </p>
              <Textarea
                rows={3}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="E.g., All morning medication rounds complete. Room 102 reported dizziness post-lunch, GP notified."
                className="bg-white border-amber-300 text-md rounded-xl focus:ring-amber-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  onClick={handleClockOut}
                  disabled={endShiftMutation.isPending}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-md h-9 px-4 rounded-xl cursor-pointer"
                >
                  {endShiftMutation.isPending ? "Submitting..." : "Submit Handover & Clock Out"}
                </Button>
              </div>
            </div>
          )}

          {/* Previous Shift Handover Note (Continuity of Care) */}
          {details?.previousShiftHandover && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1">
              <Text size="md" weight="bold" className="text-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-blue-600" />
                Previous Shift Handover ({details.previousShiftHandover.shiftName || "Previous Shift"})
              </Text>
              <p className="text-md text-blue-800 leading-relaxed italic">
                &ldquo;{details.previousShiftHandover.handoverNotes}&rdquo;
              </p>
            </div>
          )}

          {/* Assigned Residents Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Text size="md" weight="bold" className="text-slate-900 flex items-center gap-2">
                <Users className="size-4 text-emerald-800" />
                Assigned Residents ({details?.assignedResidents?.length || 0})
              </Text>
              <span className="text-md text-slate-500 font-medium">Care allocation</span>
            </div>

            {isLoading ? (
              <div className="h-16 animate-pulse bg-slate-100 rounded-xl" />
            ) : details?.assignedResidents && details.assignedResidents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {details.assignedResidents.map((res) => (
                  <div
                    key={res.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-2xs"
                  >
                    <Avatar size="sm" className="size-8 rounded-full border border-slate-200 shrink-0">
                      {res.photoUrl && <AvatarImage src={res.photoUrl} alt={res.fullName} />}
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 text-md font-bold">
                        {res.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-md font-bold text-slate-900 truncate">{res.fullName}</p>
                      <p className="text-md text-slate-500 truncate">
                        {res.careLevel || "General Care"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-md text-slate-500">
                Facility-wide coverage or no specific resident allocated.
              </div>
            )}
          </div>

          {/* Scheduled Shift Care Tasks */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Text size="md" weight="bold" className="text-slate-900 flex items-center gap-2">
                <ClipboardList className="size-4 text-emerald-800" />
                Shift Tasks ({details?.tasks?.length || 0})
              </Text>
              <span className="text-md text-slate-500 font-medium">
                {details?.tasksCompleted || 0} of {details?.tasksTotal || 0} completed
              </span>
            </div>

            {isLoading ? (
              <div className="h-16 animate-pulse bg-slate-100 rounded-xl" />
            ) : details?.tasks && details.tasks.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {details.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <p className="text-md font-bold text-slate-900 truncate">{task.title}</p>
                      <p className="text-md text-slate-500 truncate">
                        {task.residentName} • {task.category || "Care"} • {task.time || "Scheduled"}
                      </p>
                    </div>
                    <Badge
                      className={
                        task.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800 text-md"
                          : "bg-slate-100 text-slate-600 text-md"
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-md text-slate-500">
                No active care tasks scheduled for this shift window.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button variant="outline" onClick={onClose} className="text-md h-9 px-4 rounded-xl">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
