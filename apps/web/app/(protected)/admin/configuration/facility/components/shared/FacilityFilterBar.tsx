"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@repo/ui/components/ui/Input";
import { Button } from "@repo/ui/components/ui/Button";
import { cn } from "@repo/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";

export interface FilterDropdown {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

interface FacilityFilterBarProps {
  filters: FilterDropdown[];
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  onClearFilters: () => void;
}

export function FacilityFilterBar({
  filters,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  onClearFilters,
}: FacilityFilterBarProps) {
  const activeFilters = filters.filter((f) => {
    const defaultVal = f.defaultValue || f.options[0]?.value || "";
    return f.value !== defaultVal && f.value !== "" && !f.value.startsWith("All ");
  });

  const hasActiveFilters = activeFilters.length > 0 || searchValue.trim() !== "";

  return (
    <div className="w-full font-sans flex flex-col gap-3">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 lg:gap-4 justify-between w-full">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] [&_[data-slot=input-error]]:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md font-normal text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-end">
            {filters.map((f, idx) => (
              <Select key={idx} value={f.value} onValueChange={f.onChange}>
                <SelectTrigger className="w-[140px] sm:w-[160px] h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800 shadow-none">
                  <SelectValue placeholder={f.placeholder} />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 w-auto min-w-[var(--radix-select-trigger-width)]">
                  {f.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-md">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>

          {/* Clear All — sits under the last filter, like a field error line */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            tabIndex={hasActiveFilters ? 0 : -1}
            aria-hidden={!hasActiveFilters}
            className={cn(
              "inline-flex items-center gap-1 text-md font-medium text-slate-400 hover:text-red-600 transition-opacity duration-200 cursor-pointer px-1 h-6 min-h-[20px]",
              hasActiveFilters
                ? "opacity-100 visible"
                : "opacity-0 invisible pointer-events-none select-none"
            )}
          >
            <X className="size-3" />
            Clear all
          </Button>
        </div>
      </div>
    </div>
  );
}