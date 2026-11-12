"use client";

import type { PreAdmissionPartDDTO } from "@repo/schema";
import { PRE_ADMISSION_NEED_AREAS } from "@repo/schema";
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui";
import { FieldGrid, PartCard } from "../shared/PartCard";
import { ListField, SelectField, TextAreaField, TextField } from "../shared/fields";
import type { PartFormProps } from "../shared/types";

type Area = (typeof PRE_ADMISSION_NEED_AREAS)[number];

const AREA_LABELS: Record<Area, string> = {
  mobility: "Mobility",
  falls: "Falls",
  eating: "Eating",
  continence: "Continence",
  skin: "Skin",
  senses: "Senses",
};

const SUPPORT_LEVELS: Array<[string, string]> = [
  ["I", "I · Independent"],
  ["P", "P · Prompting"],
  ["1", "1 · Assistance of one"],
  ["2", "2 · Assistance of two"],
  ["F", "F · Fully dependent"],
];

const RISK_LEVELS = ["Low", "Medium", "High"] as const;
const IDDSI = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;

export function PartDForm({ value, onChange }: PartFormProps<PreAdmissionPartDDTO>) {
  const setArea = (area: Area, patch: { summary?: string; supportLevel?: string | null }) =>
    onChange({
      areas: {
        ...value.areas,
        [area]: { ...value.areas[area], ...patch },
      } as PreAdmissionPartDDTO["areas"],
    });

  return (
    <div className="space-y-6 font-sans">
      <PartCard
        title="E · Care needs and risks"
        description="Each area becomes its own care plan. Support level: I independent · P prompting · 1 assistance of one · 2 assistance of two · F fully dependent."
      >
        <div className="space-y-4">
          {PRE_ADMISSION_NEED_AREAS.map((area) => {
            const a = value.areas[area];
            return (
              <div key={area} className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-x-4 gap-y-1.5">
                <TextField
                  label={AREA_LABELS[area]}
                  value={a?.summary}
                  onChange={(v) => setArea(area, { summary: v })}
                />
                <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
                  <Label>Support level</Label>
                  <Select
                    value={a?.supportLevel ?? ""}
                    onValueChange={(v) => setArea(area, { supportLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_LEVELS.map(([code, label]) => (
                        <SelectItem key={code} value={code}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </PartCard>

      <PartCard title="Falls, diet and cognition">
        <FieldGrid cols={3}>
          <SelectField label="Falls risk" options={RISK_LEVELS} value={value.fallsRiskLevel} onChange={(v) => onChange({ fallsRiskLevel: v as PreAdmissionPartDDTO["fallsRiskLevel"] })} />
          <TextField label="Falls in last 6 months" type="number" value={value.fallsLast6Months?.toString()} onChange={(v) => onChange({ fallsLast6Months: v ? Number(v) : null })} />
          <ListField label="Mobility aids" placeholder="e.g. Zimmer frame" value={value.mobilityAids} onChange={(mobilityAids) => onChange({ mobilityAids })} />
          <SelectField label="IDDSI food level" options={IDDSI} value={value.iddsiLevel} onChange={(v) => onChange({ iddsiLevel: v })} />
          <TextField label="Drinks" placeholder="e.g. Thin drinks" value={value.fluidConsistency} onChange={(v) => onChange({ fluidConsistency: v })} />
          <TextField label="Diet type" placeholder="e.g. Diabetic" value={value.dietType} onChange={(v) => onChange({ dietType: v })} />
        </FieldGrid>
        <TextAreaField label="Swallowing concerns" value={value.swallowingConcerns} onChange={(v) => onChange({ swallowingConcerns: v })} />
        <FieldGrid>
          <TextAreaField label="Memory and cognition" value={value.cognition} onChange={(v) => onChange({ cognition: v })} />
          <TextAreaField label="Behaviour or distress" value={value.behaviouralConcerns} onChange={(v) => onChange({ behaviouralConcerns: v })} />
        </FieldGrid>
      </PartCard>
    </div>
  );
}
