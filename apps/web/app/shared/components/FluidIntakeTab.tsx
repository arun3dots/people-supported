"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { Droplet, Plus, Edit2, Trash2, Search, Clock } from "lucide-react";
import { Button, Badge, Text, DatePicker } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { usePagination } from "@repo/ui/hooks";
import { Pagination } from "@repo/ui/components/ui/Pagination";
import { DataTable } from "../../../lib/components/shared/DataTable";
import type { TableColumn } from "../../../lib/components/shared/tableColumns";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  useGetFoodFluidLogsQuery,
  useGetFoodFluidSummaryQuery,
  useDeleteFoodFluidLogMutation,
  type FoodFluidLogItem,
} from "../../../lib/queries/residents";
import { AddFluidIntakeDialog } from "./AddFluidIntakeDialog";
import { FluidIntakeMetricsCards } from "./FluidIntakeMetricsCards";
import { FluidIntakeDeleteDialog } from "./FluidIntakeDeleteDialog";

interface FluidIntakeTabProps {
  residentId: string;
  residentStatus?: string;
  isDraft?: boolean;
  selectedDate?: Date;
}

const WRITE_ROLES = new Set(["admin", "superadmin", "manager", "nurse", "carer"]);

export function FluidIntakeTab({
  residentId,
  residentStatus,
  isDraft = false,
  selectedDate: propSelectedDate,
}: FluidIntakeTabProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(propSelectedDate);

  React.useEffect(() => {
    setSelectedDate(propSelectedDate);
  }, [propSelectedDate]);

  const [typeFilter, setTypeFilter] = useState<"All" | "Fluid" | "Food">("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<FoodFluidLogItem | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  const isRestricted = isDraft || residentStatus === "Discharged" || residentStatus === "Deceased";
  const userRole = (user?.roleName || "").toLowerCase();
  const canRecord = !isRestricted && WRITE_ROLES.has(userRole);

  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const { data: logs = [], isLoading: isLoadingLogs, refetch } = useGetFoodFluidLogsQuery(residentId, selectedDate);
  const { data: summary } = useGetFoodFluidSummaryQuery(residentId, formattedDate);
  const deleteMutation = useDeleteFoodFluidLogMutation(residentId);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter !== "All" && log.type !== typeFilter) return false;
      if (!searchTerm.trim()) return true;
      const t = searchTerm.toLowerCase();
      return [log.mealSlot, log.notes, String(log.amount)].some((f) => (f || "").toLowerCase().includes(t));
    });
  }, [logs, typeFilter, searchTerm]);

  const { currentPage, pageSize, paginatedData, totalRecords, handlePageChange, handleLimitChange } =
    usePagination(filteredLogs);

  const handleConfirmDelete = () => {
    if (deletingLogId) {
      deleteMutation.mutate(deletingLogId, { onSuccess: () => setDeletingLogId(null) });
    }
  };

  const fluidCount = logs.filter((l) => l.type === "Fluid").length;
  const foodCount = logs.filter((l) => l.type === "Food").length;

  const columns = useMemo<TableColumn<FoodFluidLogItem>[]>(() => {
    const cols: TableColumn<FoodFluidLogItem>[] = [
      { kind: "index", id: "index", header: "#", align: "left" },
      {
        id: "time",
        header: "Time",
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-slate-400 shrink-0" />
              <Text size="sm" weight="semibold" className="text-slate-900">
                {row.original.timestamp ? format(new Date(row.original.timestamp), "HH:mm") : "—"}
              </Text>
            </div>
            <Text size="sm" className="text-slate-500">
              {row.original.timestamp ? format(new Date(row.original.timestamp), "dd MMM yyyy") : ""}
            </Text>
          </div>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            state={row.original.type === "Fluid" ? "info" : "warning"}
            className={cn("text-sm font-semibold px-2.5 py-0.5 rounded-full", row.original.type === "Fluid" && "bg-[#4A706A] text-white border-none")}
          >
            {row.original.type}
          </Badge>
        ),
      },
      {
        id: "mealSlot",
        header: "Meal / Round",
        cell: ({ row }) => (
          <Text size="sm" weight="medium" className="text-slate-800">{row.original.mealSlot || "Hydration Round"}</Text>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <Text size="sm" weight="bold" className="text-slate-900 whitespace-nowrap">{row.original.amount} {row.original.unit}</Text>
        ),
      },
      {
        id: "intakePercentage",
        header: "% Consumed",
        cell: ({ row }) => (
          <Text size="sm" className="text-slate-700">
            {row.original.intakePercentage !== null && row.original.intakePercentage !== undefined ? `${row.original.intakePercentage}%` : "100%"}
          </Text>
        ),
      },
      {
        id: "notes",
        header: "Notes / Details",
        cell: ({ row }) => <Text size="sm" className="text-slate-600 max-w-xs truncate">{row.original.notes || "—"}</Text>,
      },
    ];

    if (canRecord) {
      cols.push({
        id: "actions",
        header: () => <span className="text-right w-full block">Actions</span>,
        align: "right",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title="Edit entry"
              onClick={() => { setEditingLog(row.original); setModalOpen(true); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Edit2 className="size-4" />
            </button>
            <button
              type="button"
              title="Delete entry"
              onClick={() => setDeletingLogId(row.original.id)}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ),
      });
    }

    return cols;
  }, [canRecord, deleteMutation.isPending]);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Hydration Balance Metrics Cards */}
      <FluidIntakeMetricsCards summary={summary} logs={logs} totalLogsCount={logs.length} selectedDate={selectedDate} />

      {/* 2. Main Standard Container: matches ObservationTab & ResidentDirectory pack container */}
      <div className="w-full bg-surface-card-grey rounded-2xl p-5 lg:p-6 shadow-none border-none font-sans flex flex-col justify-between space-y-4">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-border-secondary/50">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative min-w-56 w-full sm:w-72 flex items-center">
              <Search className="absolute left-3.5 size-4 text-slate-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search notes, slot or amount…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#4A706A] focus:ring-1 focus:ring-[#4A706A]/20 transition-all shadow-2xs"
              />
            </div>

            {/* Segmented type switcher */}
            <div className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
              {(["All", "Fluid", "Food"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-sm font-semibold",
                    typeFilter === t ? "bg-[#4A706A] text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {t === "All" ? `All (${logs.length})` : t === "Fluid" ? `Fluids (${fluidCount})` : `Foods (${foodCount})`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <div className="w-[180px]">
              <DatePicker
                variant="date"
                placeholder="Filter by date..."
                value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(d) => setSelectedDate(d)}
              />
            </div>
            {selectedDate ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(undefined)}
              >
                Clear
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
            )}
            {canRecord && (
              <Button
                type="button"
                onClick={() => { setEditingLog(null); setModalOpen(true); }}
              >
                <Plus className="size-4 text-white" /> Record Intake
              </Button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <DataTable
          columns={columns}
          data={paginatedData}
          isLoading={isLoadingLogs}
          rowIndexOffset={(currentPage - 1) * pageSize}
          emptyTitle="No intake records found"
          emptyDescription={
            logs.length === 0
              ? "No fluid or food intake entries have been logged for this date."
              : `No records found matching "${searchTerm}".`
          }
          emptyAction={
            canRecord && logs.length === 0 ? (
              <Button
                type="button"
                onClick={() => { setEditingLog(null); setModalOpen(true); }}
                className="h-10 rounded-xl px-5 flex items-center gap-2 mt-2 bg-[#4A706A] hover:bg-[#3D5E59] text-white cursor-pointer"
              >
                <Plus className="size-4" /> Record First Intake
              </Button>
            ) : undefined
          }
        />

        {/* Pack Footer: Integrated Pagination */}
        {filteredLogs.length > pageSize && (
          <div className="pt-4 border-t border-border-secondary/50 mt-4">
            <Pagination
              pageNumber={currentPage}
              pageSize={pageSize}
              totalRecords={totalRecords}
              limit={pageSize.toString()}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              disabled={isLoadingLogs}
              entityName="entries"
            />
          </div>
        )}
      </div>

      {/* 3. Add / Edit Modal Dialog */}
      <AddFluidIntakeDialog
        residentId={residentId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingLog={editingLog}
        defaultType={typeFilter === "Food" ? "Food" : "Fluid"}
        onSuccess={() => refetch()}
      />

      {/* 4. Delete Confirmation Dialog */}
      <FluidIntakeDeleteDialog
        open={Boolean(deletingLogId)}
        onOpenChange={(open) => !open && setDeletingLogId(null)}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
