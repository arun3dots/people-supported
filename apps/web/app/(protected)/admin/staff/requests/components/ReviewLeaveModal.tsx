"use client";

import React, { useState } from "react";
import { AlertCircle, Calendar } from "lucide-react";
import {
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
import type { ShiftRequest } from "../../../../../../lib/types/shifts";
import {
  formatRequestedAt,
  formatShiftDateTime,
  formatShiftRequestDateRange,
  getLeaveStaffInitials,
} from "./leaveRequestUtils";

interface ReviewLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ShiftRequest | null;
  onApprove?: (id: string, notes?: string) => void;
  onReject?: (id: string, notes: string) => void;
  isPending?: boolean;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Text size="sm" weight="medium" className="text-slate-500 w-32 shrink-0">
        {label}
      </Text>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ReviewLeaveModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  isPending,
}: ReviewLeaveModalProps) {
  const [adminNotes, setAdminNotes] = useState("");

  if (!request) return null;

  const modalTitle =
    request.type === "Leave"
      ? "Leave Request Details"
      : request.type === "Change"
        ? "Shift Swap Request Details"
        : "Shift Cover Request Details";

  const handleClose = () => {
    setAdminNotes("");
    onClose();
  };

  const requestTypeLabel =
    request.type === "Change"
      ? "Shift Swap"
      : request.type === "Cover"
        ? "Shift Cover"
        : request.type;

  const statusBadgeState =
    request.status === "Approved"
      ? "success"
      : request.status === "Rejected"
        ? "danger"
        : "warning";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="xl" className="p-0 max-h-[90vh] overflow-y-auto font-sans">
        <div className="p-6 sm:p-8">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-surface-primary-light text-primary flex items-center justify-center shrink-0">
                <Calendar className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  {modalTitle}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Review request specifics and confirm coverage before deciding.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 rounded-full bg-surface-primary-light text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                  {getLeaveStaffInitials(request.user?.fullName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Text size="md" weight="semibold" className="text-slate-900 truncate">
                      {request.user?.fullName ?? "Staff Member"}
                    </Text>
                    {request.user?.role?.name && (
                      <Badge variant="secondary" state="inactive" className="px-2 py-0.5 text-xs shadow-none font-medium">
                        {request.user.role.name}
                      </Badge>
                    )}
                  </div>
                  <Text size="xs" variant="muted" className="truncate">
                    {request.user?.email ?? ""}
                  </Text>
                </div>
              </div>
              <Badge variant="secondary" state={statusBadgeState} className="px-2.5 py-0.5 shadow-none font-medium shrink-0">
                {request.status}
              </Badge>
            </div>

            <div className="rounded-2xl bg-surface-card-grey p-4 space-y-2.5 text-sm">
              <DetailRow label="Request Type">
                <Badge variant="secondary" state="info" className="text-xs font-medium px-2.5 py-0.5 shadow-none">
                  {requestTypeLabel}
                </Badge>
              </DetailRow>
              {request.createdAt && (
                <DetailRow label="Requested">
                  <Text size="sm" className="text-slate-700">{formatRequestedAt(request.createdAt)}</Text>
                </DetailRow>
              )}
              {request.type === "Leave" && (
                <DetailRow label="Leave Dates">
                  <Text size="sm" weight="medium" className="text-slate-900">
                    {formatShiftRequestDateRange(request.startTime, request.endTime)}
                  </Text>
                </DetailRow>
              )}
              {request.type === "Change" && (
                <>
                  {request.shift && (
                    <DetailRow label="Original Shift">
                      <Text size="sm" className="text-slate-700">
                        {formatShiftDateTime(request.shift.startTime, request.shift.endTime)}
                        {request.shift.type?.name ? ` (${request.shift.type.name})` : ""}
                      </Text>
                    </DetailRow>
                  )}
                  <DetailRow label="Requested Swap">
                    <Text size="sm" weight="medium" className="text-slate-900">
                      {formatShiftDateTime(request.startTime, request.endTime)}
                    </Text>
                  </DetailRow>
                </>
              )}
              {request.type === "Cover" && (
                <DetailRow label="Shift to Cover">
                  <Text size="sm" weight="medium" className="text-slate-900">
                    {request.shift
                      ? `${formatShiftDateTime(request.shift.startTime, request.shift.endTime)}${request.shift.type?.name ? ` (${request.shift.type.name})` : ""}`
                      : formatShiftDateTime(request.startTime, request.endTime)}
                  </Text>
                </DetailRow>
              )}
              {request.reason && (
                <DetailRow label="Reason">
                  <Text size="sm" className="text-slate-700">{request.reason}</Text>
                </DetailRow>
              )}
              {request.notes && (
                <DetailRow label="Notes">
                  <Text size="sm" className="text-slate-700">{request.notes}</Text>
                </DetailRow>
              )}
            </div>

            {request.status === "Pending" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Admin Notes (optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add a note for the staff member..."
                  rows={2}
                  className="rounded-xl border-slate-200/80 text-sm resize-none"
                />
              </div>
            )}

            <div className="rounded-2xl bg-amber-50/70 p-3.5 flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="size-4" />
              </div>
              <div>
                <Text size="sm" weight="semibold" className="text-amber-900">
                  Review Coverage Impact
                </Text>
                <Text size="xs" className="text-amber-800">
                  Please verify shift coverage before approving this request.
                </Text>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2.5">
            {request.status === "Pending" ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={() => onReject?.(request.id, adminNotes)}
                  disabled={isPending}
                  className="rounded-xl text-sm font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-none"
                >
                  Reject Request
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => onApprove?.(request.id, adminNotes || undefined)}
                  disabled={isPending}
                  className="rounded-xl text-sm font-medium"
                >
                  {isPending ? "Processing..." : "Approve Request"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleClose}
                className="rounded-xl bg-surface-card-grey hover:bg-slate-200/70 text-sm font-medium text-slate-700 shadow-none"
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
