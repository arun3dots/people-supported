"use client";

import React, { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { AlertCircle } from "lucide-react";

interface TaskSkipReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (skipReason: string, notes?: string) => void;
  taskTitle: string;
  isLoading?: boolean;
}

const COMMON_REASONS = [
  "Resident declined intervention",
  "Resident asleep / resting",
  "Resident offsite / hospital appointment",
  "Clinical condition changed",
  "Already completed by family/external staff",
  "Other reason (please specify)",
];

const TaskSkipReasonSchema = z
  .object({
    selectedReason: z.string().min(1, "Please select a primary reason"),
    customReason: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.selectedReason === "Other reason (please specify)" &&
      (!data.customReason || !data.customReason.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify a reason for skipping this care task",
        path: ["customReason"],
      });
    }
  });

export function TaskSkipReasonModal({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
  isLoading = false,
}: TaskSkipReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0] || "");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = TaskSkipReasonSchema.safeParse({ selectedReason, customReason, notes });
    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString();
        if (key && !errMap[key]) {
          errMap[key] = issue.message;
        }
      });
      setErrors(errMap);
      return;
    }

    setErrors({});
    const finalReason =
      selectedReason === "Other reason (please specify)"
        ? customReason.trim()
        : selectedReason;

    onSubmit(finalReason || "Other", notes.trim() || undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-5 h-5" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Record Task Skip Reason
            </DialogTitle>
          </div>
          <p className="text-md text-slate-500 mt-1">
            Skipping routine: <span className="font-semibold text-slate-800">\"{taskTitle}\"</span>. A clinical justification is required for CQC audit compliance.
          </p>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-md font-semibold text-slate-700 block mb-1">
              Primary Reason <span className="text-rose-500">*</span>
            </label>
            <Select
              value={selectedReason}
              onValueChange={(val) => {
                setSelectedReason(val);
                clearFieldError("selectedReason");
              }}
            >
              <SelectTrigger className={`rounded-xl border-slate-200 ${errors.selectedReason ? "border-border-error" : ""}`}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.selectedReason && (
              <p className="text-sm text-text-error font-medium min-h-[18px] mt-1">
                {errors.selectedReason}
              </p>
            )}
          </div>

          {selectedReason === "Other reason (please specify)" && (
            <div>
              <label className="text-md font-semibold text-slate-700 block mb-1">
                Specify Reason <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                placeholder="Detail reason for skipping..."
                value={customReason}
                errorMessage={errors.customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  clearFieldError("customReason");
                }}
                className="rounded-xl border-slate-200"
              />
            </div>
          )}

          <div>
            <label className="text-md font-semibold text-slate-700 block mb-1">
              Additional Carer Notes (Optional)
            </label>
            <Textarea
              rows={2}
              placeholder="Any supplementary observations or handover notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Skip
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
