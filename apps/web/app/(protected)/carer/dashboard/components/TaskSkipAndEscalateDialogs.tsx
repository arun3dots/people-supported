"use client";

import React from "react";
import { AlertTriangle, Flame } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Textarea,
  Label,
} from "@repo/ui/components/ui";

interface TaskSkipAndEscalateDialogsProps {
  skipDialogOpen: boolean;
  onCloseSkipDialog: () => void;
  skipReason: string;
  onSkipReasonChange: (val: string) => void;
  onConfirmSkip: () => void;
  showAutoPrompt: boolean;
  onCloseAutoPrompt: () => void;
  onConfirmAutoPrompt: () => void;
  escalationData: {
    residentName?: string;
    notes?: string;
  };
}

export function TaskSkipAndEscalateDialogs({
  skipDialogOpen,
  onCloseSkipDialog,
  skipReason,
  onSkipReasonChange,
  onConfirmSkip,
  showAutoPrompt,
  onCloseAutoPrompt,
  onConfirmAutoPrompt,
  escalationData,
}: TaskSkipAndEscalateDialogsProps) {
  return (
    <>
      {/* Skip Task Reason Modal */}
      <Dialog open={skipDialogOpen} onOpenChange={(open) => !open && onCloseSkipDialog()}>
        <DialogContent size="md" className="font-['Outfit',sans-serif] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Skip Scheduled Routine Task
            </DialogTitle>
            <DialogDescription className="text-md text-slate-500 font-medium">
              Document a clear clinical or resident reason for skipping this scheduled task.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            <Label required>
              Reason for Skipping
            </Label>
            <Textarea
              placeholder="e.g. Resident declined, feeling unwell, asleep during scheduled slot..."
              value={skipReason}
              onChange={(e) => onSkipReasonChange(e.target.value)}
              className="text-md min-h-[90px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloseSkipDialog}
              className="h-9 px-4 rounded-xl text-md font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!skipReason.trim()}
              onClick={onConfirmSkip}
              className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-md"
            >
              Confirm Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Prompt for Clinical Escalation when Skipped for Unwell/Refused */}
      <Dialog open={showAutoPrompt} onOpenChange={(open) => !open && onCloseAutoPrompt()}>
        <DialogContent size="md" className="font-['Outfit',sans-serif] rounded-2xl">
          <DialogHeader className="flex flex-row items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Raise Clinical Alert to Nurse?
              </DialogTitle>
              <DialogDescription className="text-md text-slate-500">
                This task was skipped due to resident refusal or illness. Would you like to notify the Nurse on duty immediately?
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl text-md text-rose-900 space-y-1">
            <div className="font-semibold">{escalationData.residentName}</div>
            <div className="text-slate-600">{escalationData.notes}</div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloseAutoPrompt}
              className="h-9 px-4 rounded-xl text-md font-semibold"
            >
              Skip Task Only
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onConfirmAutoPrompt}
              variant={"primary"}>
              <Flame className="size-3.5" />
              Yes, Alert Nurse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
