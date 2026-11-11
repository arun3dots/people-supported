"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input, Button } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";

interface ExpensesFilterSectionProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onReset: () => void;
}

export function ExpensesFilterSection({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  onReset,
}: ExpensesFilterSectionProps) {
  const hasActiveFilters =
    categoryFilter !== "All Categories" ||
    statusFilter !== "All Status" ||
    searchTerm.trim() !== "";

  return (
    <div className="w-full flex flex-col gap-4 font-sans">
      <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 lg:gap-4 justify-between w-full">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] [&_[data-slot=input-error]]:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
          <Input
            type="text"
            placeholder="Search vendor, description, or expense no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] sm:w-[190px] h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-md w-auto min-w-[var(--radix-select-trigger-width)]">
                <SelectItem value="All Categories" className="text-md">All Categories</SelectItem>
                <SelectItem value="Medical Supplies" className="text-md">Medical Supplies</SelectItem>
                <SelectItem value="Food & Catering" className="text-md">Food & Catering</SelectItem>
                <SelectItem value="Utilities" className="text-md">Utilities</SelectItem>
                <SelectItem value="Maintenance" className="text-md">Maintenance</SelectItem>
                <SelectItem value="Staffing & Agency" className="text-md">Staffing & Agency</SelectItem>
                <SelectItem value="Equipment" className="text-md">Equipment</SelectItem>
                <SelectItem value="Administration" className="text-md">Administration</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] sm:w-[170px] h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-md w-auto min-w-[var(--radix-select-trigger-width)]">
                <SelectItem value="All Status" className="text-md">All Status</SelectItem>
                <SelectItem value="Paid" className="text-md">Paid</SelectItem>
                <SelectItem value="Pending" className="text-md">Pending</SelectItem>
                <SelectItem value="Approved" className="text-md">Approved</SelectItem>
                <SelectItem value="Draft" className="text-md">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear All — sits under the last filter, like a field error line */}
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
