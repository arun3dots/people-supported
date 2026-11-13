"use client";

import React from "react";
import { Check } from "lucide-react";
import { Label, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { PropertyItem } from "../../../../../../../lib/types/facility";

interface AddSchemeAssociationsSectionProps {
  properties: PropertyItem[];
  selectedPropertyIds: string[];
  onToggleProperty: (id: string) => void;
}

export function AddSchemeAssociationsSection({
  properties,
  selectedPropertyIds,
  onToggleProperty,
}: AddSchemeAssociationsSectionProps) {
  return (
    <div className="space-y-2 pt-2 border-t border-slate-100">
      <Label className="text-md font-medium text-slate-700">
        Properties in Scheme ({selectedPropertyIds.length} selected)
      </Label>
      {properties.length === 0 ? (
        <Text size="md" variant="muted">
          No properties registered yet. You can link properties after creating
          them.
        </Text>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
          {properties.map((p) => {
            const checked = selectedPropertyIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggleProperty(p.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-md font-medium border transition-all cursor-pointer",
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
  );
}
