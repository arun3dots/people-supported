"use client";

import React from "react";
import { Bed as BedIcon, BedDouble, HelpCircle, Activity } from "lucide-react";
import { Text } from "@repo/ui/components/ui/Text";
import { Input } from "@repo/ui/components/ui/Input";
import { Label } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export const BED_TYPES = [
  {
    id: "Standard Bed",
    label: "Standard Bed",
    subtext: "General Purpose bed",
    icon: BedIcon,
  },
  {
    id: "Profiling Bed",
    label: "Profiling Bed",
    subtext: "Adjustable Bed",
    icon: BedDouble,
  },
  {
    id: "Low Bed",
    label: "Low Bed",
    subtext: "Low Height Bed",
    icon: Activity,
  },
  {
    id: "Other",
    label: "Other",
    subtext: "Custom Bed type",
    icon: HelpCircle,
  },
];

interface BedTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  errorMessage?: string;
}

export function BedTypeSelector({ value, onChange, errorMessage }: BedTypeSelectorProps) {
  const isKnownType = ["Standard Bed", "Profiling Bed", "Low Bed"].includes(value);
  const isOtherSelected = value === "Other" || (!isKnownType && Boolean(value));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BED_TYPES.map((type) => {
          const isSelected =
            type.id === "Other" ? isOtherSelected : value === type.id;
          const IconComponent = type.icon;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={cn(
                "flex items-center px-4 py-3 gap-3 min-h-20 rounded-xl border text-left cursor-pointer transition-all",
                isSelected
                  ? "bg-emerald-50/80 border-emerald-600 ring-1 ring-emerald-600 shadow-sm"
                  : "bg-white border-slate-200 hover:border-emerald-300"
              )}
            >
              <div
                className={cn(
                  "size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isSelected
                    ? "bg-emerald-800 text-white"
                    : "bg-surface-primary-light text-icon-primary"
                )}
              >
                <IconComponent className="size-4" />
              </div>

              <div className="flex flex-col min-w-0">
                <Text size="md" weight="semibold" className="text-slate-900 leading-snug">
                  {type.label}
                </Text>
                <Text size="sm" weight="regular" className="text-slate-500 leading-snug mt-0.5">
                  {type.subtext}
                </Text>
              </div>
            </button>
          );
        })}
      </div>

      {isOtherSelected && (
        <div className="space-y-1.5 pt-1">
          <Label required htmlFor="customBedType">
            Custom Bed Type
          </Label>
          <Input
            id="customBedType"
            placeholder="e.g. Bariatric Bed, Air Mattress Bed"
            value={value === "Other" ? "" : value}
            onChange={(e) => onChange(e.target.value.trim() ? e.target.value : "Other")}
            errorMessage={errorMessage}
          />
        </div>
      )}
    </div>
  );
}
