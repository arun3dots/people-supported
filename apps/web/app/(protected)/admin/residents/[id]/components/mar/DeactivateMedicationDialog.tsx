"use client";
import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@repo/ui/components/ui";

export function DeactivateMedicationDialog({
  open,
  isPrescription,
  reason,
  busy,
  onReasonChange,
  onConfirm,
  onClose,
}: {
  open: boolean;
  isPrescription: boolean;
  reason: string;
  busy: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {isPrescription ? "Stop medication" : "Deactivate medication"}
          </DialogTitle>
          <DialogDescription>
            {isPrescription
              ? "Stops this prescription from today. Future unadministered doses are cancelled; past records remain in the audit history."
              : "Provide a reason to deactivate this medication. The record will remain in the audit history."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label required>Deletion reason</Label>
          <Textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Enter the reason"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={busy || !reason.trim()}
          >
            {busy
              ? "Saving..."
              : isPrescription
                ? "Stop medication"
                : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
