"use client";

import { Pencil, Phone, Stethoscope, Trash2 } from "lucide-react";
import type { PreAdmissionPartBDTO } from "@repo/schema";
import { Badge, Button } from "@repo/ui/components/ui";
import { CardRepeatableSection } from "../shared/CardRepeatableSection";
import { FieldGrid, PartCard } from "../shared/PartCard";
import { TextField } from "../shared/fields";

type Provider = PreAdmissionPartBDTO["otherProviders"][number];

interface PartBProfessionalsSectionProps {
  value: PreAdmissionPartBDTO;
  onChange: (patch: Partial<PreAdmissionPartBDTO>) => void;
}

export function PartBProfessionalsSection({
  value,
  onChange,
}: PartBProfessionalsSectionProps) {
  const sw = value.socialWorker;
  const gp = value.gp;

  return (
    <PartCard title="Professionals">
      <FieldGrid cols={3}>
        <TextField
          label="Social worker"
          value={sw?.name}
          onChange={(v) => onChange({ socialWorker: { ...sw, name: v } })}
        />
        <TextField
          label="Social worker organisation"
          value={sw?.organisation}
          onChange={(v) =>
            onChange({
              socialWorker: {
                ...sw,
                name: sw?.name ?? "",
                organisation: v,
              },
            })
          }
        />
        <TextField
          label="Social worker phone"
          type="tel"
          value={sw?.phone}
          onChange={(v) =>
            onChange({
              socialWorker: { ...sw, name: sw?.name ?? "", phone: v },
            })
          }
        />
        <TextField
          label="GP name"
          value={gp?.name}
          onChange={(v) => onChange({ gp: { ...gp, name: v } })}
        />
        <TextField
          label="GP practice"
          value={gp?.practice}
          onChange={(v) => onChange({ gp: { ...gp, practice: v } })}
        />
        <TextField
          label="GP phone"
          type="tel"
          value={gp?.phone}
          onChange={(v) => onChange({ gp: { ...gp, phone: v } })}
        />
      </FieldGrid>

      <div className="pt-3 border-t border-slate-200/80">
        <CardRepeatableSection<Provider>
          title="Other healthcare providers"
          description="Dentists, opticians, podiatrists, or other external specialists."
          items={value.otherProviders}
          onChange={(otherProviders) => onChange({ otherProviders })}
          newItem={() => ({ type: "", name: "" })}
          addLabel="Add provider"
          emptyTitle="No additional providers recorded"
          emptyDescription="Add any dentist, optician, or specialist clinics associated with this resident."
          icon={Stethoscope}
          isItemBlank={(p) => !p.name?.trim() && !p.type?.trim()}
          renderCard={(p, onEdit, onDelete) => (
            <div className="p-4 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center shrink-0">
                    <Stethoscope className="size-4" />
                  </div>
                  <p className="text-md font-bold text-slate-800 truncate">{p.name || "Unnamed provider"}</p>
                  {p.type && (
                    <Badge variant="secondary" className="px-2.5 py-0.5 text-md bg-teal-50 text-teal-800 border border-teal-200 font-medium">
                      {p.type}
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
                    title="Edit provider"
                    aria-label="Edit provider"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete provider"
                    aria-label="Delete provider"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {p.phone && (
                <div className="flex items-center gap-2 text-md text-slate-600 pt-1 border-t border-slate-100">
                  <Phone className="size-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700">{p.phone}</span>
                </div>
              )}
            </div>
          )}
          renderForm={(p, update, onSave, onCancel, isNew) => (
            <div className="space-y-3">
              <FieldGrid cols={3}>
                <TextField
                  label="Type"
                  placeholder="e.g. Dentist"
                  value={p.type}
                  onChange={(v) => update({ type: v })}
                />
                <TextField
                  label="Name"
                  value={p.name}
                  onChange={(v) => update({ name: v })}
                />
                <TextField
                  label="Phone"
                  type="tel"
                  value={p.phone}
                  onChange={(v) => update({ phone: v })}
                />
              </FieldGrid>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="rounded-xl font-medium text-md">
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onSave}
                  disabled={!p.name?.trim() && !p.type?.trim()}
                  className="rounded-xl font-semibold text-md shadow-none"
                >
                  {isNew ? "Add provider" : "Save changes"}
                </Button>
              </div>
            </div>
          )}
        />
      </div>
    </PartCard>
  );
}

