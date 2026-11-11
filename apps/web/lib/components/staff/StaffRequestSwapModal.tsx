"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { useCreateShiftRequestMutation } from "../../queries/shifts";
import { Shift } from "../../types/shifts";
import { formatUkDate, formatUkTime } from "../../utils/uk-date-time";

interface StaffRequestSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
}

export function StaffRequestSwapModal({
  isOpen,
  onClose,
  shift,
}: StaffRequestSwapModalProps) {
  const createMutation = useCreateShiftRequestMutation();

  const [requestType, setRequestType] = useState<"Change" | "Cover">("Change");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setNotes("");
      setError(null);
      setRequestType("Change");
    }
  }, [isOpen, shift]);

  if (!shift) return null;

  const startDate = new Date(shift.startTime || shift.rawStartTime || "");
  const endDate = new Date(shift.endTime || shift.rawEndTime || "");
  const isValidDate = !isNaN(startDate.getTime());

  const shiftTypeName =
    shift.type?.name ||
    shift.name ||
    "Shift";

  const timingDisplay = (() => {
    if (isValidDate && !isNaN(endDate.getTime())) {
      return `${formatUkTime(startDate)} – ${formatUkTime(endDate)}`;
    }
    if (shift.formattedStartTime && shift.formattedEndTime) {
      return `${shift.formattedStartTime} – ${shift.formattedEndTime}`;
    }
    return shift.timingFormatted || "";
  })();

  const wingName = shift.wing?.name || shift.unit?.name || shift.wardName || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createMutation.mutateAsync({
        type: requestType,
        shiftId: shift.id,
        startTime: isValidDate ? startDate.toISOString() : new Date().toISOString(),
        endTime: !isNaN(endDate.getTime()) ? endDate.toISOString() : new Date().toISOString(),
        reason: reason.trim() || `${requestType === "Change" ? "Shift Swap" : "Shift Cover"} request`,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit swap request");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Request Shift Swap / Cover
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Selected shift preview banner */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 space-y-1">
            <span className="text-sm font-semibold uppercase tracking-wider text-sky-800">
              Selected Shift
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                {shiftTypeName}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {isValidDate
                  ? formatUkDate(startDate, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                  : "Upcoming"}
              </span>
            </div>
            {(timingDisplay || wingName) && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                {timingDisplay && <span>{timingDisplay}</span>}
                {timingDisplay && wingName && <span>•</span>}
                {wingName && <span>{wingName}</span>}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-800">
              Request Type
            </Label>
            <Select
              value={requestType}
              onValueChange={(val) => setRequestType(val as "Change" | "Cover")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Change">Shift Swap (Exchange with a colleague)</SelectItem>
                <SelectItem value="Cover">Request Cover (Find replacement)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-800">
              Reason
            </Label>
            <Input
              type="text"
              placeholder="e.g. Schedule conflict, Medical appointment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-800">
              Colleague / Additional Details (Optional)
            </Label>
            <Textarea
              rows={3}
              placeholder="If you have already agreed with a colleague to swap, mention their name here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
