"use client";

import React from "react";
import { Stethoscope, Activity } from "lucide-react";
import { Card, Text, Badge, InfoField } from "@repo/ui/components/ui";

interface OverviewMedicalCardProps {
  resident: any;
}

export function OverviewMedicalCard({ resident }: OverviewMedicalCardProps) {
  const care = resident.careProfile || {};
  const baselineVitals = care.baselineVitals || {};

  const medAllergies = Array.isArray(care.medicationAllergies) ? care.medicationAllergies : [];
  const foodAllergies = Array.isArray(care.foodAllergies) ? care.foodAllergies : [];
  const envAllergies = Array.isArray(care.environmentalAllergies) ? care.environmentalAllergies : [];
  const chronicConditions = Array.isArray(care.chronicConditions) ? care.chronicConditions : [];
  const sensoryAids = Array.isArray(care.sensoryAids) ? care.sensoryAids : (care.sensoryAids ? [care.sensoryAids] : []);

  const hasVitals = Boolean(care.heightCm || care.weightKg || care.bmi || baselineVitals.bp || baselineVitals.pulse || baselineVitals.temp);

  return (
    <Card className="bg-surface-card-grey border-none rounded-2xl p-6 lg:p-8 space-y-5 shadow-none font-sans">
      <div className="flex items-center justify-between border-b border-border-secondary/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-surface-primary-light border border-emerald-100 flex items-center justify-center text-icon-primary shrink-0">
            <Stethoscope className="size-4" />
          </div>
          <Text as="h3" size="base" weight="semibold" className="text-slate-900">
            Medical &amp; Clinical Profile
          </Text>
        </div>
      </div>

      {/* Diagnoses & Primary Need */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoField
          label="Primary Diagnosis"
          value={care.primaryDiagnosis || care.primaryCareNeed || "Not recorded"}
        />
        <InfoField
          label="Secondary Diagnoses"
          value={
            Array.isArray(care.secondaryDiagnoses) && care.secondaryDiagnoses.length > 0
              ? care.secondaryDiagnoses.join(", ")
              : "None recorded"
          }
        />
      </div>

      {/* Baseline Vitals & Physical Measurements */}
      {hasVitals && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-emerald-800" />
            <Text size="md" weight="bold" className="text-slate-900 tracking-wider">
              Baseline Physical Measurements &amp; Vitals
            </Text>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-md">
            {care.heightCm && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">Height</Text>
                <Text size="md" weight="bold" className="text-slate-900">{care.heightCm} cm</Text>
              </div>
            )}
            {care.weightKg && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">Weight</Text>
                <Text size="md" weight="bold" className="text-slate-900">{care.weightKg} kg</Text>
              </div>
            )}
            {care.bmi && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">BMI</Text>
                <Text size="md" weight="bold" className="text-slate-900">{care.bmi}</Text>
              </div>
            )}
            {baselineVitals.bp && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">BP</Text>
                <Text size="md" weight="bold" className="text-slate-900">{baselineVitals.bp} mmHg</Text>
              </div>
            )}
            {baselineVitals.pulse && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">Pulse</Text>
                <Text size="md" weight="bold" className="text-slate-900">{baselineVitals.pulse} bpm</Text>
              </div>
            )}
            {baselineVitals.temp && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">Temperature</Text>
                <Text size="md" weight="bold" className="text-slate-900">{baselineVitals.temp} °C</Text>
              </div>
            )}
            {baselineVitals.spO2 && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">SpO2</Text>
                <Text size="md" weight="bold" className="text-slate-900">{baselineVitals.spO2}%</Text>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Allergies Breakdown */}
      <div className="space-y-2">
        <Text size="md" weight="bold" className="text-slate-900">
          Allergies &amp; Intolerances
        </Text>
        <div className="flex flex-wrap gap-2">
          {medAllergies.map((alg: string, idx: number) => (
            <Badge key={`med-${idx}`} variant="secondary" state="danger" className="px-2.5 py-0.5 shadow-none text-md">
              Medication: {alg}
            </Badge>
          ))}
          {foodAllergies.map((alg: string, idx: number) => (
            <Badge key={`food-${idx}`} variant="secondary" state="warning" className="px-2.5 py-0.5 shadow-none text-md">
              Food: {alg}
            </Badge>
          ))}
          {envAllergies.map((alg: string, idx: number) => (
            <Badge key={`env-${idx}`} variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none text-md">
              Env: {alg}
            </Badge>
          ))}
          {medAllergies.length === 0 && foodAllergies.length === 0 && envAllergies.length === 0 && (
            <Text size="md" weight="regular" className="text-slate-500 italic">
              No known allergies recorded.
            </Text>
          )}
        </div>
      </div>

      {/* Chronic Conditions & Past Surgeries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        <InfoField
          label="Chronic Conditions"
          value={chronicConditions.length > 0 ? chronicConditions.join(", ") : "None recorded"}
        />
        <InfoField
          label="Past Surgeries / Operations"
          value={care.postSurgeries || "None recorded"}
        />
        <InfoField
          label="Skin Condition / Pressure Areas"
          value={care.skinConditionPressureAreas || "Intact / No pressure sores"}
        />
        <InfoField
          label="Continence Status"
          value={care.continenceStatus || care.continence || "Continent"}
        />
        <InfoField
          label="Sensory Aids (Glasses, Hearing)"
          value={sensoryAids.length > 0 ? sensoryAids.join(", ") : "None required"}
        />
        <InfoField
          label="Recent Hospitalization History"
          value={care.recentHospitalizations || "No recent hospitalizations"}
        />
      </div>
    </Card>
  );
}
