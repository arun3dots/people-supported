"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Checkbox,
} from "@repo/ui/components/ui";
import { User, ShieldAlert } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { CareTaskRole } from "@repo/schema";
import { CarePlanTaskTimingAndCategory } from "./CarePlanTaskTimingAndCategory";
import { useCarePlanTaskForm, type TaskFormData } from "./useCarePlanTaskForm";

export type { TaskFormData };

interface GoalOption {
  id: string;
  title: string;
}

interface StaffOption {
  id: string;
  fullName: string;
}

interface CarePlanTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: TaskFormData | null;
  goals?: GoalOption[];
  staffList?: StaffOption[];
  residentId?: string;
  carePlanId?: string;
  careJourneyMode?: boolean;
  isLoading?: boolean;
}

export function CarePlanTaskDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  goals = [],
  staffList = [],
  residentId,
  carePlanId,
  careJourneyMode = false,
  isLoading = false,
}: CarePlanTaskDialogProps): React.JSX.Element {
  const {
    formData,
    setFormData,
    titleError,
    setTitleError,
    timeError,
    dateError,
    clearScheduleErrors,
    handleSubmit,
  } = useCarePlanTaskForm({
    initialData,
    isOpen,
    residentId,
    carePlanId,
    careJourneyMode,
    onSubmit,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            {initialData?.id
              ? careJourneyMode
                ? "Edit Care Task"
                : "Edit Daily Routine Task"
              : careJourneyMode
                ? "Add Care Task"
                : "Add Daily Routine Task"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Define the schedule dates, shift slots, timing, and care instructions.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div className="space-y-1.5">
            <Label required>{careJourneyMode ? "Task Title" : "Routine Title"}</Label>
            <Input
              placeholder={
                careJourneyMode
                  ? "e.g. Check heels and sacrum"
                  : "e.g. Assisted Morning Transfer & Wash"
              }
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (titleError) setTitleError(null);
              }}
              errorMessage={titleError || undefined}
            />
          </div>

          {goals.length > 0 && (
            <div className="space-y-1.5">
              <Label>Linked Clinical Goal (Optional)</Label>
              <Select
                value={formData.goalId || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, goalId: val === "none" ? null : val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- General / Unassigned to Goal --</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Step-by-Step Instructions for Carer</Label>
            <Textarea
              placeholder="e.g. Use standing hoist with 2 carers. Ensure non-slip footwear is worn before transfer."
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-1.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-amber-800 text-sm font-semibold">
              <ShieldAlert className="size-4" />
              <span>Safety Precautions / Things to Keep in Mind</span>
            </div>
            <Textarea
              placeholder="e.g. Resident gets dizzy when standing quickly. Check blood pressure first."
              value={formData.precautions}
              onChange={(e) =>
                setFormData({ ...formData, precautions: e.target.value })
              }
              rows={2}
              className="bg-white border-amber-200 focus-visible:ring-amber-400"
            />
          </div>

          <CarePlanTaskTimingAndCategory
            formData={formData}
            setFormData={setFormData}
            timeError={timeError}
            dateError={dateError}
            onClearErrors={clearScheduleErrors}
          />

          <div className="space-y-3 pt-2 border-t border-slate-100">
            {staffList.length > 0 && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-slate-700">
                  <User className="size-3.5" />
                  <span>Assign to Specific Staff (Optional)</span>
                </Label>
                <Select
                  value={formData.assignedStaffId || "unassigned"}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      assignedStaffId: val === "unassigned" ? null : val,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">-- Unassigned (Any On-Duty Carer) --</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.requirePhotoOrNote}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requirePhotoOrNote: !!checked })
                  }
                />
                <span>Require Photo / Note on completion</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.escalateIfSkipped}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, escalateIfSkipped: !!checked })
                  }
                />
                <span>Escalate alert if task skipped</span>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold"
            >
              {isLoading
                ? "Saving..."
                : initialData?.id
                  ? "Update Task"
                  : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
