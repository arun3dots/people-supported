"use client";

import { FileText, Pencil, Trash2 } from "lucide-react";
import type { PreAdmissionPartBDTO } from "@repo/schema";
import { Badge, Button } from "@repo/ui/components/ui";
import { DocumentUploadField } from "../../components/common/DocumentUploadField";
import { CardRepeatableSection } from "../shared/CardRepeatableSection";
import { FieldGrid, PartCard } from "../shared/PartCard";
import { TextField } from "../shared/fields";

type Other = PreAdmissionPartBDTO["otherLegalAuthority"][number];

const doc = (name: string, gcsPath: string) => (gcsPath ? { name, gcsPath } : null);

interface PartBLegalAuthoritySectionProps {
  items: Other[];
  onChange: (items: Other[]) => void;
}

export function PartBLegalAuthoritySection({
  items,
  onChange,
}: PartBLegalAuthoritySectionProps) {
  return (
    <PartCard
      title="B · Other legal authority"
      description="Deputyship, guardianship or court orders."
    >
      <CardRepeatableSection<Other>
        items={items}
        onChange={onChange}
        newItem={() => ({ type: "", holderName: "" })}
        addLabel="Add legal authority"
        emptyTitle="No other legal authority recorded"
        emptyDescription="Add deputyship, guardianship, or other court authority if applicable."
        icon={FileText}
        isItemBlank={(o) => !o.holderName?.trim() && !o.type?.trim()}
        renderCard={(o, onEdit, onDelete) => (
          <div className="p-4 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <FileText className="size-4" />
                </div>
                <p className="text-md font-bold text-slate-800 truncate">{o.holderName}</p>
                {o.type && (
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-sm bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                    {o.type}
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
                  title="Edit authority"
                  aria-label="Edit authority"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete authority"
                  aria-label="Delete authority"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {o.document?.gcsPath && (
              <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <FileText className="size-4 text-purple-700 shrink-0" />
                <span className="font-semibold text-slate-700">Document:</span>
                <span className="text-slate-600 truncate">{o.document.name || "Order copy"}</span>
              </div>
            )}
          </div>
        )}
        renderForm={(o, update, onSave, onCancel, isNew) => (
          <div className="space-y-3">
            <FieldGrid>
              <TextField
                label="Type"
                placeholder="e.g. Deputyship"
                required
                value={o.type}
                errorMessage={!o.type?.trim() ? "Type is required" : undefined}
                onChange={(v) => update({ type: v })}
              />
              <TextField
                label="Holder name"
                required
                value={o.holderName}
                errorMessage={!o.holderName?.trim() ? "Holder name is required" : undefined}
                onChange={(v) => update({ holderName: v })}
              />
            </FieldGrid>
            <DocumentUploadField
              label="Document"
              value={o.document?.gcsPath ?? ""}
              onChange={(url) => update({ document: doc(o.type || "Legal authority", url) })}
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
              <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="rounded-xl font-medium text-sm">
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={!o.holderName?.trim() || !o.type?.trim()}
                className="rounded-xl font-semibold text-sm shadow-none"
              >
                {isNew ? "Add authority" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      />
    </PartCard>
  );
}

