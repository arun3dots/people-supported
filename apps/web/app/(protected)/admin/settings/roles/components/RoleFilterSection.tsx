"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@repo/ui/components/ui/Input";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { cn } from "@repo/ui/lib/utils";

interface RoleFilterSectionProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  onReset: () => void;
}

export function RoleFilterSection({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  onReset,
}: RoleFilterSectionProps) {
  const isFiltered = searchTerm !== "" || typeFilter !== "All Types";

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 lg:gap-4 justify-between w-full font-sans">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px] [&_[data-slot=input-error]]:hidden">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search roles by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
        />
      </div>

      {/* Filter Dropdowns & Clear */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Role Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] sm:w-[170px] h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
              <SelectItem value="All Types">All Types</SelectItem>
              <SelectItem value="System">System Roles</SelectItem>
              <SelectItem value="Custom">Custom Roles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear All */}
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onReset}
          tabIndex={isFiltered ? 0 : -1}
          aria-hidden={!isFiltered}
          className={cn(
            "inline-flex items-center gap-1 text-md font-medium text-slate-400 hover:text-red-600 transition-opacity duration-200 cursor-pointer px-1 h-6 min-h-[20px] shadow-none",
            isFiltered ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none select-none"
          )}
        >
          <X className="size-3" /> Clear all
        </Button>
      </div>
    </div>
  );
}
