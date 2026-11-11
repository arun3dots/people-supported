"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Textarea,
  Badge,
} from "@repo/ui/components/ui";
import { CheckCircle2, XCircle, RotateCcw, AlertTriangle } from "lucide-react";

interface CarePlanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecide: (decision: "Approved" | "Rejected" | "ChangesRequested", comments?: string) => void;
  role: string;
  planVersion: number;
  isLoading?: boolean;
}

export function CarePlanApprovalModal({
  isOpen,
  onClose,
  onDecide,
  role,
  planVersion,
  isLoading = false,
}: CarePlanApprovalModalProps) {
  const [selectedDecision, setSelectedDecision] = useState<
    "Approved" | "Rejected" | "ChangesRequested" | null
  >(null);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  const versionPill = `v${String(planVersion).padStart(4, "0")}`;

  const handleSubmit = () => {
    if (!selectedDecision) {
      setError("Please select a decision action.");
      return;
    }

    if (
      (selectedDecision === "Rejected" || selectedDecision === "ChangesRequested") &&
      !comments.trim()
    ) {
      setError(`A clinical rationale comment is mandatory when selecting ${selectedDecision}.`);
      return;
    }

    setError(null);
    onDecide(selectedDecision, comments.trim() || undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold text-slate-900">
              Clinical Sign-Off Review
            </DialogTitle>
            <Badge variant="secondary" className="font-mono text-md">
              {versionPill}
            </Badge>
          </div>
          <p className="text-md text-slate-500 mt-1">
            Reviewing as <span className="font-semibold text-slate-800">{role} Approver</span>. Your decision will be permanently recorded in the CQC regulatory audit log.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Decision Buttons Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedDecision("Approved");
                setError(null);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-md font-semibold ${selectedDecision === "Approved"
                ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Approve
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDecision("ChangesRequested");
                setError(null);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-md font-semibold ${selectedDecision === "ChangesRequested"
                ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
            >
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Request Changes
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDecision("Rejected");
                setError(null);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-md font-semibold ${selectedDecision === "Rejected"
                ? "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
            >
              <XCircle className="w-5 h-5 text-rose-600" />
              Reject Plan
            </button>
          </div>

          {/* Comments input */}
          <div>
            <label className="text-md font-semibold text-slate-700 block mb-1">
              Clinical Comments & Feedback{" "}
              {selectedDecision && selectedDecision !== "Approved" && (
                <span className="text-rose-500">* (Mandatory)</span>
              )}
            </label>
            <Textarea
              rows={3}
              placeholder={
                selectedDecision === "Approved"
                  ? "Optional sign-off notes or instructions..."
                  : "Please detail specific clinical adjustments required before approval..."
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-md flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
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
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedDecision}
            className={`rounded-xl text-white ${selectedDecision === "Approved"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : selectedDecision === "Rejected"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-amber-600 hover:bg-amber-700"
              }`}
          >
            Confirm Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
