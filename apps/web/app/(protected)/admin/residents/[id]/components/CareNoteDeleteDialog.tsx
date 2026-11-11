"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Text,
} from "@repo/ui/components/ui";

export interface DeleteCareNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteCareNoteDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteCareNoteDialogProps): React.JSX.Element {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="size-5" />
            <span>Delete Care Note?</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <Text size="md" className="text-slate-600 leading-relaxed">
            Are you sure you want to delete this care note? This action will soft-delete the record and be logged in the clinical audit trail.
          </Text>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isDeleting}
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
