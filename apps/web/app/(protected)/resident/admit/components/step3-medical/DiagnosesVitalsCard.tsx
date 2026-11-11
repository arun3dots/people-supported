"use client";

import React, { useEffect } from "react";
import { Input, Label, Text } from "@repo/ui/components/ui";
import { AdmissionFormData } from "../../types";

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface DiagnosesVitalsCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function DiagnosesVitalsCard({
  formData,
  updateFormData,
}: DiagnosesVitalsCardProps) {
  useEffect(() => {
    if (formData.heightCm && formData.weightKg && formData.heightCm > 0) {
      const heightM = formData.heightCm / 100;
      const bmiCalc = Number((formData.weightKg / (heightM * heightM)).toFixed(1));
      if (formData.bmi !== bmiCalc) {
        updateFormData({ bmi: bmiCalc });
      }
    }
  }, [formData.heightCm, formData.weightKg, formData.bmi, updateFormData]);

  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      <div className="pb-4 border-b border-slate-200/80">
        <Text as="h3" size="md" weight="bold">
          Admission Diagnoses &amp; Baseline Vitals
        </Text>
        <Text size="md" weight="regular" variant="subdued">
          Primary clinical reason for admission, height/weight metrics, and vital signs.
        </Text>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>Primary Admission Diagnosis (Optional)</Label>
            <Input
              type="text"
              placeholder="e.g. Vascular Dementia, Post-Hip Rehab"
              value={formData.primaryDiagnosis}
              onChange={(e) => updateFormData({ primaryDiagnosis: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>Secondary Diagnoses (comma-separated)</Label>
            <Input
              type="text"
              placeholder="e.g. Hypertension, Osteoarthritis"
              value={formData.secondaryDiagnoses.join(", ")}
              onChange={(e) =>
                updateFormData({
                  secondaryDiagnoses: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>
        </div>

        {/* Height, Weight, BMI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80">
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>Height (cm)</Label>
            <Input
              type="number"
              placeholder="e.g. 165"
              value={formData.heightCm || ""}
              onChange={(e) => updateFormData({ heightCm: parseFloat(e.target.value) || undefined })}
            />
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              placeholder="e.g. 62.5"
              value={formData.weightKg || ""}
              onChange={(e) => updateFormData({ weightKg: parseFloat(e.target.value) || undefined })}
            />
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>BMI (Auto-calculated)</Label>
            <Input
              readOnly
              placeholder="Enter height & weight"
              value={formData.bmi ? `${formData.bmi} kg/m²` : ""}
            />
          </div>
        </div>

        {/* Baseline Vitals */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80">
          <Text as="h3" size="md" weight="semibold" className="text-slate-800">
            Baseline Vitals on Admission
          </Text>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>BP (sys/dia)</Label>
              <Input
                type="text"
                placeholder="120/80"
                value={formData.baselineVitals?.bp || ""}
                onChange={(e) =>
                  updateFormData({
                    baselineVitals: { ...formData.baselineVitals, bp: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Pulse (bpm)</Label>
              <Input
                type="number"
                step="1"
                placeholder="72"
                value={formData.baselineVitals?.pulse || ""}
                onChange={(e) =>
                  updateFormData({
                    baselineVitals: {
                      ...formData.baselineVitals,
                      pulse: parseOptionalNumber(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Temp (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="36.8"
                value={formData.baselineVitals?.temp || ""}
                onChange={(e) =>
                  updateFormData({
                    baselineVitals: {
                      ...formData.baselineVitals,
                      temp: parseOptionalNumber(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>Resp Rate (/min)</Label>
              <Input
                type="number"
                step="1"
                placeholder="16"
                value={formData.baselineVitals?.respiratoryRate || ""}
                onChange={(e) =>
                  updateFormData({
                    baselineVitals: {
                      ...formData.baselineVitals,
                      respiratoryRate: parseOptionalNumber(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label>SpO2 (%)</Label>
              <Input
                type="number"
                step="1"
                placeholder="98"
                value={formData.baselineVitals?.spO2 || ""}
                onChange={(e) =>
                  updateFormData({
                    baselineVitals: {
                      ...formData.baselineVitals,
                      spO2: parseOptionalNumber(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
