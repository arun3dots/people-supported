"use client";

import React, { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Calendar } from "lucide-react";
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
  Text,
  Textarea,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
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
  const [leaveType, setLeaveType] =
    useState<(typeof LEAVE_TYPES)[number]>("Annual Leave");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [reason, setReason] = useState("");

  const durationDays = Math.max(
    1,
    differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1,
  );

  const handleStartDateChange = (nextStart: string) => {
    setStartDate(nextStart);
    if (nextStart && endDate && nextStart > endDate) {
      setEndDate(nextStart);
    }
  };

  const handleSubmit = async () => {
    if (!staffId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a staff member.",
      });
      return;
    }

    if (!startDate || !endDate || endDate < startDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "End date must be on or after the start date.",
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
      setStaffId("");
      setLeaveType("Annual Leave");
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
      <DialogContent
        size="lg"
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
                  New Leave Request
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Log leave on behalf of a staff member. It will be added for
                  review.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Staff Member Select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Staff member <span className="text-rose-500">*</span>
              </Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200/80 bg-white text-sm text-slate-800 cursor-pointer">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName}
                      {s.role?.name ? ` — ${s.role.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leave Type Pill Buttons */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Leave type <span className="text-rose-500">*</span>
              </Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {LEAVE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLeaveType(t)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      leaveType === t
                        ? "bg-primary text-white"
                        : "bg-surface-card-grey text-slate-700 hover:bg-slate-200/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-slate-700">
                  Start date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="h-10 rounded-xl border-slate-200/80 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-slate-700">
                  End date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 rounded-xl border-slate-200/80 text-sm"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Reason / Notes
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Pre-booked family holiday"
                rows={2}
                className="rounded-xl border-slate-200/80 text-sm resize-none"
              />
            </div>

            <div className="rounded-xl bg-surface-card-grey px-3.5 py-2.5 flex items-center justify-between">
              <Text size="sm" variant="subdued">
                Requested Duration
              </Text>
              <Text size="sm" weight="semibold" className="text-slate-900">
                {durationDays} {durationDays === 1 ? "day" : "days"}
              </Text>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="rounded-xl text-sm font-medium"
            >
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
