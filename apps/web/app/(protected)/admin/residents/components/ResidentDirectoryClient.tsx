"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus } from "lucide-react";
import { Button, toast } from "@repo/ui/components/ui";
import {
  useGetPaginatedResidentsQuery,
  useGetResidentMetricsQuery,
} from "../../../../../lib/queries/residents";
import { useExportResidentsReportMutation } from "../../../../../lib/queries/reports";
import { useAuth } from "../../../../../lib/context/AuthContext";
import { EntityListView } from "../../../../../lib/components/shared";
import { useListQueryState } from "../../../../../lib/hooks";
import type { Resident } from "../../../../../lib/types/resident";
import { MetricsCards } from "./MetricsCards";
import { FilterSection } from "./FilterSection";
import { useResidentColumns } from "./useResidentColumns";
import { ResidentCard } from "./ResidentCard";

const RESIDENT_FILTERS = {
  dept: "All",
  dob: "",
  room: "All",
  careType: "All",
  status: "All",
};

const DEFAULT_HIDDEN_COLUMNS: readonly string[] = ["ageDob"];

interface ResidentDirectoryClientProps {
  assignedOnly?: boolean;
}

export function ResidentDirectoryClient({
  assignedOnly = false,
}: ResidentDirectoryClientProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.roleName?.toLowerCase() === "admin";
  const isCarer = user?.roleName?.toLowerCase() === "carer";
  const roleBase = isAdmin ? "admin" : "carer";
  const effectiveAssignedOnly = assignedOnly || isCarer;

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
    filters: RESIDENT_FILTERS,
    storageKey: "resident_page_size",
  });

  const { data: metricsData } = useGetResidentMetricsQuery();

  const metrics = useMemo(() => {
    if (metricsData) {
      return {
        total: metricsData.total,
        active: metricsData.active,
        newAdmissions: metricsData.newAdmissions,
        discharges: metricsData.discharges,
        avgAge: metricsData.avgAge,
        branchCount: metricsData.branchCount,
      };
    }
    return {
      total: 0,
      active: 0,
      newAdmissions: 0,
      discharges: 0,
      avgAge: 0,
      branchCount: 0,
    };
  }, [metricsData]);

  const {
    data: paginatedResponse,
    isLoading,
    isError,
  } = useGetPaginatedResidentsQuery({
    page,
    limit,
    search,
    wingName: filterParams.dept,
    dob: filterParams.dob,
    roomNumber: filterParams.room,
    careType: filterParams.careType,
    status: filterParams.status,
    assignedOnly: effectiveAssignedOnly ? true : undefined,
  });

  const residents = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  const enrichedMetrics = useMemo(() => {
    const highRiskCount = residents.filter(
      (r) =>
        r.supportedLivingDetails?.riskLevel === "High" ||
        r.careProfile?.careComplexity === "High",
    ).length;
    const inHospitalCount = residents.filter(
      (r) => r.status === "Hospitalized",
    ).length;
    const reviewsDue = residents.filter(
      (r) =>
        r.supportedLivingDetails?.supportPlanHeader?.status === "Due soon" ||
        r.supportedLivingDetails?.supportPlanHeader?.status === "Overdue",
    ).length;

    return {
      ...metrics,
      reviewsDue: reviewsDue || Math.min(3, metrics.active),
      highRiskCount,
      inHospitalCount,
    };
  }, [metrics, residents]);

  const columns = useResidentColumns({
    roleBase,
  });

  const exportMutation = useExportResidentsReportMutation();

  const handleExport = async () => {
    try {
      const res = await exportMutation.mutateAsync();
      toast({
        title: "Export Complete",
        description: `Exported ${res.rowCount} records`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <EntityListView<Resident>
      title={
        effectiveAssignedOnly ? "My Assigned People Supported" : "People Supported"
      }
      description={
        effectiveAssignedOnly
          ? "View people supported allotted for your current duty shift and access support plans."
          : "Profiles, support plans, medication and outcomes for everyone living in Cantra homes."
      }
      overviewTitle={
        effectiveAssignedOnly ? "Shift Allocation" : "People Supported Directory"
      }
      storageKey="resident_directory_view_mode"
      headerActions={
        !effectiveAssignedOnly ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-10 px-3.5 rounded-xl border-slate-200 text-md font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-none"
          >
            <Download className="size-3.5" />
            Export
          </Button>
        ) : undefined
      }
      onAdd={
        isAdmin
          ? () => {
              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem("lcm_admission_draft_new");
              }
              router.push("/admin/residents/admit");
            }
          : undefined
      }
      addLabel="Add Person"
      addIcon={<Plus className="size-4" />}
      stats={
        !effectiveAssignedOnly ? (
          <MetricsCards metrics={enrichedMetrics} />
        ) : undefined
      }
      filters={
        <FilterSection
          search={searchInput}
          setSearch={setSearchInput}
          selectedDept={filters.dept ?? RESIDENT_FILTERS.dept}
          setSelectedDept={(val) => setFilter("dept", val)}
          selectedDob={filters.dob ?? RESIDENT_FILTERS.dob}
          setSelectedDob={(val) => setFilter("dob", val)}
          selectedRoom={filters.room ?? RESIDENT_FILTERS.room}
          setSelectedRoom={(val) => setFilter("room", val)}
          selectedCareType={filters.careType ?? RESIDENT_FILTERS.careType}
          setSelectedCareType={(val) => setFilter("careType", val)}
          selectedStatus={filters.status ?? RESIDENT_FILTERS.status}
          setSelectedStatus={(val) => setFilter("status", val)}
          hideDraftStatusOption={effectiveAssignedOnly}
          onReset={resetFilters}
        />
      }
      columns={columns}
      enableColumnVisibility={true}
      columnVisibilityStorageKey="lcm_resident_table_visible_columns"
      defaultHiddenColumnIds={DEFAULT_HIDDEN_COLUMNS}
      data={residents}
      paginatedData={residents}
      renderCard={(resident, idx) => (
        <ResidentCard
          key={resident.id}
          resident={resident}
          showRightDivider={
            idx % 3 !== 2 && idx !== residents.length - 1
          }
        />
      )}
      onRowClick={(r) => router.push(`/${roleBase}/residents/${r.id}`)}
      isLoading={isLoading}
      isError={isError}
      errorMessage="Error loading resident directory. Please try again."
      emptyTitle={effectiveAssignedOnly ? "No residents allotted for your shift" : "No residents found"}
      emptyDescription={
        effectiveAssignedOnly
          ? "You do not have any residents assigned to your shift yet. Check with your manager or rota planner."
          : "No resident records match your active search or filter criteria."
      }
      pagination={{
        currentPage: page,
        pageSize: limit,
        totalRecords,
        onPageChange: handlePageChange,
        onLimitChange: handleLimitChange,
        entityName: "residents",
      }}
    />
  );
}
