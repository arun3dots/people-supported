"use client";

import React from "react";
import { Input, Label } from "@repo/ui/components/ui";
import type { NeedsAssessmentDataDTO } from "@repo/schema";
import { cn } from "@repo/ui/lib/utils";

interface Props {
  formData: NeedsAssessmentDataDTO;
  onChange: (field: keyof NeedsAssessmentDataDTO, value: unknown) => void;
  readOnly?: boolean;
}

export function MobilitySection({ formData, onChange, readOnly }: Props) {
  return (
    <div className="space-y-5 font-sans">
      {/* 1.1 Mobility Status */}
      <div className="space-y-2">
        <Label required>1.1 Independent Mobility Status</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            "Fully independent (no equipment)",
            "Uses walking stick / frame independently",
            "Requires 1-staff supervision/verbal prompts",
            "Requires 1-staff physical support",
            "Requires 2-staff physical support + mechanical hoist",
          ].map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => !readOnly && onChange("mobilityStatus", option)}
              disabled={readOnly}
              className={cn(
                "p-3 rounded-md border text-left text-md font-medium transition-all cursor-pointer flex items-center justify-between gap-2",
                formData.mobilityStatus === option
                  ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                  : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
              )}
            >
              <span>{option}</span>
              {formData.mobilityStatus === option && (
                <span className="size-2 rounded-full bg-surface-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 1.2 Transfer Dependency */}
      <div className="space-y-2">
        <Label required>1.2 Transfer Dependency (e.g., getting out of bed or low chair)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            "Independent",
            "Needs 1 Carer Assistance",
            "Needs 2 Carer Assistance",
            "Hoist Only",
          ].map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => !readOnly && onChange("transferDependency", opt)}
              disabled={readOnly}
              className={cn(
                "p-2.5 rounded-md border text-center text-md font-medium transition-all cursor-pointer",
                formData.transferDependency === opt
                  ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                  : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 1.3 Fall History */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label required>1.3 Fall History: Has prospect suffered falls in last 90 days?</Label>
          <div className="flex gap-2.5">
            {["Yes", "No"].map((ans) => (
              <button
                type="button"
                key={ans}
                onClick={() => !readOnly && onChange("fallHistory", ans)}
                disabled={readOnly}
                className={cn(
                  "flex-1 p-2.5 rounded-md border text-center text-md font-medium transition-all cursor-pointer",
                  formData.fallHistory === ans
                    ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                    : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
                )}
              >
                {ans}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>If yes, specify frequency and resulting injuries/fractures</Label>
          <Input
            value={formData.fallInjuriesNotes || ""}
            onChange={(e) => onChange("fallInjuriesNotes", e.target.value)}
            placeholder="e.g. 2 unwitnessed falls at home, no fractures"
            disabled={readOnly || formData.fallHistory === "No"}
          />
        </div>
      </div>
    </div>
  );
}
