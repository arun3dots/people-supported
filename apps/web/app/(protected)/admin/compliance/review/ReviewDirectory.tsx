"use client";

import React, { useState, useEffect } from "react";
import { ReviewSummaryCards } from "./components/ReviewSummaryCards";
import { ReviewFilterBar } from "./components/ReviewFilterBar";
import { ReviewTable } from "./components/ReviewTable";
import { useGetComplianceReviewsQuery } from "../../../../../lib/queries/compliance/useGetComplianceReviewsQuery";
import { Button } from "@repo/ui/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComplianceReviewCategory } from "@repo/schema";

export function ReviewDirectory(): React.JSX.Element {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [days, setDays] = useState<number>(30);
  const [category, setCategory] = useState<ComplianceReviewCategory>("all");
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useGetComplianceReviewsQuery({
    days,
    category,
    search: debouncedSearch,
    page,
    limit,
  });

  const summary = data?.summary || {
    totalDue: 0,
    supportPlansDue: 0,
    staffCertsDue: 0,
    medicationsDue: 0,
    criticalCount: 0,
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleCategoryChange = (newCat: ComplianceReviewCategory) => {
    setCategory(newCat);
    setPage(1);
  };

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Compliance & Expiry Reviews
        </h1>
        <p className="text-sm text-slate-500">
          Monitor upcoming expirations and scheduled reviews across support plans, staff training certifications, and active medications.
        </p>
      </div>

      {/* Metric Stat Cards */}
      <ReviewSummaryCards
        summary={summary}
        activeCategory={category}
        onSelectCategory={handleCategoryChange}
      />

      {/* Filter Bar */}
      <ReviewFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        days={days}
        onDaysChange={handleDaysChange}
        category={category}
        onCategoryChange={handleCategoryChange}
        summary={summary}
      />

      {/* Data Table */}
      <ReviewTable items={items} isLoading={isLoading} page={page} limit={limit} />

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-xs text-slate-500 font-medium">
            Showing {items.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
            {Math.min(page * limit, total)} of {total} reviews
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="h-8 px-2.5 text-xs font-medium border-slate-200"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              Previous
            </Button>
            <span className="text-xs font-semibold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="h-8 px-2.5 text-xs font-medium border-slate-200"
            >
              Next
              <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
