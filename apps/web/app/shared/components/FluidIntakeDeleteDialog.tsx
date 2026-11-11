"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui";

interface FluidIntakeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function FluidIntakeDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: FluidIntakeDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md font-sans">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold text-slate-900">
            Delete Intake Entry?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-slate-500">
            Are you sure you want to delete this intake entry? This action will remove the record from daily hydration calculations and will be logged in the audit trail.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="text-sm h-9 px-4 cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white text-sm h-9 px-4 cursor-pointer"
          >
            {isPending ? "Deleting..." : "Delete Entry"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

