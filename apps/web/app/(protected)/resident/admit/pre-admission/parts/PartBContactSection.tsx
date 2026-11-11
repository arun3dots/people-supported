"use client";

import { Clock, Mail, Pencil, Phone, Trash2, User } from "lucide-react";
import type { PreAdmissionPartBDTO } from "@repo/schema";
import { Badge, Button } from "@repo/ui/components/ui";
import { CardRepeatableSection } from "../shared/CardRepeatableSection";
import { FieldGrid, PartCard } from "../shared/PartCard";
import { TextField } from "../shared/fields";

type Contact = PreAdmissionPartBDTO["nextOfKin"][number];

interface PartBContactSectionProps {
  items: Contact[];
  onChange: (items: Contact[]) => void;
  errorMessage?: string;
}

export function PartBContactSection({
  items,
  onChange,
  errorMessage,
}: PartBContactSectionProps) {
  return (
    <PartCard
      title="B · Next of kin"
      description="Who to call, and when. Add as many people as needed."
    >
      <CardRepeatableSection<Contact>
        items={items}
        onChange={onChange}
        newItem={() => ({ name: "" })}
        addLabel="Add next of kin"
        emptyTitle="No next of kin recorded"
        emptyDescription="Record at least one primary family contact or representative."
        icon={User}
        errorMessage={errorMessage}
        isItemBlank={(c) => !c.name?.trim() && !c.phone?.trim() && !c.email?.trim()}
        renderCard={(c, onEdit, onDelete) => (
          <div className="p-4 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center shrink-0">
                  <User className="size-4" />
                </div>
                <p className="text-md font-bold text-slate-800 truncate">{c.name}</p>
                {c.relationship && (
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-md bg-slate-100 text-slate-700 font-medium">
                    {c.relationship}
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
                  title="Edit contact"
                  aria-label="Edit contact"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="size-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete contact"
                  aria-label="Delete contact"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {(c.phone || c.email) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-md text-slate-600 pt-1 border-t border-slate-100">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{c.email}</span>
                  </div>
                )}
              </div>
            )}

            {c.availabilityNote && (
              <div className="flex items-start gap-2 text-md text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <Clock className="size-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700">When to call: </span>
                  <span>{c.availabilityNote}</span>
                </div>
              </div>
            )}
          </div>
        )}
        renderForm={(c, update, onSave, onCancel, isNew) => (
          <div className="space-y-3">
            <FieldGrid>
              <TextField
                label="Name"
                required
                value={c.name}
                errorMessage={!c.name?.trim() ? "Name is required" : undefined}
                onChange={(v) => update({ name: v })}
              />
              <TextField
                label="Relationship"
                placeholder="e.g. Daughter"
                value={c.relationship}
                onChange={(v) => update({ relationship: v })}
              />
              <TextField
                label="Phone"
                type="tel"
                value={c.phone}
                onChange={(v) => update({ phone: v })}
              />
              <TextField
                label="Email"
                type="email"
                value={c.email}
                onChange={(v) => update({ email: v })}
              />
              <TextField
                label="When to call"
                placeholder="e.g. Call any time, including nights"
                className="sm:col-span-2"
                value={c.availabilityNote}
                onChange={(v) => update({ availabilityNote: v })}
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
                disabled={!c.name?.trim()}
                className="rounded-xl font-semibold text-md shadow-none"
              >
                {isNew ? "Save" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      />
    </PartCard>
  );
}
