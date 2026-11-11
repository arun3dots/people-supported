"use client";

import React from "react";
import { Button, Text } from "@repo/ui/components/ui";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AdmissionFormData } from "../../types";
import { DiagnosesVitalsCard } from "./DiagnosesVitalsCard";
import { AllergiesCard } from "./AllergiesCard";
import { CurrentMedicationsCard } from "./CurrentMedicationsCard";
import { ChronicConditionsCard } from "./ChronicConditionsCard";

interface Step3MedicalProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  onPrev: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
}

export function Step3Medical({
  formData,
  updateFormData,
  onPrev,
  onNext,
  isSubmitting,
}: Step3MedicalProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* 1. Diagnoses & Anthropometrics */}
      <DiagnosesVitalsCard formData={formData} updateFormData={updateFormData} />

      {/* 2. Categorized Allergies */}
      <AllergiesCard formData={formData} updateFormData={updateFormData} />

      {/* 3. Current Medications Table */}
      <CurrentMedicationsCard formData={formData} updateFormData={updateFormData} />

      {/* 4. Chronic Conditions Checklist */}
      <ChronicConditionsCard formData={formData} updateFormData={updateFormData} />

      {/* Navigation Footer */}
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
    </div>
  );
}
