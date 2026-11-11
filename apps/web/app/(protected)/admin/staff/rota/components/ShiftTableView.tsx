"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button, Text, Pagination } from "@repo/ui/components/ui";
import { DataTable } from "../../../../../../lib/components/shared/DataTable";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { useGetResidentsQuery } from "../../../../../../lib/queries/residents/useGetResidentsQuery";
import { useShiftTableColumns } from "./useShiftTableColumns";

interface ShiftTableViewProps {
  shifts: Shift[];
  staff: StaffMember[];
  wings?: { id: string; name: string; branchName?: string; branch?: { id: string; name: string } }[];
  searchQuery?: string;
  facilityName?: string;
  onEditShift: (shift: Shift) => void;
  onAddShift?: () => void;
}

export function ShiftTableView({
  shifts,
  staff,
  wings = [],
  searchQuery = "",
  facilityName: facilityNameProp,
  onEditShift,
  onAddShift,
}: ShiftTableViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const prevShiftsLengthRef = React.useRef(shifts.length);
  React.useEffect(() => {
    if (shifts.length > prevShiftsLengthRef.current) {
      setCurrentPage(1);
    }
    prevShiftsLengthRef.current = shifts.length;
  }, [shifts.length]);

  const { data: apiResidents = [] } = useGetResidentsQuery();

  const wingMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; branchName?: string; branch?: { id: string; name: string } }>();
    wings.forEach((w) => map.set(w.id, w));
    return map;
  }, [wings]);

  const residentWingMap = useMemo(() => {
    const map = new Map<string, { wingName?: string; branchName?: string }>();
    (apiResidents as Array<{ id: string; wingId?: string | null; bed?: { room?: { wingId?: string | null; wing?: { name?: string; branchName?: string; branch?: { name?: string } } | null } | null } | null }>).forEach((r) => {
      const wId = r.bed?.room?.wingId || r.wingId;
      const matched = wId ? wingMap.get(wId) : undefined;
      const wName = r.bed?.room?.wing?.name || matched?.name;
      const bName = r.bed?.room?.wing?.branch?.name || r.bed?.room?.wing?.branchName || matched?.branch?.name || matched?.branchName;
      if (wName || bName) map.set(r.id, { wingName: wName, branchName: bName });
    });
    return map;
  }, [apiResidents, wingMap]);

  const staffMap = useMemo(() => {
    const map = new Map<string, StaffMember>();
    staff.forEach((s) => map.set(s.id, s));
    return map;
  }, [staff]);

  const query = searchQuery.trim().toLowerCase();

  const filteredShifts = useMemo(() => {
    let result = [...shifts];

    if (query) {
      result = result.filter((shift) => {
        const matchedWingName = shift.wing?.name || (shift.wingId ? wingMap.get(shift.wingId)?.name : null);
        const wingMatches = matchedWingName?.toLowerCase().includes(query) ||
          shift.wardName?.toLowerCase().includes(query);
        const typeMatches = shift.type?.name?.toLowerCase().includes(query) ||
          shift.name?.toLowerCase().includes(query);
        const statusMatches = shift.status?.toLowerCase().includes(query);
        const staffMatches = shift.assignments?.some((a) =>
          a.user?.fullName?.toLowerCase().includes(query)
        );
        return Boolean(typeMatches || wingMatches || statusMatches || staffMatches);
      });
    }

    result.sort((a, b) => {
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (bCreated !== aCreated) return bCreated - aCreated;
      const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
      const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
      return aTime - bTime;
    });

    return result;
  }, [shifts, query, wingMap]);

  const totalRecords = filteredShifts.length;
  const paginatedShifts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredShifts.slice(startIndex, startIndex + pageSize);
  }, [filteredShifts, currentPage, pageSize]);

  const columns = useShiftTableColumns({
    currentPage,
    pageSize,
    staffMap,
    wingMap,
    residentWingMap,
    facilityNameProp,
    onEditShift,
  });

  return (
    <div className="w-full bg-surface-card-grey rounded-2xl p-5 lg:p-6 shadow-none border-none font-sans flex flex-col justify-between">
      {/* Pack Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-secondary/50 mb-4">
        <Text size="base" weight="bold" className="text-slate-900">
          Shift Overview
        </Text>
      </div>

      {/* Table Body */}
      <DataTable
        columns={columns}
        data={paginatedShifts}
        emptyTitle="No shifts scheduled"
        emptyDescription="No shifts found matching your criteria."
        emptyAction={
          onAddShift ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onAddShift}
              className="flex items-center gap-2 mt-2"
            >
              <Plus className="size-4" />
              Add Shift
            </Button>
          ) : undefined
        }
        onRowClick={(shift) => onEditShift(shift)}
        rowIndexOffset={(currentPage - 1) * pageSize}
        className="table-fixed w-full text-left"
      />

      {/* Pack Footer: Integrated Pagination */}
      {totalRecords > 0 && (
        <div className="pt-4 border-t border-border-secondary/50 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 shadow-xs focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-500 ml-2">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalRecords)} to{" "}
              {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} shifts
            </span>
          </div>

          <Pagination
            pageNumber={currentPage}
            pageSize={pageSize}
            totalRecords={totalRecords}
            limit={pageSize.toString()}
            onPageChange={setCurrentPage}
            onLimitChange={(lim) => {
              setPageSize(Number(lim));
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
