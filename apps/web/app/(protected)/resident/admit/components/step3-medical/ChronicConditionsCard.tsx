"use client";

import React from "react";
import { Button, Text } from "@repo/ui/components/ui";
import { CHRONIC_CONDITIONS_LIST } from "../../data/admissionFormFields";
import { AdmissionFormData } from "../../types";
import { Check, Plus } from "lucide-react";

interface ChronicConditionsCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function ChronicConditionsCard({
  formData,
  updateFormData,
}: ChronicConditionsCardProps) {
  const toggleCondition = (condition: string) => {
    const exists = formData.chronicConditions.includes(condition);
    const next = exists
      ? formData.chronicConditions.filter((c: string) => c !== condition)
      : [...formData.chronicConditions, condition];
    updateFormData({ chronicConditions: next });
  };

  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      <div className="pb-4 border-b border-slate-200/80">
        <Text as="h3" size="md" weight="bold">
          Chronic Conditions Checklist
        </Text>
        <Text size="md" weight="regular" variant="subdued">
          Select all that currently apply to this resident.
        </Text>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {CHRONIC_CONDITIONS_LIST.map((cond) => {
          const isSelected = formData.chronicConditions.includes(cond);
          return (
            <Button
              key={cond}
              type="button"
              variant={isSelected ? "primary" : "outline"}
              onClick={() => toggleCondition(cond)}
              className={`justify-start font-semibold rounded-xl px-3.5 shadow-none transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-800 border-emerald-800 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isSelected ? <Check className="size-3.5 text-white" /> : <Plus className="size-3.5 text-slate-400" />}
              <span className="truncate">{cond}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
