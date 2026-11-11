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

export function MedicalSection({ formData, onChange, readOnly }: Props) {
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

  const medCapacityOptions = [
    "Fully capable of self-administering medication (Requires room safe box)",
    "Prompts / Reminders required from Carers",
    "Full medication administration by Trained Staff / Nurse",
    "Covert medication protocol required (GP sign-off)",
  ];

  const medicalInterventionsOptions = [
    "PEG Feeding / Enteral Nutrition",
    "Diabetes Management (Insulin / Blood Glucose Monitoring)",
    "Oxygen Therapy",
    "Tissue Viability / Wound Dressing",
    "Catheter / Stoma Care",
    "Syringe Driver / Palliative Care Support",
    "None",
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* 5.1 Medication Administration Capacity */}
      <div className="space-y-2">
        <Label required>5.1 Medication Administration Capacity</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {medCapacityOptions.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => !readOnly && onChange("medicationAdminCapacity", opt)}
              disabled={readOnly}
              className={cn(
                "p-3 rounded-md border text-left text-md font-medium transition-all cursor-pointer flex items-center justify-between gap-2",
                formData.medicationAdminCapacity === opt
                  ? "bg-surface-neutral border-surface-primary text-text-body shadow-2xs font-semibold"
                  : "bg-white border-border-secondary text-text-body hover:bg-surface-neutral"
              )}
            >
              <span>{opt}</span>
              {formData.medicationAdminCapacity === opt && (
                <span className="size-2 rounded-full bg-surface-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 5.2 Specialized Medical Interventions */}
      <div className="space-y-2">
        <Label>5.2 Specialised Clinical &amp; Nursing Interventions Required</Label>
        <div className="flex flex-wrap gap-2">
          {medicalInterventionsOptions.map((item) => {
            const isSelected = (
              formData.specializedMedicalInterventions || []
            ).includes(item);
            return (
              <button
                type="button"
                key={item}
                onClick={() =>
                  toggleArrayItem(
                    "specializedMedicalInterventions",
                    formData.specializedMedicalInterventions,
                    item
                  )
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
                <span>{item}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
