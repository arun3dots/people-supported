"use client";

import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui";
import { Trash2 } from "lucide-react";

interface DeleteDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName?: string;
  onConfirmDelete: () => void;
}

export function DeleteDocumentModal({
  open,
  onOpenChange,
  documentName,
  onConfirmDelete,
}: DeleteDocumentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="size-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-2">
            <Trash2 className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Remove Handover Document
          </DialogTitle>
          <DialogDescription className="text-md text-slate-500 font-medium leading-relaxed">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-slate-900">
              "{documentName || "this document"}"
            </span>{" "}
            from the discharge handover documents? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-md hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirmDelete();
              onOpenChange(false);
            }}
            className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-md shadow-xs transition-colors cursor-pointer"
          >
            Yes, Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
