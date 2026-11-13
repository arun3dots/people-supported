"use client";

import type { PreAdmissionPartCDTO } from "@repo/schema";
import { FieldGrid, PartCard } from "../shared/PartCard";
import {
  ListField,
  TextAreaField,
  TextField,
} from "../shared/fields";

interface VitalConfig {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "number";
  step?: string;
  min?: number;
  max?: number;
}

const VITALS_CONFIG: VitalConfig[] = [
  { key: "bp", label: "Blood pressure (mmHg)", placeholder: "e.g. 120/80", type: "text" },
  { key: "pulse", label: "Pulse / Heart rate (bpm)", placeholder: "e.g. 72", type: "number", min: 20, max: 250 },
  { key: "temp", label: "Temperature (°C)", placeholder: "e.g. 36.6", type: "number", step: "0.1", min: 30, max: 45 },
  { key: "respiratoryRate", label: "Respiratory rate (breaths/min)", placeholder: "e.g. 16", type: "number", min: 4, max: 60 },
  { key: "spO2", label: "Oxygen saturation (SpO2 %)", placeholder: "e.g. 98", type: "number", min: 50, max: 100 },
];

interface PartCHealthSectionProps {
  value: PreAdmissionPartCDTO;
  onChange: (patch: Partial<PreAdmissionPartCDTO>) => void;
  errors?: Record<string, string>;
}

export function PartCHealthSection({
  value,
  onChange,
  errors,
}: PartCHealthSectionProps) {
  const pain = value.pain;
  const vitals = value.baselineVitals ?? {};
  const num = (v: string) => (v ? Number(v) : null);

  const primaryDiagnosis =
    value.primaryDiagnosis ?? (value.diagnoses?.[0] ?? "");
  const secondaryDiagnoses =
    value.secondaryDiagnoses ??
    (value.diagnoses && value.diagnoses.length > 1
      ? value.diagnoses.slice(1)
      : []);

  return (
    <PartCard title=" Health and medical history">
      {(errors?.primaryDiagnosis || errors?.diagnoses) && (
        <p className="text-md font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
          {errors.primaryDiagnosis || errors.diagnoses}
        </p>
      )}
      <FieldGrid cols={2}>
        <TextField
          label="Primary Need"
          required
          placeholder="e.g. Alzheimer’s disease (moderate)"
          value={primaryDiagnosis}
          errorMessage={errors?.primaryDiagnosis}
          onChange={(primary) => {
            const combined = [primary, ...secondaryDiagnoses]
              .map((s) => s.trim())
              .filter(Boolean);
            onChange({
              primaryDiagnosis: primary,
              diagnoses: combined,
            });
          }}
        />
        <ListField
          label="Secondary Need"
          placeholder="e.g. Type 2 diabetes, Hypertension"
          value={secondaryDiagnoses}
          onChange={(secondaries) => {
            const combined = [primaryDiagnosis, ...secondaries]
              .map((s) => s.trim())
              .filter(Boolean);
            onChange({
              secondaryDiagnoses: secondaries,
              diagnoses: combined,
            });
          }}
        />
      </FieldGrid>
      <TextAreaField
        label="Medical history"
        placeholder="Details of past medical conditions, ongoing illnesses, and health background..."
        value={value.medicalHistory ?? ""}
        onChange={(medicalHistory) => onChange({ medicalHistory })}
      />
      <FieldGrid cols={3}>
        <TextField
          label="Height (cm)"
          type="number"
          min={30}
          max={250}
          placeholder="e.g. 170"
          value={value.heightCm?.toString()}
          onChange={(v) => onChange({ heightCm: num(v) })}
        />
        <TextField
          label="Weight (kg)"
          type="number"
          step="0.1"
          min={10}
          max={300}
          placeholder="e.g. 68.5"
          value={value.weightKg?.toString()}
          onChange={(v) => onChange({ weightKg: num(v) })}
        />
        <TextField
          label="BMI (kg/m²)"
          type="text"
          placeholder="Calculated automatically"
          value={
            value.heightCm && value.weightKg && value.heightCm > 0
              ? `${(value.weightKg / Math.pow(value.heightCm / 100, 2)).toFixed(1)} kg/m²`
              : ""
          }
          onChange={() => {}}
          className="pointer-events-none opacity-90"
        />
        {VITALS_CONFIG.map((cfg) => (
          <TextField
            key={cfg.key}
            label={cfg.label}
            placeholder={cfg.placeholder}
            type={cfg.type}
            step={cfg.step}
            min={cfg.min}
            max={cfg.max}
            value={vitals[cfg.key]}
            onChange={(v) =>
              onChange({ baselineVitals: { ...vitals, [cfg.key]: v } })
            }
          />
        ))}
      </FieldGrid>
      <FieldGrid cols={3}>
        <TextField
          label="Pain (where and when)"
          placeholder="e.g. Right hip on walking"
          value={pain?.summary}
          onChange={(v) => onChange({ pain: { ...pain, summary: v } })}
        />
        <TextField
          label="Pain tool used"
          placeholder="e.g. Abbey Pain Scale"
          value={pain?.tool}
          onChange={(v) => onChange({ pain: { ...pain, tool: v } })}
        />
        <TextField
          label="Pain score (0–10)"
          type="number"
          min={0}
          max={10}
          placeholder="e.g. 3"
          value={pain?.score?.toString()}
          onChange={(v) => onChange({ pain: { ...pain, score: num(v) } })}
        />
      </FieldGrid>
      <FieldGrid cols={2}>
        <TextField
          label="Recent hospital stays"
          placeholder="e.g. Bristol Royal Infirmary (Jan 2024, treated for chest infection)"
          value={value.recentHospitalisations}
          onChange={(v) => onChange({ recentHospitalisations: v })}
        />
        <TextField
          label="Surgeries"
          placeholder="e.g. Hip replacement (2018), Cataract surgery (2021)"
          value={value.surgeries}
          onChange={(v) => onChange({ surgeries: v })}
        />
      </FieldGrid>
      <TextAreaField
        label="Immunisations"
        placeholder="e.g. COVID-19 booster (Nov 2023), Annual influenza (Oct 2023), Pneumococcal vaccine"
        value={value.immunisations}
        onChange={(v) => onChange({ immunisations: v })}
      />
    </PartCard>
  );
}

