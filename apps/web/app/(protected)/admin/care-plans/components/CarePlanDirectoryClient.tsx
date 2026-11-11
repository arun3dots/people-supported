"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetCarePlansQuery } from "../../../../../lib/queries/care-plan";
import { useGetResidentsQuery } from "../../../../../lib/queries/residents";
import { Alert, AlertDescription } from "@repo/ui/components/ui";
import { CarePlanStatCards } from "./CarePlanStatCards";
import { CarePlanFilterSection } from "./CarePlanFilterSection";
import { useCarePlanColumns } from "./useCarePlanColumns";
import { useCarePlanData } from "./useCarePlanData";
import { EntityListView } from "../../../../../lib/components/shared/EntityListView";
import type { PlanItem, CarePlanFilterTab, ReviewDueFilter } from "./types";

export function CarePlanDirectoryClient() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedReviewDue, setSelectedReviewDue] = useState<ReviewDueFilter>("ANY");
  const [activeTab, setActiveTab] = useState<CarePlanFilterTab>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Fetch care plans & residents
  const { data: rawPlans = [], isLoading: plansLoading, isError: plansError } = useGetCarePlansQuery();
  const { data: rawResidents = [], isLoading: residentsLoading, isError: residentsError } = useGetResidentsQuery();

  // 2. Data synthesis, stats calculation, and filtering
  const { availableUnits, stats, filteredData } = useCarePlanData({
    rawPlans: rawPlans as PlanItem[],
    rawResidents,
    search,
    selectedUnit,
    selectedReviewDue,
    activeTab,
  });

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handleSelectResident = (residentId: string) => {
    router.push(`/admin/residents/${residentId}?tab=careplan`);
  };

  const columns = useCarePlanColumns({ onSelectResident: handleSelectResident });

  const isFiltered =
    search !== "" || selectedUnit !== "ALL" || selectedReviewDue !== "ANY" || activeTab !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedUnit("ALL");
    setSelectedReviewDue("ANY");
    setActiveTab("ALL");
    setPage(1);
  };

  const isLoading = plansLoading || residentsLoading;
  const isError = plansError || residentsError;

  return (
    <EntityListView<PlanItem>
      title="Care planning"
      description="Every plan links to its resident's record (single resident ID). Lifecycle: Draft → Under review → Approved / Active, with Returned and Archived states."
      overviewTitle="Care Plan Directory"
      stats={
        <div className="space-y-4">
          {/* Overdue/Missing Alert Banner */}
          {(stats.reviewOverdueCount > 0 || stats.missingPlanCount > 0) && (
            <Alert
              variant="destructive"
              className="bg-rose-50/90 border-rose-200 text-rose-800 rounded-2xl p-4 py-3"
            >
              <AlertDescription>
                {stats.reviewOverdueCount} care plan review(s) overdue · {stats.missingPlanCount} resident(s) without a care plan.
              </AlertDescription>
            </Alert>
          )}

          {/* Standardized Summary Metrics */}
          <CarePlanStatCards
            stats={stats}
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setPage(1);
            }}
          />
        </div>
      }
      filters={
        <CarePlanFilterSection
          search={search}
          setSearch={(val) => {
            setSearch(val);
            setPage(1);
          }}
          selectedUnit={selectedUnit}
          setSelectedUnit={(unit) => {
            setSelectedUnit(unit);
            setPage(1);
          }}
          availableUnits={availableUnits}
          selectedReviewDue={selectedReviewDue}
          setSelectedReviewDue={(rev) => {
            setSelectedReviewDue(rev);
            setPage(1);
          }}
          selectedStatus={activeTab}
          setSelectedStatus={(st) => {
            setActiveTab(st as CarePlanFilterTab);
            setPage(1);
          }}
          onReset={handleResetFilters}
          isFiltered={isFiltered}
        />
      }
      columns={columns}
      data={filteredData}
      paginatedData={paginatedData}
      isLoading={isLoading}
      isError={isError}
      onRowClick={(plan) => {
        const resId = plan.resident?.id || plan.id;
        if (resId && !resId.startsWith("missing-")) {
          handleSelectResident(resId);
        }
      }}
      emptyTitle="No care plans found"
      emptyDescription="No care plans match the current filter selection."
      pagination={{
        currentPage: page,
        pageSize,
        totalRecords: filteredData.length,
        onPageChange: setPage,
        onLimitChange: (limit) => {
          setPageSize(Number(limit));
          setPage(1);
        },
        entityName: "care plans",
        showLimitSelector: true,
      }}
      showViewToggle={false}
      enableColumnVisibility={false}
    />
  );
}
