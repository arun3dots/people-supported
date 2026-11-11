"use client";

import React from "react";
import { Button, Text } from "@repo/ui/components/ui";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { PreAdmissionAdlChecklistDTO } from "@repo/schema";
import type { AdmissionFormData } from "../../types";
import { KatzMatrixCard } from "./KatzMatrixCard";
import { MobilityFallRiskCard } from "./MobilityFallRiskCard";
import { CognitiveNutritionCard } from "./CognitiveNutritionCard";
import { PsychosocialPreferencesCard } from "./PsychosocialPreferencesCard";

interface Step4ADLProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  adlChecklist: PreAdmissionAdlChecklistDTO;
  updateAdlChecklist: (data: PreAdmissionAdlChecklistDTO) => void;
  onPrev: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
  showNavigation?: boolean;
}

export function Step4ADL({
  formData,
  updateFormData,
  adlChecklist,
  updateAdlChecklist,
  onPrev,
  onNext,
  isSubmitting,
  showNavigation = true,
}: Step4ADLProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* 1. Katz ADL Independence Scale Matrix */}
      <KatzMatrixCard value={adlChecklist} onChange={updateAdlChecklist} />

      {/* 2. Mobility & Fall Risk */}
      {/* <MobilityFallRiskCard formData={formData} updateFormData={updateFormData} /> */}

      {/* 3. Cognitive & Diet */}
      {/* <CognitiveNutritionCard formData={formData} updateFormData={updateFormData} /> */}

      {/* 4. Psychosocial Preferences */}
      {/* <PsychosocialPreferencesCard formData={formData} updateFormData={updateFormData} /> */}

      {showNavigation && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            type="button"
            onClick={onPrev}
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onNext}
            disabled={isSubmitting}
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
