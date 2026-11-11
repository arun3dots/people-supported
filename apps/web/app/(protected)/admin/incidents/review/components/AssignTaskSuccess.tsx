"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";

interface AssignTaskSuccessProps {
  onClose: () => void;
  onCreateAnother: () => void;
}

export function AssignTaskSuccess({
  onClose,
  onCreateAnother,
}: AssignTaskSuccessProps) {
  return (
    <div className="py-6 px-2 text-center space-y-6">
      {/* Animated / styled celebration checkmark badge */}
      <div className="relative inline-flex items-center justify-center">
        <div className="size-24 rounded-full bg-[#E5ECEB] flex items-center justify-center">
          <div className="size-16 rounded-full bg-[#4A706A] flex items-center justify-center text-white shadow-md">
            <CheckCircle className="size-10 stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-xl font-bold text-[#141F1E]">
          Task Assigned Successfully!
        </h3>
        <p className="text-md text-text-description leading-relaxed">
          The task has been assigned and the assignee has been notified. You can track the progress from the incidents timeline.
        </p>
      </div>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="size-2 rounded-full bg-slate-300" />
        </div>
      </div>

      <div className="space-y-3 max-w-sm mx-auto">
        <Button
          type="button"
          onClick={onClose}
          className="w-full h-11 bg-[#4A706A] hover:bg-[#3D5E59] text-white rounded-xl text-md font-medium shadow-none cursor-pointer"
        >
          View Incident Review
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCreateAnother}
          className="w-full h-11 border border-[#D1D1D1] text-slate-700 hover:bg-slate-50 rounded-xl text-md font-medium shadow-none cursor-pointer"
        >
          Create Another Task
        </Button>
      </div>
    </div>
  );
}
