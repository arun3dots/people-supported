"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { AlertCircle, Calendar, CheckCircle2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Text,
  Textarea,
} from "@repo/ui/components/ui";
import type { LeaveRequestItem } from "../../../../../../lib/queries/shifts";
import type { Shift } from "../../../../../../lib/types/shifts";
import {
  formatLeavePeriod,
  formatRequestedAt,
  getLeaveDurationDays,
  getLeaveStaffInitials,
  getLeaveStatusBadgeState,
  getLeaveTypeBadgeState,
  getOverlappingShiftsForLeave,
} from "./leaveRequestUtils";

interface LeaveRequestDetailModalProps {
  request: LeaveRequestItem | null;
  shifts: Shift[];
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: "Approved" | "Declined",
    adminNotes?: string,
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export function LeaveRequestDetailModal({
  request,
  shifts,
  onClose,
  onUpdateStatus,
  isSubmitting = false,
}: LeaveRequestDetailModalProps): React.JSX.Element | null {
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (request) {
      setAdminNotes(request.adminNotes ?? "");
    } else {
      setAdminNotes("");
    }
  }, [request]);

  if (!request) return null;

  const overlappingShifts = getOverlappingShiftsForLeave(request, shifts);
  const days = getLeaveDurationDays(request.startDate, request.endDate);
  const initials = getLeaveStaffInitials(request.staff?.fullName);

  const submittedText = formatRequestedAt(request.createdAt);

  const handleAction = async (status: "Approved" | "Declined") => {
    await onUpdateStatus(request.id, status, adminNotes.trim() || undefined);
    onClose();
  };

  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="xl"
        className="p-0 max-h-[90vh] overflow-y-auto font-sans"
      >
        <div className="p-6 sm:p-8">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-surface-primary-light text-primary flex items-center justify-center shrink-0">
                <Calendar className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  Leave Request Details
                </DialogTitle>
                <DialogDescription className="text-md text-slate-500">
                  Review leave period, scheduled rota impact, and approval
                  notes.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Staff Summary */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar size="sm" className="size-11 shrink-0 bg-surface-primary-light">
                  {request.staff?.profile?.profilePhotoUrl && (
                    <AvatarImage
                      src={request.staff.profile.profilePhotoUrl}
                      alt={request.staff.fullName}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-surface-primary-light text-primary font-semibold text-md">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Text
                      size="md"
                      weight="semibold"
                      className="text-slate-900 truncate"
                    >
                      {request.staff?.fullName || "Staff Member"}
                    </Text>
                    {request.staff?.role?.name && (
                      <Badge
                        variant="secondary"
                        state="inactive"
                        className="px-2 py-0.5 text-md shadow-none font-medium"
                      >
                        {request.staff.role.name}
                      </Badge>
                    )}
                  </div>
                  <Text size="md" variant="muted" className="truncate">
                    {request.staff?.email || "No email on record"}
                  </Text>
                </div>
              </div>

              <Badge
                variant="secondary"
                state={getLeaveStatusBadgeState(request.status)}
                className="px-2.5 py-0.5 shadow-none font-medium shrink-0"
              >
                {request.status}
              </Badge>
            </div>

            {/* Structured Summary Card */}
            <div className="rounded-2xl bg-surface-card-grey p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <Text
                  size="md"
                  weight="medium"
                  className="text-slate-500 w-32 shrink-0"
                >
                  Leave Type
                </Text>
                <Badge
                  variant="secondary"
                  state={getLeaveTypeBadgeState(request.type)}
                  className="px-2.5 py-0.5 shadow-none font-medium text-md"
                >
                  {request.type}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Text
                  size="md"
                  weight="medium"
                  className="text-slate-500 w-32 shrink-0"
                >
                  Dates
                </Text>
                <Text size="md" weight="medium" className="text-slate-900">
                  {formatLeavePeriod(request.startDate, request.endDate)} (
                  {days} {days === 1 ? "day" : "days"})
                </Text>
              </div>

              <div className="flex items-center gap-3">
                <Text
                  size="md"
                  weight="medium"
                  className="text-slate-500 w-32 shrink-0"
                >
                  Submitted
                </Text>
                <Text size="md" className="text-slate-600">
                  {submittedText}
                </Text>
              </div>

              {request.reason && (
                <div className="flex items-start gap-3">
                  <Text
                    size="md"
                    weight="medium"
                    className="text-slate-500 w-32 shrink-0"
                  >
                    Reason
                  </Text>
                  <Text size="md" className="text-slate-700">
                    {request.reason}
                  </Text>
                </div>
              )}

              {request.status !== "Pending" && request.adminNotes && (
                <div className="flex items-start gap-3">
                  <Text
                    size="md"
                    weight="medium"
                    className="text-slate-500 w-32 shrink-0"
                  >
                    Admin Notes
                  </Text>
                  <Text size="md" className="text-slate-700">
                    {request.adminNotes}
                  </Text>
                </div>
              )}
            </div>

            {/* Real Rota Coverage Check */}
            {overlappingShifts.length > 0 ? (
              <div className="rounded-2xl bg-amber-50/70 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="size-4 shrink-0" />
                  <Text size="md" weight="semibold" className="text-amber-900">
                    {overlappingShifts.length} Scheduled Shift
                    {overlappingShifts.length === 1 ? "" : "s"} Affected
                  </Text>
                </div>
                <div className="space-y-1.5 pl-6">
                  {overlappingShifts.slice(0, 4).map((shift) => {
                    const start = new Date(shift.startTime);
                    const end = new Date(shift.endTime);
                    const locationName =
                      shift.unit?.name || shift.wing?.name || shift.location;
                    return (
                      <Text key={shift.id} size="md" className="text-amber-800">
                        {format(start, "dd MMM yyyy, HH:mm")} –{" "}
                        {format(end, "HH:mm")}
                        {shift.type?.name ? ` · ${shift.type.name}` : ""}
                        {locationName ? ` (${locationName})` : ""}
                      </Text>
                    );
                  })}
                  {overlappingShifts.length > 4 && (
                    <Text size="md" className="text-amber-700">
                      +{overlappingShifts.length - 4} additional shift(s)
                    </Text>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-card-grey px-4 py-3 flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-700 shrink-0" />
                <Text size="md" className="text-slate-600">
                  No scheduled shifts assigned in this date range.
                </Text>
              </div>
            )}

            {/* Admin Notes */}
            {request.status === "Pending" && (
              <div className="space-y-1.5">
                <Label className="text-md font-medium text-slate-700">
                  Admin Notes (optional)
                </Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add an approval or cover arrangement note..."
                  rows={2}
                  className="rounded-xl border-slate-200/80 text-md resize-none"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2.5">
            {request.status === "Pending" ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl text-md font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={() => handleAction("Declined")}
                  disabled={isSubmitting}
                  className="rounded-xl text-md font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-none"
                >
                  Decline Request
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => handleAction("Approved")}
                  disabled={isSubmitting}
                  className="rounded-xl text-md font-medium"
                >
                  {isSubmitting ? "Saving..." : "Approve Request"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={onClose}
                className="rounded-xl bg-surface-card-grey hover:bg-slate-200/70 text-md font-medium text-slate-700 shadow-none"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
