"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@repo/ui/components/ui";

interface ConfirmActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function ConfirmActivationModal({
  open,
  onOpenChange,
  onBack,
  onConfirm,
  isPending,
}: ConfirmActivationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="text-amber-600 flex items-center gap-2">
            Confirm Activation
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <p className="text-md text-slate-600 font-medium">
            You are about to set this Care Plan to Active.
          </p>
          <p className="text-md text-muted-foreground bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <strong>Important:</strong> Only one Care Plan can be active at a time. Setting this Care Plan to Active will automatically expire any currently active Care Plan for this resident.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
          >
            Back to Edit
          </Button>
          <Button
            type="button"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Activating..." : "Confirm & Activate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
