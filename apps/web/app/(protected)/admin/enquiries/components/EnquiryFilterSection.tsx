"use client";

import React from "react";
import { Search, X } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

interface EnquiryFilterSectionProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  onReset?: () => void;
}

export function EnquiryFilterSection({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  onReset,
}: EnquiryFilterSectionProps) {
  const hasActiveFilters =
    statusFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    search.trim() !== "";

  const handleClearAll = () => {
    if (onReset) {
      onReset();
      return;
    }
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setSearch("");
  };

  return (
    <div className="w-full font-['Outfit',sans-serif] flex flex-col gap-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 lg:gap-4 justify-between w-full">
        {/* Search Input */}
        <div className="relative flex-1 min-w-60 [&_[data-slot=input-error]]:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
          <Input
            type="text"
            placeholder="Search resident or enquirer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
            {/* Status Filter */}
            <div className="min-w-0 lg:w-44">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-11 bg-white border-slate-200 cursor-pointer">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Enquiry">Stage 1: Enquiry</SelectItem>
                  <SelectItem value="Assessment Pending">Stage 2: Assessment Pending</SelectItem>
                  <SelectItem value="Ready for Admission">Stage 3: Ready for Admission</SelectItem>
                  <SelectItem value="Admitted">Admitted</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="min-w-0 lg:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full h-11 bg-white border-slate-200 cursor-pointer">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Dementia">Dementia</SelectItem>
                  <SelectItem value="Respite">Respite</SelectItem>
                  <SelectItem value="Nursing">Nursing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear All — sits under the last filter, like a field error line */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
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
