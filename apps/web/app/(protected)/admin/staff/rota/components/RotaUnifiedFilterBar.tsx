"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import {
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { PropertyItem, SchemeItem } from "../../../../../../lib/types/facility";
import type { StaffMember } from "../../../../../../lib/types/staff";

export interface RotaFilterState {
  schemeId: string;
  propertyId: string;
  dayOfWeek: string;
  staffId: string;
  careType: string;
}

interface RotaUnifiedFilterBarProps {
  activeView: "rota" | "hours";
  onViewChange: (view: "rota" | "hours") => void;
  filters: RotaFilterState;
  onFilterChange: (updates: Partial<RotaFilterState>) => void;
  onResetFilters: () => void;
  schemes: SchemeItem[];
  properties: PropertyItem[];
  staff: StaffMember[];
}

const CARE_TYPE_FILTERS = [
  { id: "All Care Types", label: "All Care Types" },
  { id: "Shared Care (Core Support)", label: "Shared Care" },
  { id: "1:1 Dedicated Support", label: "1:1 Support" },
  { id: "2:1 Dedicated Support", label: "2:1 Support" },
  { id: "Sleep-in (Overnight)", label: "Sleep-in" },
  { id: "Waking Night", label: "Waking Night" },
];


export function RotaUnifiedFilterBar({
  activeView,
  onViewChange,
  filters,
  onFilterChange,
  onResetFilters,
  schemes,
  properties,
  staff,
}: RotaUnifiedFilterBarProps): React.JSX.Element {
  const filteredProperties =
    filters.schemeId === "all"
      ? properties
      : properties.filter((p) => p.schemeId === filters.schemeId);

  return (
    <Card
      variant="surface"
      border="default"
      className="p-4 space-y-3 border-none shadow-none font-sans"
    >
      {/* Row 1: View Toggle (Left) + Care Type Chips (Right) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 ">
        <div className="flex items-center gap-2">
          <Text as="span" size="md" weight="medium" className="text-slate-600 mr-1">
            View:
          </Text>
          <div className="inline-flex items-center bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onViewChange("rota")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-md font-medium transition-all cursor-pointer",
                activeView === "rota"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-700 hover:text-slate-900",
              )}
            >
              Rota
            </button>
            <button
              type="button"
              onClick={() => onViewChange("hours")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-md font-medium transition-all cursor-pointer",
                activeView === "hours"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-700 hover:text-slate-900",
              )}
            >
              Hours Summary
            </button>
            {/* <button
              type="button"
              onClick={() => onViewChange("allocation")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-md font-medium transition-all cursor-pointer",
                activeView === "allocation"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-700 hover:text-slate-900",
              )}
            >
              Staff Allocation
            </button> */}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CARE_TYPE_FILTERS.map((f) => {
            const isActive = filters.careType === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange({ careType: f.id })}
                className={cn(
                  "h-8 rounded-full px-3 text-md font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Scheme, Property, Day of Week, Staff Member Dropdowns + Reset */}
      {/* <div className="flex flex-wrap items-center gap-2.5">
        <Select
          value={filters.schemeId}
          onValueChange={(val) =>
            onFilterChange({ schemeId: val, propertyId: "all" })
          }
        >
          <SelectTrigger className="w-40 h-10 rounded-xl bg-white border-slate-200 text-sm font-medium">
            <SelectValue placeholder="All Schemes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schemes</SelectItem>
            {schemes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.propertyId}
          onValueChange={(val) => onFilterChange({ propertyId: val })}
        >
          <SelectTrigger className="w-44 h-10 rounded-xl bg-white border-slate-200 text-sm font-medium">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Properties ({properties.length})
            </SelectItem>
            {filteredProperties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.staffId}
          onValueChange={(val) => onFilterChange({ staffId: val })}
        >
          <SelectTrigger className="w-40 h-10 rounded-xl bg-white border-slate-200 text-sm font-medium">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff ({staff.length})</SelectItem>
            {staff.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onResetFilters}
          className="h-10 px-2.5 rounded-xl text-md font-medium text-slate-600 hover:text-slate-900 gap-1 cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div> */}
    </Card>
  );
}

