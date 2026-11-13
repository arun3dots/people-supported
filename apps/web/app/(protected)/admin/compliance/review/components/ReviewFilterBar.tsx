"use client";

import React from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import type {
  ComplianceReviewCategory,
  ComplianceReviewSummaryDTO,
} from "@repo/schema";

interface ReviewFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  days: number;
  onDaysChange: (days: number) => void;
  category: ComplianceReviewCategory;
  onCategoryChange: (category: ComplianceReviewCategory) => void;
  summary?: ComplianceReviewSummaryDTO;
}

export function ReviewFilterBar({
  search,
  onSearchChange,
  days,
  onDaysChange,
  category,
  onCategoryChange,
  summary,
}: ReviewFilterBarProps): React.JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      {/* Search Input - icon perfectly aligned */}
      <div className="relative flex-1 w-full">
        <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by resident, staff, medication, or certificate..."
          className="h-10 w-full pl-10 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-[#4a706a] focus:ring-1 focus:ring-[#4a706a]/20 transition-colors placeholder:text-slate-400 text-slate-800 font-normal"
        />
      </div>

      {/* Category Dropdown (All reviews, Support plans, Staff certs, Medications) */}
      <div className="w-full sm:w-auto shrink-0">
        <Select
          value={category}
          onValueChange={(val) => onCategoryChange(val as ComplianceReviewCategory)}
        >
          <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white border-slate-200 text-sm font-medium text-slate-700">
            <SelectValue placeholder="All Reviews" />
          </SelectTrigger>
          <SelectContent className="min-w-[200px]">
            <SelectItem value="all" className="text-sm py-2">
              All Reviews {summary ? `(${summary.totalDue})` : ""}
            </SelectItem>
            <SelectItem value="support-plan" className="text-sm py-2">
              Support Plans {summary ? `(${summary.supportPlansDue})` : ""}
            </SelectItem>
            <SelectItem value="staff-certification" className="text-sm py-2">
              Staff Training {summary ? `(${summary.staffCertsDue})` : ""}
            </SelectItem>
            <SelectItem value="medication" className="text-sm py-2">
              Medications {summary ? `(${summary.medicationsDue})` : ""}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeframe Window Selector */}
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap hidden lg:inline">
          Timeframe:
        </span>
        <Select
          value={String(days)}
          onValueChange={(val) => onDaysChange(Number(val))}
        >
          <SelectTrigger className="w-full sm:w-[170px] h-10 bg-white border-slate-200 text-sm font-medium text-slate-700">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="min-w-[170px]">
            <SelectItem value="7" className="text-sm py-2">
              Next 7 Days
            </SelectItem>
            <SelectItem value="14" className="text-sm py-2">
              Next 14 Days
            </SelectItem>
            <SelectItem value="30" className="text-sm py-2">
              Next 30 Days
            </SelectItem>
            <SelectItem value="45" className="text-sm py-2">
              Next 45 Days
            </SelectItem>
            <SelectItem value="60" className="text-sm py-2">
              Next 60 Days
            </SelectItem>
            <SelectItem value="90" className="text-sm py-2">
              Next 90 Days
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
