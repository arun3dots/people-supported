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

export function NutritionSection({ formData, onChange, readOnly }: Props) {
  const dietTextureOptions = [
    "Normal/Standard Diet",
    "Soft & Bite-Sized (Level 6)",
    "Minced & Moist (Level 5)",
    "Pureed (Level 4)",
    "Liquidized (Level 3)",
  ];

  const eatingAssistanceOptions = [
    "Independent",
    "Requires verbal encouragement / setup",
    "Requires physical feeding assistance (1 Staff)",
    "Full feeding support required",
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* 3.1 Diet Texture */}
      <div className="space-y-2">
        <Label required>3.1 Diet Texture / IDDSI Level</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {dietTextureOptions.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => !readOnly && onChange("dietTexture", option)}
              disabled={readOnly}
              className={cn(
                "p-3 rounded-md border text-left text-md font-medium transition-all cursor-pointer flex items-center justify-between gap-2",
                formData.dietTexture === option
                  ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                  : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
              )}
            >
              <span>{option}</span>
              {formData.dietTexture === option && (
                <span className="size-2 rounded-full bg-surface-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3.2 Swallowing & Fluid Thickeners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label required>3.2 Swallowing / Dysphagia &amp; Choking Risk?</Label>
          <div className="flex gap-2.5">
            {["Yes", "No"].map((ans) => (
              <button
                type="button"
                key={ans}
                onClick={() => !readOnly && onChange("swallowingChokingSafety", ans)}
                disabled={readOnly}
                className={cn(
                  "flex-1 p-2.5 rounded-md border text-center text-md font-medium transition-all cursor-pointer",
                  formData.swallowingChokingSafety === ans
                    ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                    : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
                )}
              >
                {ans}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label required>Fluid Thickeners Required?</Label>
          <div className="flex gap-2.5">
            {["Yes", "No"].map((ans) => (
              <button
                type="button"
                key={ans}
                onClick={() => !readOnly && onChange("fluidThickenersRequired", ans)}
                disabled={readOnly}
                className={cn(
                  "flex-1 p-2.5 rounded-md border text-center text-md font-medium transition-all cursor-pointer",
                  formData.fluidThickenersRequired === ans
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

      {/* 3.3 Eating Assistance */}
      <div className="space-y-2">
        <Label required>3.3 Eating &amp; Drinking Assistance Level</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {eatingAssistanceOptions.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => !readOnly && onChange("eatingAssistanceLevel", opt)}
              disabled={readOnly}
              className={cn(
                "p-3 rounded-md border text-left text-md font-medium transition-all cursor-pointer flex items-center justify-between gap-2",
                formData.eatingAssistanceLevel === opt
                  ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                  : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
              )}
            >
              <span>{opt}</span>
              {formData.eatingAssistanceLevel === opt && (
                <span className="size-2 rounded-full bg-surface-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
