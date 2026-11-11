"use client";

import {
  ASSESSMENT_TOOLS,
  formatToolValue,
  normaliseToolResult,
  type AssessmentRating,
  type AssessmentToolKey,
  type AssessmentToolResultDTO,
} from "@repo/schema";
import { Input, Label, Textarea } from "@repo/ui/components/ui";
import { SelectField } from "../../admit/pre-admission/shared/fields";
import { RatingPill } from "../shared";

const MUST_OPTIONS = ["0", "1", "2"] as const;

const LABEL_OPTIONS: Partial<
  Record<AssessmentToolKey, Record<string, AssessmentRating>>
> = {
  falls: { Low: "low", Medium: "med", High: "high" },
  continence: {
    Continent: "low",
    "Urinary incontinence": "med",
    "Faecal incontinence": "med",
    "Double incontinence": "high",
  },
  abc: {
    "No distress": "low",
    "Occasional distress": "med",
    "Frequent distress": "high",
  },
  dols: {
    "Not required": "low",
    "Screen needed": "med",
    "Application made": "med",
    Authorised: "med",
  },
};

const HINTS: Partial<Record<AssessmentToolKey, string>> = {
  waterlow: "Total score. 10+ at risk, 15+ high, 20+ very high.",
  abbey: "Total score. 3+ mild, 8+ moderate, 14+ severe.",
  must: "BMI, weight loss and acute disease effect, each scored 0 to 2.",
};

export const emptyTool = (toolKey: AssessmentToolKey): AssessmentToolResultDTO => ({
  toolKey,
  score: null,
  label: null,
  rating: "none",
  answers: {},
  notes: null,
});

export const hasToolValue = (t: AssessmentToolResultDTO): boolean =>
  t.score != null ||
  Boolean(t.label) ||
  Object.keys(t.answers ?? {}).length > 0 ||
  Boolean(t.notes);

interface ToolCardProps {
  tool: AssessmentToolResultDTO;
  onChange: (next: AssessmentToolResultDTO) => void;
}

export function ToolCard({ tool, onChange }: ToolCardProps) {
  const def = ASSESSMENT_TOOLS.find((t) => t.key === tool.toolKey);
  if (!def) return null;
  const shown = normaliseToolResult(tool);
  const labelOptions = LABEL_OPTIONS[tool.toolKey];
  const answers = (tool.answers ?? {}) as Record<string, unknown>;

  const update = (patch: Partial<AssessmentToolResultDTO>) =>
    onChange({ ...tool, ...patch });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-md font-bold text-slate-800">{def.name}</p>
          {HINTS[tool.toolKey] && (
            <p className="text-sm text-slate-600">{HINTS[tool.toolKey]}</p>
          )}
        </div>
        {hasToolValue(tool) && (
          <RatingPill rating={shown.rating ?? "none"}>
            {formatToolValue(shown)}
          </RatingPill>
        )}
      </div>

      {tool.toolKey === "must" && (
        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
          {(
            [
              ["bmiScore", "BMI"],
              ["weightLossScore", "Weight loss"],
              ["acuteScore", "Acute disease"],
            ] as const
          ).map(([key, label]) => (
            <SelectField
              key={key}
              label={label}
              options={MUST_OPTIONS}
              value={answers[key] == null ? "" : String(answers[key])}
              onChange={(v) => update({ answers: { ...answers, [key]: Number(v) } })}
            />
          ))}
        </div>
      )}

      {(tool.toolKey === "waterlow" || tool.toolKey === "abbey") && (
        <div className="space-y-1.5 max-w-40">
          <Label>Score</Label>
          <Input
            type="number"
            min={0}
            value={tool.score ?? ""}
            onChange={(e) =>
              update({
                score: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>
      )}

      {labelOptions && (
        <SelectField
          label="Result"
          options={Object.keys(labelOptions)}
          value={tool.label}
          onChange={(v) =>
            update({
              label: v,
              rating: tool.toolKey === "falls" ? undefined : labelOptions[v],
            })
          }
        />
      )}

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          rows={2}
          placeholder="What the assessor observed"
          value={tool.notes ?? ""}
          onChange={(e) => onChange({ ...tool, notes: e.target.value })}
        />
      </div>
    </div>
  );
}
