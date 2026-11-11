"use client";

import React, { useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { Calendar } from "lucide-react";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { useCreateLeaveRequestMutation } from "../../../../../../lib/queries/shifts";

interface NewLeaveRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffList: StaffMember[];
}

const LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Compassionate",
  "Training",
  "TOIL",
  "Unpaid",
] as const;

export function NewLeaveRequestModal({
  open,
  onOpenChange,
  staffList,
}: NewLeaveRequestModalProps): React.JSX.Element {
  const { toast } = useToast();
  const createMutation = useCreateLeaveRequestMutation();

  const [staffId, setStaffId] = useState("");
  const [leaveType, setLeaveType] = useState<(typeof LEAVE_TYPES)[number]>("Annual Leave");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");

  const durationDays = Math.max(
    1,
    differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1,
  );

  const handleSubmit = async () => {
    if (!staffId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a staff member.",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        staffId,
        type: leaveType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      });

      toast({
        title: "Leave Request Submitted",
        description: "Leave request logged successfully and awaiting review.",
      });
      onOpenChange(false);
      setReason("");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to submit request",
        description: err instanceof Error ? err.message : "An error occurred",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg font-sans">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Calendar className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                New Leave Request
              </DialogTitle>
              <DialogDescription className="text-md text-slate-500">
                Log leave on behalf of a staff member. It will be added for review.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Staff Member Select */}
          <div className="space-y-1">
            <Label className="text-md font-bold text-slate-800">Staff member *</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName} — {s.role?.name || "Staff"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leave Type Pill Buttons */}
          <div className="space-y-1.5">
            <Label className="text-md font-bold text-slate-800">Leave type *</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {LEAVE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLeaveType(t)}
                  className={`px-3 py-1.5 rounded-lg text-md font-semibold transition-all ${
                    leaveType === t
                      ? "bg-emerald-800 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-md font-bold text-slate-800">Start date *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-md font-bold text-slate-800">End date *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <Label className="text-md font-bold text-slate-800">Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Pre-booked family holiday"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="text-md font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            Duration: <span className="font-bold text-slate-900">{durationDays} {durationDays === 1 ? "day" : "days"}</span>
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-4 text-md">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl h-10 px-5 text-md font-bold"
          >
            {createMutation.isPending ? "Submitting..." : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
