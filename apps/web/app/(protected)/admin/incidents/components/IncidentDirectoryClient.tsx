"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { Button, toast } from "@repo/ui/components/ui";
import {
  useGetPaginatedIncidentsQuery,
  useGetIncidentMetricsQuery,
} from "../../../../../lib/queries/incidents";
import { useExportIncidentsReportMutation } from "../../../../../lib/queries/reports";
import type { Incident, IncidentMetrics } from "../../../../../lib/types/incident";
import { EntityListView } from "../../../../../lib/components/shared";
import { useListQueryState } from "../../../../../lib/hooks";
import { IncidentMetricsCards } from "./IncidentMetricsCards";
import { IncidentFilterSection } from "./IncidentFilterSection";
import { useIncidentColumns } from "./useIncidentColumns";
import { IncidentCard } from "./IncidentCardGrid";

const INCIDENT_FILTERS = {
  category: "All",
  status: "All",
  priority: "All",
  sortOrder: "desc",
} as const;

export function IncidentDirectoryClient() {
  const router = useRouter();

  const {
    page,
    limit,
    search,
    searchInput,
    setSearchInput,
    filters,
    filterParams,
    setFilter,
    handlePageChange,
    handleLimitChange,
    resetFilters,
  } = useListQueryState({
    filters: INCIDENT_FILTERS,
    storageKey: "incidents_page_size",
  });

  const sortOrder = (filters.sortOrder === "asc" ? "asc" : "desc") as "asc" | "desc";
  const toggleSortOrder = () => {
    setFilter("sortOrder", sortOrder === "asc" ? "desc" : "asc");
  };

  // 1. KPI metrics (persistent, unaffected by pagination)
  const { data: serverMetrics } = useGetIncidentMetricsQuery();

  const defaultMetrics: IncidentMetrics = {
    total: 0,
    open: 0,
    underReview: 0,
    closed: 0,
    overdue: 0,
    closedThisMonth: 0,
  };

  const metrics = serverMetrics || defaultMetrics;

  // 2. Paginated incidents driven by page, limit, search, and filters
  const { data: paginatedResponse, isLoading, isError } = useGetPaginatedIncidentsQuery({
    page,
    limit,
    search,
    category: filterParams.category,
    status: filterParams.status,
    priority: filterParams.priority,
    sortOrder,
  });

  const incidents = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  const columns = useIncidentColumns();
  const exportMutation = useExportIncidentsReportMutation();

  const handleExport = async () => {
    try {
      const res = await exportMutation.mutateAsync({});
      toast({
        title: "Export Complete",
        description: `Exported ${res.rowCount} incident records (RM-02)`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export incident log. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <EntityListView<Incident>
      title="Incident Management"
      description="Monitor, manage, and review all incidents to ensure safety, accountability, and CQC compliance."
      overviewTitle="Incident Overview"
      storageKey="incidents_directory_view_mode"
      headerActions={
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="gap-2 cursor-pointer"
        >
          <Download className="size-4 text-emerald-800" />
          {exportMutation.isPending ? "Exporting..." : "Export CSV (RM-02)"}
        </Button>
      }
      onAdd={() => router.push("/admin/incidents/record")}
      addLabel="Record Incident"
      addIcon={<Plus className="size-4" />}
      stats={<IncidentMetricsCards metrics={metrics} />}
      filters={
        <IncidentFilterSection
          search={searchInput}
          setSearch={setSearchInput}
          selectedCategory={filters.category ?? INCIDENT_FILTERS.category}
          setSelectedCategory={(val) => setFilter("category", val)}
          selectedStatus={filters.status ?? INCIDENT_FILTERS.status}
          setSelectedStatus={(val) => setFilter("status", val)}
          selectedPriority={filters.priority ?? INCIDENT_FILTERS.priority}
          setSelectedPriority={(val) => setFilter("priority", val)}
          sortOrder={sortOrder}
          toggleSortOrder={toggleSortOrder}
          onReset={resetFilters}
        />
      }
      columns={columns}
      data={incidents}
      paginatedData={incidents}
      renderCard={(incident, idx) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          showRightDivider={
            idx % 3 !== 2 && idx !== incidents.length - 1
          }
        />
      )}
      onRowClick={(incident) => router.push(`/admin/incidents/${incident.id}`)}
      isLoading={isLoading}
      isError={isError}
      errorMessage="Error loading incidents directory. Please try again."
      emptyTitle="No incidents found"
      emptyDescription="No incident records match your active search or filter criteria."
      pagination={{
        currentPage: page,
        pageSize: limit,
        totalRecords,
        onPageChange: handlePageChange,
        onLimitChange: handleLimitChange,
        entityName: "incidents",
      }}
    />
  );
}
