"use client";

import React, { useState } from "react";
import {
  User,
  Eye,
  Scan,
  UserCheck,
  FileText,
  Star,
  ShieldCheck,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import { Textarea } from "@repo/ui/components/ui/Textarea";
import { toast } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export interface InvestigationStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  notes?: string;
  isSaved?: boolean;
}

interface InvestigationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investigationSteps: InvestigationStep[];
  onSaveStep: (stepId: string, notes: string) => void;
  onComplete: () => void;
  onOpenAssignTask: () => void;
  description?: string;
}

export function InvestigationModal({
  open,
  onOpenChange,
  investigationSteps,
  onSaveStep,
  onComplete,
  onOpenAssignTask,
  description = "Review and document the investigation findings for this incident.",
}: InvestigationModalProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(
    "resident-statement",
  );
  const [stepDraftNotes, setStepDraftNotes] = useState<Record<string, string>>(
    {},
  );

  const toggleStep = (stepId: string) => {
    setExpandedStepId((prev) => (prev === stepId ? null : stepId));
  };

  const handleNoteChange = (stepId: string, val: string) => {
    setStepDraftNotes((prev) => ({ ...prev, [stepId]: val }));
  };

  const handleSaveStep = (stepId: string) => {
    const notes = stepDraftNotes[stepId] ?? "";
    onSaveStep(stepId, notes);
    toast({
      title: "Step Saved",
      description: "Investigation step has been saved successfully.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-xl font-bold text-text-heading">
            Start Investigation
          </DialogTitle>
          <DialogDescription className="text-md text-text-description">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Steps List */}
        <div className="space-y-3 my-2 pr-1">
          {investigationSteps.map((step) => {
            const Icon = step.icon;
            const isExpanded = expandedStepId === step.id;
            const currentNotes =
              stepDraftNotes[step.id] !== undefined
                ? stepDraftNotes[step.id]
                : step.notes || "";

            return (
              <div
                key={step.id}
                className={cn(
                  "border rounded-xl transition-all duration-200 overflow-hidden",
                  isExpanded
                    ? "border-[#4A706A] bg-slate-50/40"
                    : "border-[#E5E5E5] bg-white",
                )}
              >
                {/* Step Header */}
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-[#F0F5F4] flex items-center justify-center text-[#4A706A] shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-md font-semibold text-[#141F1E]">
                        {step.title}
                      </span>
                      <span className="text-md text-text-description">
                        {step.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </div>
                </button>

                {/* Step Content */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-[#E5E5E5] space-y-3 bg-white">
                    <div className="relative">
                      <Textarea
                        value={currentNotes}
                        onChange={(e) =>
                          handleNoteChange(step.id, e.target.value)
                        }
                        placeholder={`Write your ${step.title} notes here...`}
                        rows={3}
                        className="w-full bg-white border border-[#D1D1D1] rounded-lg p-3 text-md text-text-body min-h-[90px]"
                      />
                      <span className="absolute bottom-2 right-2 text-md text-slate-400">
                        {(currentNotes || "").length}/250
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      {step.id === "prevent-future" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onOpenAssignTask}
                          className="h-8 px-3 text-md font-medium rounded-lg cursor-pointer"
                        >
                          <Plus className="size-3.5" />
                          Add Task
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => handleSaveStep(step.id)}
                        className="h-8 px-4 bg-[#4A706A] hover:bg-[#3D5E59] text-white text-md font-medium rounded-lg cursor-pointer"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-5 border-[#D1D1D1] text-text-body rounded-xl text-md font-medium hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onComplete}
            className="h-10 px-5 bg-[#4A706A] hover:bg-[#3D5E59] text-white rounded-xl text-md font-medium cursor-pointer"
          >
            Complete Investigation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
