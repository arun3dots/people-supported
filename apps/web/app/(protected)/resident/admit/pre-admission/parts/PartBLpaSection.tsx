"use client";

import { Calendar, FileText, Pencil, Phone, Scale, Trash2 } from "lucide-react";
import type { PreAdmissionPartBDTO } from "@repo/schema";
import { LPA_TYPES } from "@repo/schema";
import { Badge, Button } from "@repo/ui/components/ui";
import { DocumentUploadField } from "../../components/common/DocumentUploadField";
import { CardRepeatableSection } from "../shared/CardRepeatableSection";
import { FieldGrid, PartCard } from "../shared/PartCard";
import { CheckField, SelectField, TextField } from "../shared/fields";

type Lpa = PreAdmissionPartBDTO["lpa"][number];

const doc = (name: string, gcsPath: string) => (gcsPath ? { name, gcsPath } : null);
const currentYear = new Date().getFullYear();
const REGISTERED_YEARS = Array.from(
  { length: currentYear - 1900 + 1 },
  (_, index) => String(currentYear - index),
);

interface PartBLpaSectionProps {
  items: Lpa[];
  onChange: (items: Lpa[]) => void;
}

export function PartBLpaSection({ items, onChange }: PartBLpaSectionProps) {
  return (
    <PartCard
      title="B · Lasting Power of Attorney"
      description="Health & Welfare and Property & Finance are separate registrations."
    >
      <CardRepeatableSection<Lpa>
        items={items}
        onChange={onChange}
        newItem={() => ({
          type: "" as unknown as Lpa["type"],
          holderName: "",
          copySeen: false,
        })}
        addLabel="Add LPA"
        emptyTitle="No LPA recorded"
        emptyDescription="Record attorney details for Health & Welfare or Property & Finance."
        icon={Scale}
        isItemBlank={(l) => !l.holderName?.trim() && !l.type}
        renderCard={(l, onEdit, onDelete) => (
          <div className="p-4 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center shrink-0">
                  <Scale className="size-4" />
                </div>
                <p className="text-md font-bold text-slate-800 truncate">{l.holderName}</p>
                <Badge variant="secondary" className="px-2.5 py-0.5 text-md bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                  {l.type}
                </Badge>
                {l.copySeen ? (
                  <Badge variant="secondary" className="px-2 py-0.5 text-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    Copy seen
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="px-2 py-0.5 text-md bg-slate-100 text-slate-600 font-medium">
                    Copy not seen
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
                  title="Edit LPA"
                  aria-label="Edit LPA"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete LPA"
                  aria-label="Delete LPA"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {(l.holderPhone || l.registeredYear) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-md text-slate-600 pt-1 border-t border-slate-100">
                {l.holderPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{l.holderPhone}</span>
                  </div>
                )}
                {l.registeredYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">Registered {l.registeredYear}</span>
                  </div>
                )}
              </div>
            )}

            {l.document?.gcsPath && (
              <div className="flex items-center gap-2 text-md text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <FileText className="size-4 text-emerald-700 shrink-0" />
                <span className="font-semibold text-slate-700">Attached copy:</span>
                <span className="text-slate-600 truncate">{l.document.name || "LPA document"}</span>
              </div>
            )}
          </div>
        )}
        renderForm={(l, update, onSave, onCancel, isNew) => (
          <div className="space-y-3">
            <FieldGrid cols={3}>
              <SelectField
                label="Type"
                required
                placeholder="Select type"
                options={LPA_TYPES}
                value={l.type || ""}
                onChange={(v) => update({ type: v as Lpa["type"] })}
              />
              <TextField
                label="Attorney name"
                required
                value={l.holderName}
                errorMessage={!l.holderName?.trim() ? "Attorney name is required" : undefined}
                onChange={(v) => update({ holderName: v })}
              />
              <TextField
                label="Attorney phone"
                type="tel"
                value={l.holderPhone}
                onChange={(v) => update({ holderPhone: v })}
              />
              <SelectField
                label="Registered (year)"
                options={REGISTERED_YEARS}
                placeholder="Select year"
                value={l.registeredYear == null ? "" : String(l.registeredYear)}
                onChange={(v) => update({ registeredYear: v ? Number(v) : null })}
              />
              <CheckField
                label="Copy seen"
                checked={l.copySeen}
                onChange={(v) => update({ copySeen: v })}
              />
            </FieldGrid>
            <DocumentUploadField
              label="LPA copy"
              value={l.document?.gcsPath ?? ""}
              onChange={(url) => update({ document: doc(`LPA ${l.type}`, url) })}
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
              <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="rounded-xl font-medium text-md">
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={!l.holderName?.trim() || !l.type}
                className="rounded-xl font-semibold text-md shadow-none"
              >
                {isNew ? "Add LPA" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      />
    </PartCard>
  );
}
