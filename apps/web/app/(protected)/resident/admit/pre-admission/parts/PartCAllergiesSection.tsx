"use client";

import { AlertCircle, Pencil, ShieldAlert, Trash2 } from "lucide-react";
import type { PreAdmissionPartCDTO } from "@repo/schema";
import { Badge, Button } from "@repo/ui/components/ui";
import { CardRepeatableSection } from "../shared/CardRepeatableSection";
import { FieldGrid, PartCard } from "../shared/PartCard";
import { CheckField, SelectField, TextField } from "../shared/fields";

type Allergy = PreAdmissionPartCDTO["allergies"][number];

const SEVERITIES = ["Mild", "Moderate", "Severe"] as const;

interface PartCAllergiesSectionProps {
  allergies: Allergy[];
  noKnownAllergies: boolean;
  onChange: (patch: Partial<PreAdmissionPartCDTO>) => void;
  errorMessage?: string;
}

const severityBadgeStyles: Record<string, string> = {
  Severe: "bg-red-50 text-red-700 border-red-200/80 font-bold",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200/80 font-semibold",
  Mild: "bg-slate-100 text-slate-700 border-slate-200 font-medium",
};

export function PartCAllergiesSection({
  allergies,
  noKnownAllergies,
  onChange,
  errorMessage,
}: PartCAllergiesSectionProps) {
  const hasAllergies = allergies.length > 0;

  return (
    <PartCard
      title="C · Allergies"
      description="Record all known drug, food, or environmental allergies and their reactions."
    >
      {errorMessage && (
        <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
          {errorMessage}
        </p>
      )}

      {!hasAllergies && (
        <CheckField
          label="No known allergies"
          checked={noKnownAllergies}
          onChange={(v) =>
            onChange({
              noKnownAllergies: v,
            })
          }
        />
      )}

      {!noKnownAllergies && (
        <CardRepeatableSection<Allergy>
          items={allergies}
          onChange={(items) => onChange({ allergies: items, noKnownAllergies: false })}
          newItem={() => ({ substance: "" })}
          addLabel="Add allergy"
          emptyTitle="No allergies recorded"
          emptyDescription="Record any food, drug, or environmental allergies or confirm none are known."
          icon={ShieldAlert}
          errorMessage={errorMessage}
          isItemBlank={(a) => !a.substance?.trim()}
          validateSave={(a) => Boolean(a.substance?.trim())}
          renderCard={(a, onEdit, onDelete) => (
            <div className="p-4 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-full bg-red-50 text-red-700 border border-red-200/60 flex items-center justify-center shrink-0">
                    <ShieldAlert className="size-4" />
                  </div>
                  <p className="text-md font-bold text-slate-800 truncate">
                    {a.substance}
                  </p>
                  {a.severity && (
                    <Badge
                      variant="outline"
                      className={`px-2.5 py-0.5 text-sm ${severityBadgeStyles[a.severity] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {a.severity}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="size-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                    title="Edit allergy"
                    aria-label="Edit allergy"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete allergy"
                    aria-label="Delete allergy"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {a.reaction && (
                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                  <AlertCircle className="size-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700">Reaction: </span>
                    <span className="text-slate-600">{a.reaction}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          renderForm={(a, onPatch, onSave, onCancel, isNew) => (
            <div className="p-4 bg-slate-50 border-2 border-dashed border-emerald-300 rounded-xl space-y-4">
              <p className="text-md font-bold text-slate-800">
                {isNew ? "Add new allergy" : "Edit allergy"}
              </p>

              <FieldGrid cols={3}>
                <TextField
                  label="Substance"
                  required
                  placeholder="e.g. Penicillin, Peanuts, Latex"
                  value={a.substance}
                  errorMessage={!a.substance?.trim() ? "Substance name is required" : undefined}
                  onChange={(v) => onPatch({ substance: v })}
                />
                <TextField
                  label="Reaction"
                  placeholder="e.g. Anaphylaxis, Skin rash, Swelling"
                  value={a.reaction}
                  onChange={(v) => onPatch({ reaction: v })}
                />
                <SelectField
                  label="Severity"
                  options={SEVERITIES}
                  value={a.severity}
                  onChange={(v) =>
                    onPatch({ severity: v as Allergy["severity"] })
                  }
                />
              </FieldGrid>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!a.substance?.trim()}
                  onClick={onSave}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold"
                >
                  {isNew ? "Add allergy" : "Save changes"}
                </Button>
              </div>
            </div>
          )}
        />
      )}
    </PartCard>
  );
}
