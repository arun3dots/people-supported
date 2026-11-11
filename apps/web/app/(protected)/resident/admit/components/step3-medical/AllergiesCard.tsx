"use client";

import React from "react";
import { Input, Label, Badge, Text } from "@repo/ui/components/ui";
import { AdmissionFormData } from "../../types";

interface AllergiesCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function AllergiesCard({
  formData,
  updateFormData,
}: AllergiesCardProps) {
  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      <div className="pb-4 border-b border-slate-200/80 flex flex-row items-center justify-between gap-4">
        <div>
          <Text as="h3" size="md" weight="bold">
            Allergies &amp; Adverse Reactions
          </Text>
          <Text size="md" weight="regular" variant="subdued">
            Key dietary and medication sensitivities.
          </Text>
        </div>
        <Badge state="warning" className="font-semibold px-2.5 py-1 rounded-full">
          Feeds MAR &amp; Kitchen
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Medication Allergies</Label>
          <Input
            type="text"
            placeholder="e.g. Penicillin, Codeine"
            value={formData.medicationAllergies.join(", ")}
            onChange={(e) =>
              updateFormData({
                medicationAllergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Food Allergies</Label>
          <Input
            type="text"
            placeholder="e.g. Peanuts, Shellfish, Gluten"
            value={formData.foodAllergies.join(", ")}
            onChange={(e) =>
              updateFormData({
                foodAllergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Environmental / Other</Label>
          <Input
            type="text"
            placeholder="e.g. Latex, Pollen, Dust"
            value={formData.environmentalAllergies.join(", ")}
            onChange={(e) =>
              updateFormData({
                environmentalAllergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
