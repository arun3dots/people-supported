"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Badge,
  Avatar,
  AvatarFallback,
  Button,
  Card,
  Text,
} from "@repo/ui/components/ui";
import {
  Clock,
  UserCheck,
  UserX,
  MapPin,
  Users,
  CheckCircle2,
  Calendar,
  FileText,
  XCircle,
} from "lucide-react";
import { Shift } from "../../../../../../lib/types/shifts";
import { formatUkDate, formatUkTime } from "../../../../../../lib/utils/uk-date-time";
import { useGetResidentsQuery } from "../../../../../../lib/queries/residents/useGetResidentsQuery";

interface PastShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
}

function calculateDuration(start: string | Date, end: string | Date): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return "--";
  const diffMinutes = Math.round((e - s) / (1000 * 60));
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  return hrs > 0 ? `${hrs} hrs` : `${mins} mins`;
}

export function PastShiftDetailsModal({
  isOpen,
  onClose,
  shift,
}: PastShiftDetailsModalProps) {
  const { data: residents = [] } = useGetResidentsQuery();

  if (!shift) return null;

  const startDate = new Date(shift.startTime);
  const endDate = new Date(shift.endTime);
  const scheduledDuration = calculateDuration(shift.startTime, shift.endTime);
  const formattedDate = formatUkDate(startDate, { weekday: "long", day: "numeric", month: "short", year: "numeric" });

  const residentMap = new Map<string, string>();
  residents.forEach((r: { id: string; fullName: string }) => residentMap.set(r.id, r.fullName));

  const allAssignedResidentIds = Array.from(
    new Set(
      shift.assignments?.flatMap((a) => a.assignedResidentIds || []) || []
    )
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="3xl" className="p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-slate-200 text-slate-800 border-0 text-xs font-medium">
                  Past Shift Review
                </Badge>
                {shift.status === "Cancelled" && (
                  <Badge className="bg-rose-100 text-rose-800 border-0 text-xs font-medium">
                    Cancelled
                  </Badge>
                )}
                {shift.status === "Draft" && (
                  <Badge className="bg-amber-100 text-amber-800 border-0 text-xs font-medium">
                    Draft
                  </Badge>
                )}
              </div>
              <DialogTitle asChild>
                <Text size="xl" weight="semibold" className="text-slate-900">
                  {shift.type?.name || "Scheduled Shift"} Details
                </Text>
              </DialogTitle>
              <DialogDescription asChild>
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formattedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {shift.wing?.name || shift.unit?.name || "Facility Wide"}
                  </span>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Timing Card */}
          <Card variant="surface" className="p-4 bg-slate-50 border border-slate-200/80 shadow-none">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Text size="xs" weight="medium" className="text-slate-500 uppercase tracking-wider">
                  Scheduled Timing
                </Text>
                <div className="flex items-center gap-1.5 mt-1 text-slate-900 font-medium text-base">
                  <Clock className="size-4 text-emerald-700 shrink-0" />
                  {formatUkTime(startDate)} – {formatUkTime(endDate)}
                </div>
              </div>

              <div>
                <Text size="xs" weight="medium" className="text-slate-500 uppercase tracking-wider">
                  Total Shift Duration
                </Text>
                <Text size="base" weight="medium" className="text-slate-900 mt-1">
                  {scheduledDuration}
                </Text>
              </div>

              <div>
                <Text size="xs" weight="medium" className="text-slate-500 uppercase tracking-wider">
                  Care Pattern
                </Text>
                <Text size="base" weight="medium" className="text-slate-900 mt-1">
                  {shift.type?.name || "Custom Pattern"}
                </Text>
              </div>
            </div>
          </Card>

          {/* Staff Attendance & Clock-in Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text size="base" weight="medium" className="text-slate-900 flex items-center gap-2">
                <Users className="size-4 text-emerald-700" />
                Staff Attendance &amp; Clock-In Record
              </Text>
              <Text size="xs" className="text-slate-500">
                {shift.assignments?.length || 0} carer(s) assigned
              </Text>
            </div>

            {(!shift.assignments || shift.assignments.length === 0) ? (
              <Card variant="surface" className="p-4 border-dashed border-slate-200 text-center text-slate-500 text-sm">
                No staff members were assigned to this past shift.
              </Card>
            ) : (
              <div className="space-y-2.5">
                {shift.assignments.map((assignment) => {
                  const staffName = assignment.user?.fullName || "Assigned Carer";
                  const staffEmail = assignment.user?.email || "";
                  const log = shift.staffLogs?.find((l) => l.userId === assignment.userId);
                  const isClockedIn = Boolean(log?.actualStartTime);
                  const isDraft = shift.status === "Draft";
                  const isCancelled = shift.status === "Cancelled";
                  const actualDuration = log?.actualStartTime && log?.actualEndTime
                    ? calculateDuration(log.actualStartTime, log.actualEndTime)
                    : null;

                  const cardBgClass = isClockedIn
                    ? "bg-white border-slate-200/90 shadow-2xs"
                    : isDraft
                    ? "bg-amber-50/30 border-amber-200/70"
                    : isCancelled
                    ? "bg-slate-50 border-slate-200"
                    : "bg-rose-50/40 border-rose-200";

                  const avatarBgClass = isClockedIn
                    ? "bg-emerald-100 text-emerald-900 font-medium"
                    : isDraft
                    ? "bg-amber-100 text-amber-800 font-medium"
                    : isCancelled
                    ? "bg-slate-200 text-slate-700 font-medium"
                    : "bg-rose-100 text-rose-800 font-medium";

                  return (
                    <Card
                      key={assignment.id}
                      variant="surface"
                      className={`p-3.5 border transition-all ${cardBgClass}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Staff Profile */}
                        <div className="flex items-center gap-3">
                          <Avatar size="default" className="ring-1 ring-slate-200">
                            <AvatarFallback className={avatarBgClass}>
                              {staffName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Text size="sm" weight="medium" className="text-slate-900">
                              {staffName}
                            </Text>
                            <Text size="xs" className="text-slate-500 truncate max-w-[220px]">
                              {staffEmail}
                            </Text>
                          </div>
                        </div>

                        {/* Clock-in / Draft / Cancelled / Absent Status */}
                        <div className="flex items-center gap-3">
                          {isClockedIn ? (
                            <div className="flex flex-col sm:items-end gap-1">
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-medium gap-1 self-start sm:self-auto">
                                <UserCheck className="size-3.5" />
                                {log?.status === "Completed" ? "Completed" : "Clocked In"}
                              </Badge>
                              <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                                <span>In: <span className="font-medium text-slate-800">{formatUkTime(log!.actualStartTime)}</span></span>
                                <span>•</span>
                                <span>Out: <span className="font-medium text-slate-800">{log?.actualEndTime ? formatUkTime(log.actualEndTime) : "Pending"}</span></span>
                                {actualDuration && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-700 font-medium">({actualDuration})</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : isDraft ? (
                            <div className="flex flex-col sm:items-end gap-1">
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-medium gap-1 self-start sm:self-auto">
                                <FileText className="size-3.5" />
                                Draft
                              </Badge>
                              <Text size="xs" className="text-amber-700 font-medium">
                                Shift not published to staff
                              </Text>
                            </div>
                          ) : isCancelled ? (
                            <div className="flex flex-col sm:items-end gap-1">
                              <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium gap-1 self-start sm:self-auto">
                                <XCircle className="size-3.5" />
                                Cancelled
                              </Badge>
                              <Text size="xs" className="text-slate-500 font-medium">
                                Shift was cancelled
                              </Text>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:items-end gap-1">
                              <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs font-medium gap-1 self-start sm:self-auto">
                                <UserX className="size-3.5" />
                                Absent
                              </Badge>
                              <Text size="xs" className="text-rose-600 font-medium">
                                Did not clock in
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Log tasks count if available */}
                      {log && typeof log.tasksCompleted === "number" && log.tasksTotal ? (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            Completed {log.tasksCompleted} of {log.tasksTotal} resident care tasks
                          </span>
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resident Allocations */}
          {allAssignedResidentIds.length > 0 && (
            <div className="space-y-2 pt-1">
              <Text size="sm" weight="medium" className="text-slate-900">
                Assigned Residents ({allAssignedResidentIds.length})
              </Text>
              <div className="flex flex-wrap gap-1.5">
                {allAssignedResidentIds.map((resId) => {
                  const name = residentMap.get(resId) || `Resident (${resId.slice(0, 6)})`;
                  return (
                    <Badge
                      key={resId}
                      className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200 text-xs px-2.5 py-1"
                    >
                      {name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes / Handover if any */}
          {shift.notes && (
            <div className="space-y-1.5 pt-1">
              <Text size="sm" weight="bold" className="text-slate-900 flex items-center gap-1.5">
                <FileText className="size-3.5 text-slate-500" />
                Shift Notes &amp; Handover
              </Text>
              <Card variant="surface" className="p-3 bg-slate-50 text-xs text-slate-700 leading-relaxed border border-slate-200/80">
                {shift.notes}
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-5 font-semibold"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
