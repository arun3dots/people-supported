"use client";

import React, { useState } from "react";
import { Download, FileText } from "lucide-react";
import {
  useGetPaginatedAuditLogsQuery,
  type AuditLog as AuditLogItem,
} from "../../../../lib/queries/audit/useGetAuditLogsQuery";
import { Button } from "@repo/ui/components/ui";
import { EntityListView } from "../../../../lib/components/shared";
import { useListQueryState } from "../../../../lib/hooks";
import { AuditLogFilterSection } from "./components/AuditLogFilterSection";
import { useAuditLogColumns } from "./components/useAuditLogColumns";
import { AuditLogDetailModal } from "./components/AuditLogDetailModal";

const AUDIT_LOG_FILTERS = {
  area: "all",
  userId: "all",
  actionType: "all",
  startDate: "",
  endDate: "",
} as const;

export function AuditLog() {
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
  } = useListQueryState({
    filters: AUDIT_LOG_FILTERS,
    storageKey: "audit_logs_page_size",
  });

  const {
    data: paginatedResponse,
    isLoading,
    error,
  } = useGetPaginatedAuditLogsQuery({
    page,
    limit,
    search,
    area: filterParams.area !== "all" ? filterParams.area : undefined,
    userId: filterParams.userId !== "all" ? filterParams.userId : undefined,
    actionType:
      filterParams.actionType !== "all" ? filterParams.actionType : undefined,
    startDate: filterParams.startDate || undefined,
    endDate: filterParams.endDate || undefined,
  });

  const logs = paginatedResponse?.data ?? [];
  const totalRecords = paginatedResponse?.total ?? 0;

  const handleExport = (formatType: "excel" | "pdf") => {
    const params = new URLSearchParams();
    if (filterParams.area && filterParams.area !== "all")
      params.append("area", filterParams.area);
    if (filterParams.userId && filterParams.userId !== "all")
      params.append("userId", filterParams.userId);
    if (filterParams.actionType && filterParams.actionType !== "all")
      params.append("actionType", filterParams.actionType);
    if (filterParams.startDate)
      params.append("startDate", filterParams.startDate);
    if (filterParams.endDate) params.append("endDate", filterParams.endDate);

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";
    window.open(
      `${baseUrl}/audit-logs/export/${formatType}?${params.toString()}`,
      "_blank",
    );
  };

  const columns = useAuditLogColumns();
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  return (
    <>
      <EntityListView<AuditLogItem>
        title="Audit Log"
        description="Append-only. Task logs, medication records, plan approvals, incident decisions and permission changes all land here."
        showViewToggle={false}
        viewMode="table"
        headerActions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => handleExport("excel")}
              className="rounded-xl gap-2 text-md font-semibold cursor-pointer"
            >
              <Download className="size-4" /> Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              className="rounded-xl gap-2 text-md font-semibold cursor-pointer"
            >
              <FileText className="size-4" /> Export PDF
            </Button>
          </div>
        }
        filters={
          <AuditLogFilterSection
            selectedArea={filters.area ?? "all"}
            onSelectArea={(area) => setFilter("area", area)}
            searchTerm={searchInput}
            setSearchTerm={setSearchInput}
          />
        }
        columns={columns}
        data={logs}
        paginatedData={logs}
        onRowClick={(log) => setSelectedLog(log)}
        isLoading={isLoading}
        isError={!!error}
        errorMessage="Error loading audit trail. Please try again."
        emptyTitle="No audit records found"
        emptyDescription="Try choosing a different area tab or clearing your search term."
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          entityName: "audit records",
        }}
      />

      <AuditLogDetailModal
        log={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}
