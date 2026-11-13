"use client";

import { useState } from "react";
import { Building2, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, toast } from "@repo/ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { EntityListView } from "../../../../lib/components/shared";
import { useListQueryState } from "../../../../lib/hooks";
import { ClinicalEscalationItemDTO } from "@repo/schema";

import { useGetEscalationsQuery } from "../../../../lib/queries/escalations";
import { useGetOrganizationProfileQuery } from "../../../../lib/queries/organization/useGetOrganizationProfileQuery";
import { useExportEscalationsReportMutation } from "../../../../lib/queries/reports";
import { ManagerSignOffModal } from "../../../shared/components/escalations/ManagerSignOffModal";

import { EscalationFilterSection } from "./components/EscalationFilterSection";
import { useEscalationColumns } from "./components/useEscalationColumns";
import { EscalationCard } from "./components/EscalationCardGrid";

const ESCALATION_FILTERS = {
  tab: "active",
} as const;

export function EscalationsDirectory() {
  const queryClient = useQueryClient();

  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [selectedEscalation, setSelectedEscalation] = useState<ClinicalEscalationItemDTO | null>(null);
  const [isSignOffOpen, setIsSignOffOpen] = useState(false);

  const { data: orgProfile } = useGetOrganizationProfileQuery();
  const branches: Array<{ id: string; name: string }> = orgProfile?.branches || [];

  const {
    page,
    limit,
    search,
    searchInput,
    setSearchInput,
    filters,
    setFilter,
    handlePageChange,
    handleLimitChange,
    resetFilters,
  } = useListQueryState({
    filters: ESCALATION_FILTERS,
    storageKey: "escalations_page_size",
  });

  const activeTab = filters.tab || "urgent";

  const statusFilter =
    activeTab === "urgent"
      ? "EscalatedTo999,EscalatedToManager"
      : activeTab === "active"
        ? "Open,Triaged,ActionTaken,EscalatedToGP,EscalatedTo999,EscalatedToManager"
        : activeTab === "cqc"
          ? "EscalatedTo999,EscalatedToManager,Resolved"
          : "Resolved";

  const {
    data: escalationsData,
    isLoading,
    isError,
    refetch,
  } = useGetEscalationsQuery({
    branchId: selectedBranchId === "all" ? undefined : selectedBranchId,
    status: statusFilter,
    // Note: If the backend supports pagination, pass page and limit here.
    // page,
    // limit,
    // search,
  });

  const allItems = escalationsData?.items || [];

  // Client-side search filtering (remove if backend handles search)
  const filteredItems = allItems.filter((item) => {
    if (!search?.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.resident?.fullName?.toLowerCase().includes(q) ||
      String(item.reason || "").toLowerCase().includes(q) ||
      String(item.initialNotes || "").toLowerCase().includes(q)
    );
  });

  // Client-side pagination (remove if backend handles pagination)
  const totalRecords = filteredItems.length;
  const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

  const columns = useEscalationColumns({
    onSignOff: (item) => {
      setSelectedEscalation(item);
      setIsSignOffOpen(true);
    },
  });

  const branchSelector = (
    <div className="flex items-center gap-2">
      <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
        <SelectTrigger >
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-slate-400" />
            <SelectValue placeholder="All Supported Living Services" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Supported Living Services</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const exportEscalationsMutation = useExportEscalationsReportMutation();

  const handleExport = async () => {
    try {
      const res = await exportEscalationsMutation.mutateAsync();
      toast({
        title: "Export Complete",
        description: `Exported ${res.rowCount} clinical escalation records (NU-07)`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export clinical escalations. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <EntityListView<ClinicalEscalationItemDTO>
        title="Clinical Escalations & CQC Governance"
        description="Registered Manager audit hub for acute deterioration, emergency transfers, and CQC Regulation 18 reviews."
        overviewTitle="Escalations List"
        storageKey="escalations_view_mode"
        headerActions={
          <div className="flex items-center gap-3">
            {branchSelector}
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exportEscalationsMutation.isPending}
              className="gap-2 cursor-pointer"
            >
              <Download className="size-4 text-emerald-800" />
              {exportEscalationsMutation.isPending ? "Exporting..." : "Export CSV (NU-07)"}
            </Button>
          </div>
        }
        filters={
          <EscalationFilterSection
            searchTerm={searchInput}
            setSearchTerm={setSearchInput}
            tabFilter={activeTab}
            setTabFilter={(value) => setFilter("tab", value)}
            onReset={resetFilters}
          />
        }
        columns={columns}
        data={filteredItems}
        paginatedData={paginatedItems}
        renderCard={(item) => (
          <EscalationCard
            item={item}
            onSignOff={(item) => {
              setSelectedEscalation(item);
              setIsSignOffOpen(true);
            }}
          />
        )}
        cardGridClassName="grid grid-cols-1 gap-4"
        isLoading={isLoading}
        isError={isError}
        errorMessage="Error loading clinical escalations. Please try again."
        emptyTitle="No Escalations Found"
        emptyDescription="No clinical records matching this branch and filter criteria."
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          showLimitSelector: true,
          entityName: "escalations",
        }}
      />

      <ManagerSignOffModal
        isOpen={isSignOffOpen}
        onClose={() => setIsSignOffOpen(false)}
        escalation={selectedEscalation}
        onSuccess={() => refetch()}
      />
    </>
  );
}
