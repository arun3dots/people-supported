"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { AUDIT_AREAS } from "./audit-helpers";

interface AuditLogFilterSectionProps {
  selectedArea: string;
  onSelectArea: (area: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export function AuditLogFilterSection({
  selectedArea,
  onSelectArea,
  searchTerm,
  setSearchTerm,
}: AuditLogFilterSectionProps) {
  return (
    <div className="w-full flex flex-col gap-3.5 font-sans">
      {/* Category / Area Grouping Pills */}
      <div
        role="tablist"
        aria-label="Audit areas"
        className="flex flex-wrap items-center gap-2"
      >
        {AUDIT_AREAS.map((tab) => {
          const isSelected =
            selectedArea === tab.id || (!selectedArea && tab.id === "all");
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectArea(tab.id)}
              className={cn(
                "inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-md font-medium transition-colors cursor-pointer select-none",
                isSelected
                  ? "bg-[#144738] text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input directly below Grouping Pills */}
      <div className="relative w-full max-w-xs [&_[data-slot=input-error]]:hidden">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
        />
      </div>
    </div>
  );
}
