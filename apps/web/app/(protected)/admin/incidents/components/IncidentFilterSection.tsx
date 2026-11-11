"use client";

import React from "react";
import { Search, ArrowUpDown, X } from "lucide-react";
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

interface IncidentFilterSectionProps {
  search: string;
  setSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  selectedPriority: string;
  setSelectedPriority: (val: string) => void;
  sortOrder: "asc" | "desc";
  toggleSortOrder: () => void;
  onReset?: () => void;
}

export function IncidentFilterSection({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  selectedPriority,
  setSelectedPriority,
  sortOrder,
  toggleSortOrder,
  onReset,
}: IncidentFilterSectionProps) {
  const isFiltered =
    search !== "" ||
    selectedCategory !== "All" ||
    selectedStatus !== "All" ||
    selectedPriority !== "All";

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 lg:gap-4 justify-between font-sans">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px] [&_[data-slot=input-error]]:hidden">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search residents, staff, incident title, or ref..."
          className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
        />
      </div>

      {/* Filter Dropdowns & Controls */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-end">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] sm:w-[155px] h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Fall">Fall</SelectItem>
              <SelectItem value="Medication">Medication Error</SelectItem>
              <SelectItem value="Aggression">Aggression</SelectItem>
              <SelectItem value="Skin Injury">Skin Tear / Injury</SelectItem>
              <SelectItem value="Equipment">Equipment Fault</SelectItem>
              <SelectItem value="Elopement">Elopement Attempt</SelectItem>
              <SelectItem value="Pressure Area">Pressure Area</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[130px] sm:w-[145px] h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[130px] sm:w-[145px] h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
              <SelectItem value="All">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Toggle */}
          <Button
            type="button"
            variant="outline"
            onClick={toggleSortOrder}
            className="rounded-xl h-11 px-3.5 text-md font-regular text-slate-700 flex items-center gap-1.5 shadow-none border-slate-200 bg-white cursor-pointer"
          >
            <ArrowUpDown className="size-3.5 text-slate-500" />
            <span className="hidden sm:inline">
              {sortOrder === "desc" ? "Newest" : "Oldest"}
            </span>
          </Button>
        </div>

        {/* Clear All — sits under the last control, like a field error line */}
        {onReset && (
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
        )}
      </div>
    </div>
  );
}
