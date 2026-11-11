"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from "@repo/ui/components/ui";
import { ShiftResidentFilterToolbar } from "./ShiftResidentFilterToolbar";
import {
  ShiftResidentTableRow,
  ResidentRotaItem,
} from "./ShiftResidentTableRow";

export interface FacilityItem {
  id: string;
  name?: string;
  roomNumber?: string;
  number?: string;
  bedLabel?: string;
  code?: string;
  unitId?: string;
  wingId?: string;
  roomId?: string;
}

interface ShiftResidentTableProps {
  allResidents: ResidentRotaItem[];
  selectedResidentIds: string[];
  onToggleResident: (id: string) => void;
  onClearResidents: () => void;
  onSetResidentIds: (ids: string[]) => void;
  units: FacilityItem[];
  wings: FacilityItem[];
  rooms: FacilityItem[];
  beds?: FacilityItem[];
  selectedUnitId?: string | null;
  selectedWingId?: string | null;
  selectedRoomId?: string | null;
  selectedBedId?: string | null;
  onUnitChange: (unitId: string) => void;
  onWingChange: (wingId: string) => void;
  onRoomChange: (roomId: string) => void;
  onBedChange?: (bedId: string) => void;
}

export function ShiftResidentTable({
  allResidents,
  selectedResidentIds,
  onToggleResident,
  onClearResidents,
  onSetResidentIds,
  units,
  wings,
  rooms,
  beds = [],
  selectedUnitId,
  selectedWingId,
  selectedRoomId,
  selectedBedId,
  onUnitChange,
  onWingChange,
  onRoomChange,
  onBedChange,
}: ShiftResidentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResidents = allResidents.filter((r) => {
    const matchesSearch =
      !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit =
      !selectedUnitId || selectedUnitId === "none" || r.unitId === selectedUnitId;
    const matchesWing =
      !selectedWingId || selectedWingId === "none" || r.wingId === selectedWingId;
    const matchesRoom =
      !selectedRoomId || selectedRoomId === "none" || r.roomId === selectedRoomId;
    const matchesBed =
      !selectedBedId || selectedBedId === "none" || r.bedId === selectedBedId;
    return matchesSearch && matchesUnit && matchesWing && matchesRoom && matchesBed;
  });

  const eligibleResidents = filteredResidents.filter(
    (resident) => Boolean(resident.roomId && resident.bedId),
  );

  const facilityLabel =
    selectedBedId && selectedBedId !== "none"
      ? "Bed"
      : selectedRoomId && selectedRoomId !== "none"
        ? "Room"
        : selectedWingId && selectedWingId !== "none"
          ? "Wing"
          : selectedUnitId && selectedUnitId !== "none"
            ? "Unit"
            : "Facility";

  const handleAssignEntireFacility = () => {
    const eligibleIds: string[] = eligibleResidents.map((r) => r.id);
    onSetResidentIds(Array.from(new Set<string>(eligibleIds)));
  };

  const handleToggleSelectAll = () => {
    const eligibleIds = eligibleResidents.map((r) => r.id);

    const isAllSelected =
      eligibleIds.length > 0 &&
      eligibleIds.every((id) => selectedResidentIds.includes(id));
    if (isAllSelected) {
      onSetResidentIds(
        selectedResidentIds.filter((id) => !eligibleIds.includes(id))
      );
    } else {
      onSetResidentIds(
        Array.from(new Set([...selectedResidentIds, ...eligibleIds]))
      );
    }
  };

  const hasNoResidentsInFacility = allResidents.length === 0;

  return (
    <div className="flex flex-col font-sans space-y-3">
      {/* Facility & Search Filters Toolbar */}
      <ShiftResidentFilterToolbar
        units={units}
        wings={wings}
        rooms={rooms}
        beds={beds}
        selectedUnitId={selectedUnitId}
        selectedWingId={selectedWingId}
        selectedRoomId={selectedRoomId}
        selectedBedId={selectedBedId}
        onUnitChange={onUnitChange}
        onWingChange={onWingChange}
        onRoomChange={onRoomChange}
        onBedChange={onBedChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCount={selectedResidentIds.length}
        totalFiltered={filteredResidents.length}
        onClearResidents={onClearResidents}
        onAssignEntireFacility={handleAssignEntireFacility}
        facilityLabel={facilityLabel}
      />

      {/* Resident Matching Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2sm">
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200/80">
              <TableHead className="w-12 text-center py-2.5">
                <input
                  type="checkbox"
                  disabled={eligibleResidents.length === 0}
                  checked={
                    eligibleResidents.length > 0 &&
                    eligibleResidents.every((r) =>
                      selectedResidentIds.includes(r.id)
                    )
                  }
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-primary focus:ring-primary size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-44 py-2.5 text-sm font-semibold text-slate-700">Resident &amp; Room</TableHead>
              <TableHead className="whitespace-nowrap py-2.5 text-sm font-semibold text-slate-700">Dependency</TableHead>
              <TableHead className="whitespace-nowrap py-2.5 text-sm font-semibold text-slate-700">Care Needs</TableHead>
              <TableHead className="whitespace-nowrap py-2.5 text-sm font-semibold text-slate-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center">
                  <EmptyState
                    className="py-4"
                    title={
                      hasNoResidentsInFacility
                        ? "No residents available for shift assignment"
                        : "No residents match your filter selection"
                    }
                    description={
                      hasNoResidentsInFacility
                        ? "Residents must be admitted and assigned to a room and bed before you can schedule a shift."
                        : "Try clearing or changing the Wing, Room, Bed, or search filters above."
                    }
                    action={
                      hasNoResidentsInFacility
                        ? {
                            label: "Go to Resident Directory",
                            href: "/admin/residents",
                            variant: "outline",
                          }
                        : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredResidents.map((res) => (
                <ShiftResidentTableRow
                  key={res.id}
                  resident={res}
                  isSelected={selectedResidentIds.includes(res.id)}
                  onToggle={onToggleResident}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
