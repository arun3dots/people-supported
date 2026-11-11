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

interface InvoicesFilterSectionProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  onReset: () => void;
}

export function InvoicesFilterSection({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  onReset,
}: InvoicesFilterSectionProps) {
  const hasActiveFilters =
    statusFilter !== "All Status" ||
    typeFilter !== "All Types" ||
    searchTerm.trim() !== "";

  return (
    <div className="w-full flex flex-col gap-4 font-sans">
      <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 lg:gap-4 justify-between w-full">
        {/* Search Input */}
        <div className="relative flex-1 min-w-60 [&_[data-slot=input-error]]:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
          <Input
            type="text"
            placeholder="Search resident name or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 sm:w-44 h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-md w-auto min-w-[var(--radix-select-trigger-width)]">
                <SelectItem value="All Status">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 sm:w-48 h-11 bg-white border-slate-200 rounded-xl text-md font-regular text-slate-800">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-md w-auto min-w-[var(--radix-select-trigger-width)]">
                <SelectItem value="All Types">All Types</SelectItem>
                <SelectItem value="Residential Fees">Residential Fees</SelectItem>
                <SelectItem value="Nursing Care">Nursing Care</SelectItem>
                <SelectItem value="Respite Fees">Respite Fees</SelectItem>
                <SelectItem value="Additional Services">Additional Services</SelectItem>
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
