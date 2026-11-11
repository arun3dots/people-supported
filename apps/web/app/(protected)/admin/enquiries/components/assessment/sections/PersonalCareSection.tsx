"use client";

import React from "react";
import { Label } from "@repo/ui/components/ui";
import type { NeedsAssessmentDataDTO } from "@repo/schema";
import { cn } from "@repo/ui/lib/utils";

interface Props {
  formData: NeedsAssessmentDataDTO;
  onChange: (field: keyof NeedsAssessmentDataDTO, value: unknown) => void;
  readOnly?: boolean;
}

export function PersonalCareSection({ formData, onChange, readOnly }: Props) {
  const bathingOptions = [
    "Independent",
    "Needs 1 Carer Supervision",
    "Needs 1 Carer Full Physical Support",
    "Needs 2 Carer Full Assistance",
  ];

  const bladderOptions = [
    "Fully Continent",
    "Occasionally Incontinent / Uses Pads",
    "Fully Incontinent (Double Padded)",
    "Catheter Care Required",
  ];

  const bowelOptions = [
    "Fully Continent",
    "Incontinent / Stoma Care Required",
    "Prone to Constipation / Bowel Management Plan",
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* 4.1 Bathing & Showering */}
      <div className="space-y-2">
        <Label required>4.1 Bathing &amp; Showering Assistance Level</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {bathingOptions.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => !readOnly && onChange("bathingShoweringAssistance", opt)}
              disabled={readOnly}
              className={cn(
                "p-3 rounded-md border text-left text-md font-medium transition-all cursor-pointer flex items-center justify-between gap-2",
                formData.bathingShoweringAssistance === opt
                  ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                  : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
              )}
            >
              <span>{opt}</span>
              {formData.bathingShoweringAssistance === opt && (
                <span className="size-2 rounded-full bg-surface-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4.2 Bladder Continence */}
      <div className="space-y-2">
        <Label required>4.2 Bladder Continence Status</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {bladderOptions.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => !readOnly && onChange("bladderContinence", opt)}
              disabled={readOnly}
              className={cn(
                "p-3 rounded-md border text-left text-md font-medium transition-all cursor-pointer flex items-center justify-between gap-2",
                formData.bladderContinence === opt
                  ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                  : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
              )}
            >
              <span>{opt}</span>
              {formData.bladderContinence === opt && (
                <span className="size-2 rounded-full bg-surface-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4.3 Bowel Continence */}
      <div className="space-y-2">
        <Label required>4.3 Bowel Continence Status</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {bowelOptions.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => !readOnly && onChange("bowelContinence", opt)}
              disabled={readOnly}
              className={cn(
                "p-3 rounded-md border text-left text-md font-medium transition-all cursor-pointer flex items-center justify-between gap-2",
                formData.bowelContinence === opt
                  ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                  : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
              )}
            >
              <span>{opt}</span>
              {formData.bowelContinence === opt && (
                <span className="size-2 rounded-full bg-surface-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4.4 Skin Integrity */}
      <div className="space-y-2">
        <Label required>4.4 Skin Integrity &amp; Pressure Ulcer Risk?</Label>
        <div className="flex gap-2.5 max-w-sm">
          {["Yes", "No"].map((ans) => (
            <button
              type="button"
              key={ans}
              onClick={() => !readOnly && onChange("skinIntegrityRisk", ans)}
              disabled={readOnly}
              className={cn(
                "flex-1 p-2.5 rounded-md border text-center text-md font-medium transition-all cursor-pointer",
                formData.skinIntegrityRisk === ans
                  ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                  : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
              )}
            >
              {ans}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
