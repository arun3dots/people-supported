"use client";

import React, { useState, useMemo } from "react";
import { Pill, Plus } from "lucide-react";
import {
  Button,
  Pagination,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Dialog,
  DialogContent,
} from "@repo/ui/components/ui";
import type { MedicationRoundRow } from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import type { MedGroup } from "./medGroups";
import { ScheduledRoundsDetailDialog } from "./ScheduledRoundsDetailDialog";
import { ScheduledMedRow } from "./ScheduledMedRow";

interface ScheduledMedsTableProps {
  groups: MedGroup[];
  onAddMedication: () => void;
  onAdministerRound: (round: MedicationRoundRow) => void;
  onDeleteRound: (roundId: string) => void;
  isEditable?: boolean;
  scheduleFilter?: "today" | "all";
  onScheduleFilterChange?: (filter: "today" | "all") => void;
}

export function ScheduledMedsTable({
  groups,
  onAddMedication,
  onAdministerRound,
  onDeleteRound,
  isEditable = true,
  scheduleFilter = "all",
  onScheduleFilterChange,
}: ScheduledMedsTableProps): React.JSX.Element {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("5");

  const pageSize = parseInt(rowsPerPage, 10) || 5;

  const detailGroup = groups.find((group) => group.key === detailKey) ?? null;

  const paginatedGroups = useMemo(() => {
    return groups.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [groups, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0">
            <Pill className="size-4" />
          </div>
          <div>
            <Text as="h3" size="base" weight="medium" className="text-slate-900 text-base font-medium">
              Scheduled Medications
            </Text>
            <Text size="sm" variant="muted" className="text-sm text-slate-500">
              Routine prescription rounds scheduled for regular administration.
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onScheduleFilterChange && (
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
              {(["today", "all"] as const).map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  size="sm"
                  variant={scheduleFilter === filter ? "primary" : "ghost"}
                  onClick={() => onScheduleFilterChange(filter)}
                >
                  {filter === "today" ? "Today" : "All"}
                </Button>
              ))}
            </div>
          )}
          {isEditable && (
            <Button type="button" variant="primary" size="sm" onClick={onAddMedication}>
              <Plus className="size-3.5" /> Prescribe Medication
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {groups.length === 0 ? (
        <div className="py-8 text-center space-y-3 rounded-xl bg-slate-50/50 border border-slate-200/80">
          <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 mx-auto shadow-2xs">
            <Pill className="size-6 text-emerald-800" />
          </div>
          <div className="space-y-1">
            <Text size="sm" weight="semibold" className="text-slate-700">
              No scheduled medications prescribed
            </Text>
            <Text size="sm" variant="muted" className="max-w-sm mx-auto">
              Prescribe routine medications to generate the resident's daily Electronic MAR sheet.
            </Text>
          </div>
          {isEditable && (
            <Button variant="outline" size="sm" onClick={onAddMedication}>
              <Plus className="size-3.5" /> Add First Medication
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <Table className="w-full table-fixed text-[12px]">
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200 hover:bg-transparent bg-slate-50/80 h-auto">
                <TableHead className="w-[5%] text-center px-1 pb-2 font-semibold text-[12px] text-slate-700">#</TableHead>
                <TableHead className="w-[27%] px-2 pb-2 font-semibold text-[12px] text-slate-700">Medication</TableHead>
                <TableHead className="w-[17%] px-2 pb-2 font-semibold text-[12px] text-slate-700">Dose &amp; Route</TableHead>
                <TableHead className="w-[15%] px-2 pb-2 font-semibold text-[12px] text-slate-700">Schedule</TableHead>
                <TableHead className="w-[12%] text-center px-1 pb-2 font-semibold text-[12px] text-slate-700">Status</TableHead>
                <TableHead className="w-[13%] px-2 pb-2 font-semibold text-[12px] text-slate-700">Last Given</TableHead>
                <TableHead className="w-[11%] text-right pr-2 pl-1 pb-2 font-semibold text-[12px] text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-[12px]">
              {paginatedGroups.map((group, index) => {
                const rowNumber = (currentPage - 1) * pageSize + index + 1;
                return (
                  <ScheduledMedRow
                    key={group.key}
                    group={group}
                    rowNumber={rowNumber}
                    isEditable={isEditable}
                    onPreviewImage={(url) => setPreviewImage(url)}
                    onOpenDetail={(key) => setDetailKey(key)}
                    onAdministerRound={onAdministerRound}
                    onDeleteRound={onDeleteRound}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      {groups.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <Pagination
            pageNumber={currentPage}
            pageSize={pageSize}
            totalRecords={groups.length}
            limit={rowsPerPage}
            onPageChange={(page: number) => setCurrentPage(page)}
            onLimitChange={(lim: string) => {
              setRowsPerPage(lim);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Scheduled rounds detail for a group */}
      <ScheduledRoundsDetailDialog
        detailGroup={detailGroup}
        onClose={() => setDetailKey(null)}
        onAdministerRound={onAdministerRound}
      />

      {/* Full image preview dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl bg-white p-2 rounded-2xl overflow-hidden">
            <img src={previewImage} alt="Medication Preview" className="w-full max-h-[75vh] object-contain rounded-xl" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
