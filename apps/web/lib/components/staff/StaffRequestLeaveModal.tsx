"use client";

import React, { useState } from "react";
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
} from "@repo/ui/components/ui";
import { format } from "date-fns";
import { useCreateShiftRequestMutation } from "../../queries/shifts";

interface StaffRequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StaffRequestLeaveModal({
  isOpen,
  onClose,
}: StaffRequestLeaveModalProps) {
  const createMutation = useCreateShiftRequestMutation();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    if (end < start) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        type: "Leave",
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        reason: reason.trim() || "Annual leave",
        notes: notes.trim() || undefined,
        shiftId: null,
      });
      onClose();
      setReason("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit leave request");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Request Leave
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-md text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="space-y-1.5">
              <Label className="text-md font-semibold text-slate-800">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-md font-semibold text-slate-800">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-md font-semibold text-slate-800">
              Reason
            </Label>
            <Input
              type="text"
              placeholder="e.g. Annual leave, Medical appointment, Personal"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-md font-semibold text-slate-800">
              Additional Notes (Optional)
            </Label>
            <Textarea
              rows={3}
              placeholder="Any details to help with shift scheduling..."
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
