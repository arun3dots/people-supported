"use client";

import React from "react";
import { Input, Label, Text } from "@repo/ui/components/ui";
import { AdmissionFormData } from "../../types";

interface PsychosocialPreferencesCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function PsychosocialPreferencesCard({
  formData,
  updateFormData,
}: PsychosocialPreferencesCardProps) {
  const familyValue =
    formData.familyInvolvement === "Frequent weekly visits"
      ? ""
      : (formData.familyInvolvement || "");
  const routineValue =
    formData.routinePreferences === "Enjoys morning gardening and afternoon reading"
      ? ""
      : (formData.routinePreferences || "");
  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      <div className="pb-4 border-b border-slate-200/80">
        <Text as="h3" size="md" weight="bold">
          Psychosocial &amp; Daily Routine Preferences
        </Text>
        <Text size="md" weight="regular" variant="subdued">
          Social support dynamics, family visits, and individualized habits.
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Family Involvement &amp; Social Support</Label>
          <Input
            type="text"
            placeholder="e.g. Daughter visits Tuesdays"
            value={familyValue}
            onChange={(e) => updateFormData({ familyInvolvement: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Daily Routine &amp; Habits</Label>
          <Input
            type="text"
            placeholder="e.g. Early riser (07:00), prefers tea"
            value={routineValue}
            onChange={(e) => updateFormData({ routinePreferences: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
