"use client";

import React from "react";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { AdmissionFormData } from "../../types";

interface CognitiveNutritionCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function CognitiveNutritionCard({
  formData,
  updateFormData,
}: CognitiveNutritionCardProps) {
  const [userSelectedTexture, setUserSelectedTexture] = React.useState(false);

  const cognitiveScoreValue =
    formData.cognitiveScore === "28/30 (Mild/Normal)" ||
    formData.cognitiveScore === "Intact (0-2 Errors)"
      ? ""
      : (formData.cognitiveScore || "");
  const orientationValue =
    formData.orientation === "Alert & Oriented x3" ||
    formData.orientation === "Fully Oriented (x4)"
      ? ""
      : (formData.orientation || "");
  const communicationValue =
    formData.communicationAbility === "Verbal" ||
    formData.communicationAbility === "Clear & Fluent"
      ? ""
      : (formData.communicationAbility || "");
  const sleepPatternValue =
    formData.sleepPattern === "Normal (7-8 hours)" ||
    formData.sleepPattern === "Normal (6-8 hrs)"
      ? ""
      : (formData.sleepPattern || "");
  const dietTypeValue =
    formData.dietType === "Regular" ? "" : (formData.dietType || "");
  const textureValue =
    !userSelectedTexture &&
    (formData.textureModification === "Normal" ||
      formData.textureModification === "Regular / Unmodified")
      ? ""
      : (formData.textureModification || "");
  const feedingValue =
    formData.feedingAssistanceNeed === "None" ||
    formData.feedingAssistanceNeed === "Independent"
      ? ""
      : (formData.feedingAssistanceNeed || "");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
      {/* Cognitive */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-5 shadow-none border-none">
        <div className="pb-3 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Cognitive &amp; Communication
          </Text>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Cognitive Score (MMSE)</Label>
              <Input
                type="text"
                placeholder="e.g. 28/30 (Mild/Normal)"
                value={cognitiveScoreValue}
                onChange={(e) => updateFormData({ cognitiveScore: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Orientation</Label>
              <Input
                type="text"
                placeholder="e.g. Alert & Oriented x3"
                value={orientationValue}
                onChange={(e) => updateFormData({ orientation: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Communication Ability</Label>
              <Input
                type="text"
                placeholder="e.g. Verbal"
                value={communicationValue}
                onChange={(e) => updateFormData({ communicationAbility: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Sleep Pattern</Label>
              <Input
                type="text"
                placeholder="e.g. Normal (7-8 hours)"
                value={sleepPatternValue}
                onChange={(e) => updateFormData({ sleepPattern: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-5 shadow-none border-none">
        <div className="pb-3 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Diet &amp; Nutrition Requirements
          </Text>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Diet Type</Label>
              <Input
                type="text"
                placeholder="e.g. Regular, Diabetic"
                value={dietTypeValue}
                onChange={(e) => updateFormData({ dietType: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Texture Modification</Label>
              <Select
                value={textureValue}
                onValueChange={(val) => {
                  setUserSelectedTexture(true);
                  updateFormData({ textureModification: val });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Soft & Bite-sized">Soft &amp; Bite-sized</SelectItem>
                  <SelectItem value="Minced & Moist">Minced &amp; Moist</SelectItem>
                  <SelectItem value="Pureed">Pureed</SelectItem>
                  <SelectItem value="Thickened Fluids">Thickened Fluids</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>Feeding Assistance Need</Label>
            <Input
              type="text"
              placeholder="e.g. None, Needs food cut"
              value={feedingValue}
              onChange={(e) => updateFormData({ feedingAssistanceNeed: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
