"use client";

import React from "react";
import { UserCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";

interface IncidentReviewFooterProps {
  onSaveDraft?: () => void;
  onAssignTask: () => void;
  onResolveIncident: () => void;
  isSaving?: boolean;
  readOnly?: boolean;
}

export function IncidentReviewFooter({
  onAssignTask,
  onResolveIncident,
  isSaving = false,
  readOnly = false,
}: IncidentReviewFooterProps) {
  if (readOnly) {
    return (
      <div className="flex items-center justify-end pt-4 border-t border-slate-200 font-sans">
        <div className="rounded-xl bg-slate-100 px-4 py-2 text-md font-semibold text-slate-600">
          Closed incident — read-only
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 font-sans">
      {/* Right: Assign Task & Resolve Incident */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onAssignTask}
          disabled={isSaving}
          className="h-11 px-5 rounded-xl text-md font-semibold flex items-center gap-2 shadow-none cursor-pointer"
        >
          <UserCheck className="size-4 text-slate-500" />
          <span>Assign Task</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={onResolveIncident}
          disabled={isSaving}
          className="h-11 px-6 rounded-xl text-md font-semibold flex items-center gap-2 shadow-none cursor-pointer"
        >
          <CheckCircle2 className="size-4" />
          <span>Resolve Incident</span>
        </Button>
      </div>
    </div>
  );
}
