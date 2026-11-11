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

export function CognitiveSection({ formData, onChange, readOnly }: Props) {
  const toggleArrayItem = (
    field: keyof NeedsAssessmentDataDTO,
    current: string[] | undefined,
    item: string
  ) => {
    if (readOnly) return;
    const list = current || [];
    const updated = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    onChange(field, updated);
  };

  const cognitiveOptions = [
    "None",
    "Mild Cognitive Impairment (MCI)",
    "Early-stage Vascular Dementia",
    "Moderate Alzheimer's / Memory Loss",
    "Advanced Dementia / Severe Impairment",
    "Parkinson's-related Dementia",
    "Lewy Body Dementia",
  ];

  const orientationOptions = [
    "Time (Day/Night)",
    "Place (Where they are)",
    "Person (Recognise family)",
    "Disoriented to Time",
    "Disoriented to Place",
    "Disoriented to Person",
  ];

  const riskOptions = [
    "Exit seeking / Wandering",
    "Agitation / Verbal distress",
    "Physical resistance during care",
    "Sundowning in late afternoon",
    "None / Calm & Cooperative",
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* 2.1 Cognitive Diagnoses */}
      <div className="space-y-2">
        <Label required>2.1 Cognitive Diagnoses / Impairment Levels</Label>
        <div className="flex flex-wrap gap-2">
          {cognitiveOptions.map((option) => {
            const isSelected = (formData.cognitiveDiagnoses || []).includes(option);
            return (
              <button
                type="button"
                key={option}
                onClick={() =>
                  toggleArrayItem("cognitiveDiagnoses", formData.cognitiveDiagnoses, option)
                }
                disabled={readOnly}
                className={cn(
                  "px-3 py-2 rounded-md border text-md font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                    : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
                )}
              >
                <span>{isSelected ? "✓" : "+"}</span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2.2 Orientation Levels */}
      <div className="space-y-2">
        <Label required>2.2 Orientation Levels</Label>
        <div className="flex flex-wrap gap-2">
          {orientationOptions.map((opt) => {
            const isSelected = (formData.orientationLevels || []).includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() =>
                  toggleArrayItem("orientationLevels", formData.orientationLevels, opt)
                }
                disabled={readOnly}
                className={cn(
                  "px-3 py-2 rounded-md border text-md font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                    : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
                )}
              >
                <span>{isSelected ? "✓" : "+"}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2.3 Risk Behaviors */}
      <div className="space-y-2">
        <Label>2.3 Risk Behaviours &amp; Behavioural Support Needs</Label>
        <div className="flex flex-wrap gap-2">
          {riskOptions.map((behavior) => {
            const isSelected = (formData.riskBehaviors || []).includes(behavior);
            return (
              <button
                type="button"
                key={behavior}
                onClick={() =>
                  toggleArrayItem("riskBehaviors", formData.riskBehaviors, behavior)
                }
                disabled={readOnly}
                className={cn(
                  "px-3 py-2 rounded-md border text-md font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                    : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
                )}
              >
                <span>{isSelected ? "✓" : "+"}</span>
                <span>{behavior}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
