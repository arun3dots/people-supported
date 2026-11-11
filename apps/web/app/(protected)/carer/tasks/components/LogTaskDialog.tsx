"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Text,
  Textarea,
  Input,
} from "@repo/ui/components/ui";
import { DailyTaskItem } from "./types";

interface LogTaskDialogProps {
  task: DailyTaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    status: "Completed" | "Skipped";
    notes?: string;
    skipReason?: string;
  }) => Promise<void>;
  isPending: boolean;
}

export function LogTaskDialog({
  task,
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: LogTaskDialogProps) {
  const [status, setStatus] = useState<"Completed" | "Skipped">("Completed");
  const [notes, setNotes] = useState("");
  const [skipReason, setSkipReason] = useState("");

  useEffect(() => {
    if (task) {
      setStatus("Completed");
      setNotes(task.notes || "");
      setSkipReason(task.skipReason || "");
    }
  }, [task]);

  const handleSubmit = async () => {
    if (status === "Skipped" && !skipReason.trim()) {
      return;
    }
    await onSubmit({
      status,
      notes: notes.trim() || undefined,
      skipReason: status === "Skipped" ? skipReason.trim() : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="default">
        <DialogHeader>
          <DialogTitle>Log Task Activity</DialogTitle>
          <DialogDescription>
            Record care delivery or skip status for{" "}
            <strong>{task?.resident?.fullName || "resident"}</strong>:{" "}
            <span className="text-text-heading font-medium">{task?.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Selection Buttons */}
          <div className="space-y-1.5">
            <Text size="sm" weight="medium" className="text-text-description">
              Outcome
            </Text>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={status === "Completed" ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatus("Completed")}
                className="w-full text-sm font-semibold"
              >
                Mark Completed
              </Button>
              <Button
                type="button"
                variant={status === "Skipped" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setStatus("Skipped")}
                className="w-full text-sm font-semibold"
              >
                Skip / Hand Over
              </Button>
            </div>
          </div>

          {/* Conditional Skip Reason */}
          {status === "Skipped" && (
            <div className="space-y-1.5">
              <Text size="sm" weight="medium" className="text-text-description">
                Reason for Skipping <span className="text-red-500">*</span>
              </Text>
              <Input
                placeholder="e.g. Resident asleep, refused, away at hospital..."
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
              />
            </div>
          )}

          {/* Observation & Care Note */}
          <div className="space-y-1.5">
            <Text size="sm" weight="medium" className="text-text-description">
              Observation & Care Notes
            </Text>
            <Textarea
              placeholder="Record details (e.g. Completed with 1 carer, good fluid intake, responsive)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isPending || (status === "Skipped" && !skipReason.trim())}
            onClick={handleSubmit}
          >
            {isPending ? "Saving..." : "Save Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
