"use client";

import { useMemo } from "react";
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
import type { ReviewDueFilter } from "./types";

interface CarePlanFilterSectionProps {
  search: string;
  setSearch: (val: string) => void;
  selectedUnit: string;
  setSelectedUnit: (unit: string) => void;
  availableUnits: string[];
  selectedReviewDue: ReviewDueFilter;
  setSelectedReviewDue: (filter: ReviewDueFilter) => void;
  selectedStatus?: string;
  setSelectedStatus?: (val: string) => void;
  onReset: () => void;
  isFiltered: boolean;
}

export function CarePlanFilterSection({
  search,
  setSearch,
  selectedUnit,
  setSelectedUnit,
  availableUnits,
  selectedReviewDue,
  setSelectedReviewDue,
  selectedStatus = "ALL",
  setSelectedStatus,
  onReset,
  isFiltered,
}: CarePlanFilterSectionProps) {
  const normalizedUnit = !selectedUnit || selectedUnit === "ALL" ? "All" : selectedUnit;
  const normalizedReviewDue = !selectedReviewDue || selectedReviewDue === "ANY" ? "All" : selectedReviewDue;
  const normalizedStatus = !selectedStatus || selectedStatus === "ALL" ? "All" : selectedStatus;

  const reviewDueOptions: Array<{ id: ReviewDueFilter; label: string }> = [
    { id: "ANY", label: "All Reviews" },
    { id: "OVERDUE", label: "Overdue" },
    { id: "14_DAYS", label: "≤ 14 days" },
    { id: "30_DAYS", label: "≤ 30 days" },
  ];

  const hasActiveFilters =
    isFiltered ||
    search.trim() !== "" ||
    normalizedUnit !== "All" ||
    normalizedReviewDue !== "All" ||
    normalizedStatus !== "All";

  return (
    <div className="w-full font-sans flex flex-col gap-3">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 lg:gap-4 justify-between w-full">
        {/* Search Input */}
        <div className="relative flex-1 min-w-60 [&_[data-slot=input-error]]:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
          <Input
            type="text"
            placeholder="Search care plans by resident name, ID, or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 placeholder:text-slate-400 focus:ring-1"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Unit / Wings Filter */}
            <Select
              value={normalizedUnit}
              onValueChange={(val) => setSelectedUnit(val === "All" ? "ALL" : val)}
            >
              <SelectTrigger className="w-36 sm:w-40 h-11 bg-white border-slate-200 cursor-pointer">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
                <SelectItem value="All">All Units</SelectItem>
                {availableUnits.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Review Due Filter */}
            <Select
              value={normalizedReviewDue}
              onValueChange={(val) =>
                setSelectedReviewDue((val === "All" ? "ANY" : val) as ReviewDueFilter)
              }
            >
              <SelectTrigger className="w-36 sm:w-40 h-11 bg-white border-slate-200 cursor-pointer">
                <SelectValue placeholder="Review Due" />
              </SelectTrigger>
              <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
                {reviewDueOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id === "ANY" ? "All" : opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            {setSelectedStatus && (
              <Select
                value={normalizedStatus}
                onValueChange={(val) => setSelectedStatus(val === "All" ? "ALL" : val)}
              >
                <SelectTrigger className="w-36 sm:w-40 h-11 bg-white border-slate-200 cursor-pointer">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="AWAITING_APPROVAL">Awaiting Approval</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                  <SelectItem value="MISSING">Missing Plan</SelectItem>
                  <SelectItem value="REVIEW_OVERDUE">Review Overdue</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Clear All — aligns under the filters like FilterSection.tsx */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
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
