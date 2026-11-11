"use client";

import React from "react";
import { Check } from "lucide-react";
import { Card, Label, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { PropertyItem } from "../../../../../../../lib/types/facility";

interface PersonOption {
  id: string;
  fullName: string;
}

interface AddSchemeAssociationsSectionProps {
  properties: PropertyItem[];
  selectedPropertyIds: string[];
  onToggleProperty: (id: string) => void;
  staffList: PersonOption[];
  selectedStaffIds: string[];
  onToggleStaff: (id: string) => void;
  residentsList: PersonOption[];
  selectedResidentIds: string[];
  onToggleResident: (id: string) => void;
}

function EntityChipPicker({
  label,
  items,
  selectedIds,
  onToggle,
}: {
  label: string;
  items: PersonOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-md font-medium text-slate-700">
        {label} ({selectedIds.length})
      </Label>
      <Card
        variant="surface"
        border="secondary"
        className="flex-row flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 rounded-xl"
      >
        {items.slice(0, 20).map((item) => {
          const checked = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-sm font-medium border transition-all cursor-pointer",
                checked
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100",
              )}
            >
              {item.fullName}
            </button>
          );
        })}
      </Card>
    </div>
  );
}

export function AddSchemeAssociationsSection({
  properties,
  selectedPropertyIds,
  onToggleProperty,
  staffList,
  selectedStaffIds,
  onToggleStaff,
  residentsList,
  selectedResidentIds,
  onToggleResident,
}: AddSchemeAssociationsSectionProps) {
  return (
    <>
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <Label className="text-md font-medium text-slate-700">
          Properties in Scheme ({selectedPropertyIds.length} selected)
        </Label>
        {properties.length === 0 ? (
          <Text size="sm" variant="muted">
            No properties registered yet. You can link properties after creating
            them.
          </Text>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
            {properties.map((p) => {
              const checked = selectedPropertyIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggleProperty(p.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all cursor-pointer",
                    checked
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface-card-grey text-slate-700 border-slate-200 hover:bg-slate-100",
                  )}
                >
                  {checked && <Check className="size-3" />}
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <EntityChipPicker
          label="Staffs"
          items={staffList}
          selectedIds={selectedStaffIds}
          onToggle={onToggleStaff}
        />
        <EntityChipPicker
          label="Supported People"
          items={residentsList}
          selectedIds={selectedResidentIds}
          onToggle={onToggleResident}
        />
      </div>
    </>
  );
}
