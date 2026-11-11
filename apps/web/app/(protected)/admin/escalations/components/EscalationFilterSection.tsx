"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@repo/ui/components/ui/Input";
import { Button } from "@repo/ui/components/ui/Button";
import { cn } from "@repo/ui/lib/utils";

interface EscalationFilterSectionProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  tabFilter: string;
  setTabFilter: (val: string) => void;
  onReset: () => void;
}

export function EscalationFilterSection({
  searchTerm,
  setSearchTerm,
  tabFilter,
  setTabFilter,
  onReset,
}: EscalationFilterSectionProps) {
  const isFiltered = searchTerm !== "" || tabFilter !== "active";

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 lg:gap-4 justify-between font-sans">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px] [&_[data-slot=input-error]]:hidden">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search resident or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setTabFilter("urgent")}
            className={cn(
              "px-3.5 py-1.5 h-9 rounded-lg text-md font-bold transition-all cursor-pointer shadow-none",
              tabFilter === "urgent"
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-transparent text-slate-600 hover:bg-slate-100"
            )}
          >
            Urgent Manager Reviews
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setTabFilter("active")}
            className={cn(
              "px-3.5 py-1.5 h-9 rounded-lg text-md font-bold transition-all cursor-pointer shadow-none",
              tabFilter === "active"
                ? "bg-purple-900 hover:bg-purple-950 text-white"
                : "bg-transparent text-slate-600 hover:bg-slate-100"
            )}
          >
            All Active Triage
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setTabFilter("cqc")}
            className={cn(
              "px-3.5 py-1.5 h-9 rounded-lg text-md font-bold transition-all cursor-pointer shadow-none",
              tabFilter === "cqc"
                ? "bg-purple-900 hover:bg-purple-950 text-white"
                : "bg-transparent text-slate-600 hover:bg-slate-100"
            )}
          >
            CQC Regulation 18 Logs
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setTabFilter("resolved")}
            className={cn(
              "px-3.5 py-1.5 h-9 rounded-lg text-md font-bold transition-all cursor-pointer shadow-none",
              tabFilter === "resolved"
                ? "bg-emerald-800 hover:bg-emerald-900 text-white"
                : "bg-transparent text-slate-600 hover:bg-slate-100"
            )}
          >
            Resolved History
          </Button>
        </div>

        {/* Clear All */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          tabIndex={isFiltered ? 0 : -1}
          aria-hidden={!isFiltered}
          className={cn(
            "inline-flex items-center gap-1 text-md font-medium text-slate-400 hover:text-red-600 transition-opacity duration-200 cursor-pointer px-1 h-6 min-h-[20px]",
            isFiltered
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none select-none"
          )}
        >
          <X className="size-3" />
          Clear all
        </Button>
      </div>
    </div>
  );
}
