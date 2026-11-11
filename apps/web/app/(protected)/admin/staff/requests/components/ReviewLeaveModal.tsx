"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/ui/Dialog";
import { Button, Text, Badge, Textarea } from "@repo/ui/components/ui";
import { ShiftRequest } from "../../../../../../lib/types/shifts";
import { format, formatDistanceToNow } from "date-fns";

interface ReviewLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ShiftRequest | null;
  onApprove?: (id: string, notes?: string) => void;
  onReject?: (id: string, notes: string) => void;
  isPending?: boolean;
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDateRange(startTime: string, endTime: string) {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")} (${days} day${days > 1 ? "s" : ""})`;
  } catch {
    return "—";
  }
}

function formatShiftDateTime(startTime: string | Date, endTime: string | Date) {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${format(start, "d MMM yyyy")}, ${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
  } catch {
    return "—";
  }
}

function formatRequestedAt(createdAt: string) {
  try {
    const date = new Date(createdAt);
    return `${formatDistanceToNow(date, { addSuffix: true })} (${format(date, "d MMM yyyy, HH:mm")})`;
  } catch {
    return "—";
  }
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

  const handleApprove = () => {
    if (onApprove) onApprove(request.id, adminNotes || undefined);
  };

  const handleReject = () => {
    if (onReject) onReject(request.id, adminNotes);
  };

  const handleClose = () => {
    setAdminNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="2xl" className="rounded-2xl font-['Outfit',sans-serif] sm:max-w-2xl max-h-[92vh] overflow-y-auto sm:overflow-visible">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 border-[#BCD3CD]">
          <div>
            <DialogTitle className="text-lg font-semibold text-[#141F1E]">
              {modalTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5D5D5D]">
              Review request specifics and confirm coverage before deciding.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {/* Staff Info Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A706A] to-[#2D4541] flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm border border-white">
              {getInitials(request.user?.fullName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Text size="base" weight="medium" className="text-[#141F1E]">
                  {request.user?.fullName ?? "Staff Member"}
                </Text>
                {request.user?.role?.name && (
                  <Badge variant="outline" className="text-xs border-slate-200 text-slate-600 bg-slate-50">
                    {request.user.role.name}
                  </Badge>
                )}
              </div>
              <Text size="sm" weight="regular" className="text-[#5D5D5D]">
                {request.user?.email ?? ""}
              </Text>
            </div>
          </div>

          {/* Details Table Rows in Single-Column Aligned List */}
          <div className="space-y-2.5 border-y border-[#BCD3CD] py-3 text-sm">
            <div className="flex items-center gap-3">
              <Text size="sm" weight="medium" className="text-[#5D5D5D] w-32 shrink-0">
                Request Type
              </Text>
              <div>
                <Badge
                  variant="outline"
                  className="bg-[#F8FAF9] text-[#141F1E] border-[#BCD3CD] text-xs font-medium px-2.5 py-0.5"
                >
                  {request.type === "Change" ? "Shift Swap" : request.type === "Cover" ? "Shift Cover" : request.type}
                </Badge>
              </div>
            </div>

            {request.createdAt && (
              <div className="flex items-center gap-3">
                <Text size="sm" weight="medium" className="text-[#5D5D5D] w-32 shrink-0">
                  Requested
                </Text>
                <Text size="sm" weight="normal" className="text-[#5D5D5D]">
                  {formatRequestedAt(request.createdAt)}
                </Text>
              </div>
            )}

            {request.type === "Leave" && (
              <div className="flex items-center gap-3">
                <Text size="sm" weight="medium" className="text-[#5D5D5D] w-32 shrink-0">
                  Leave Dates
                </Text>
                <Text size="sm" weight="normal" className="text-[#5D5D5D]">
                  {formatDateRange(request.startTime, request.endTime)}
                </Text>
              </div>
            )}

            {request.type === "Change" && (
              <>
                {request.shift && (
                  <div className="flex items-center gap-3">
                    <Text size="sm" weight="medium" className="text-[#5D5D5D] w-32 shrink-0">
                      Original Shift
                    </Text>
                    <Text size="sm" weight="normal" className="text-[#5D5D5D]">
                      {formatShiftDateTime(request.shift.startTime, request.shift.endTime)}
                      {request.shift.type?.name ? ` (${request.shift.type.name})` : ""}
                    </Text>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Text size="sm" weight="medium" className="text-[#5D5D5D] w-32 shrink-0">
                    Requested Swap
                  </Text>
                  <Text size="sm" weight="normal" className="text-[#5D5D5D]">
                    {formatShiftDateTime(request.startTime, request.endTime)}
                  </Text>
                </div>
              </>
            )}

            {request.type === "Cover" && (
              <div className="flex items-center gap-3">
                <Text size="sm" weight="medium" className="text-[#5D5D5D] w-32 shrink-0">
                  Shift to Cover
                </Text>
                <Text size="sm" weight="normal" className="text-[#5D5D5D]">
                  {request.shift
                    ? `${formatShiftDateTime(request.shift.startTime, request.shift.endTime)}${request.shift.type?.name ? ` (${request.shift.type.name})` : ""}`
                    : formatShiftDateTime(request.startTime, request.endTime)}
                </Text>
              </div>
            )}

            {request.reason && (
              <div className="flex items-start gap-3">
                <Text size="sm" weight="medium" className="text-[#5D5D5D] w-32 shrink-0">
                  Reason
                </Text>
                <Text size="sm" weight="normal" className="text-[#5D5D5D]">
                  {request.reason}
                </Text>
              </div>
            )}

            {request.notes && (
              <div className="flex items-start gap-3">
                <Text size="sm" weight="medium" className="text-[#5D5D5D] w-32 shrink-0">
                  Notes
                </Text>
                <Text size="sm" weight="regular" className="text-[#5D5D5D]">
                  {request.notes}
                </Text>
              </div>
            )}

            {request.status !== "Pending" && (
              <div className="flex items-center gap-3">
                <Text size="sm" weight="medium" className="text-[#5D5D5D] w-32 shrink-0">
                  Status
                </Text>
                <Text
                  size="sm"
                  weight="medium"
                  className={request.status === "Approved" ? "text-[#22973F]" : "text-red-600"}
                >
                  {request.status}
                </Text>
              </div>
            )}
          </div>

          {/* Admin Notes */}
          {request.status === "Pending" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#5D5D5D]">
                Admin Notes (optional)
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add a note for the staff member…"
                rows={2}
                className="w-full rounded-xl border border-[#BCD3CD] p-2.5 text-sm text-[#141F1E] resize-none focus:outline-none focus:ring-2 focus:ring-[#4A706A]/30 min-h-[50px]"
              />
            </div>
          )}

          {/* Coverage Alert Banner */}
          <div className="bg-[#FEFCE8] border border-amber-200 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <Text size="sm" weight="semibold" className="text-amber-900 leading-tight">
                Review Coverage Impact
              </Text>
              <Text size="sm" weight="medium" className="text-amber-800 text-xs">
                Please verify shift coverage before approving this request.
              </Text>
            </div>
          </div>

          {/* Footer Action Buttons */}
          {request.status === "Pending" ? (
            <div className="flex items-center gap-2.5 sm:gap-3 pt-3 border-t border-[#BCD3CD]">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 h-10 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReject}
                disabled={isPending}
                className="flex-1 h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-60 cursor-pointer"
              >
                Reject Request
              </Button>
              <Button
                type="button"
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1 h-10 rounded-xl bg-[#4A706A] hover:bg-[#3D5E59] text-white text-sm font-medium shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {isPending ? "Processing…" : "Approve Request"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end pt-3 border-t border-[#BCD3CD]">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-10 px-6 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium cursor-pointer"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
