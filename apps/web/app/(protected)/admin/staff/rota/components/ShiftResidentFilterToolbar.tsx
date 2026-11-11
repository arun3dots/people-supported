"use client";

import React from "react";
import { Search, UserCheck, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@repo/ui/components/ui";

interface ShiftResidentFilterToolbarProps {
  units: any[];
  wings: any[];
  rooms: any[];
  beds?: any[];
  selectedUnitId?: string | null;
  selectedWingId?: string | null;
  selectedRoomId?: string | null;
  selectedBedId?: string | null;
  onUnitChange: (unitId: string) => void;
  onWingChange: (wingId: string) => void;
  onRoomChange: (roomId: string) => void;
  onBedChange?: (bedId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCount: number;
  totalFiltered: number;
  onClearResidents: () => void;
  onAssignEntireFacility: () => void;
  facilityLabel: string;
}

export function ShiftResidentFilterToolbar({
  units,
  wings,
  rooms,
  beds = [],
  selectedUnitId,
  selectedWingId,
  selectedRoomId,
  selectedBedId,
  onUnitChange: _onUnitChange,
  onWingChange,
  onRoomChange,
  onBedChange,
  searchTerm,
  setSearchTerm,
  selectedCount,
  totalFiltered,
  onClearResidents,
  onAssignEntireFacility,
  facilityLabel,
}: ShiftResidentFilterToolbarProps) {
  const filteredWings =
    selectedUnitId && selectedUnitId !== "none"
      ? wings.filter((w) => w.unitId === selectedUnitId)
      : wings;

  const validWingIds = new Set(filteredWings.map((w) => w.id));

  const filteredRooms = rooms.filter((r) => {
    if (selectedWingId && selectedWingId !== "none") {
      return r.wingId === selectedWingId;
    }
    if (selectedUnitId && selectedUnitId !== "none") {
      return validWingIds.has(r.wingId);
    }
    return true;
  });

  const validRoomIds = new Set(filteredRooms.map((r) => r.id));

  const filteredBeds = (beds || []).filter((b) => {
    if (selectedRoomId && selectedRoomId !== "none") {
      return b.roomId === selectedRoomId;
    }
    if (
      (selectedWingId && selectedWingId !== "none") ||
      (selectedUnitId && selectedUnitId !== "none")
    ) {
      return validRoomIds.has(b.roomId);
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-2.5 bg-slate-50/90 p-3 border border-slate-200/80 rounded-xl">
      <div className="flex flex-wrap items-end justify-between gap-2.5">
        <div className="flex flex-wrap items-end gap-2.5 flex-1 min-w-0">
          {/* Wing Filter */}
          <div className="flex flex-col gap-1 w-32 sm:w-36 shrink-0">
            <Label className="text-sm font-semibold text-slate-700">Wing</Label>
            <Select value={selectedWingId || "none"} onValueChange={onWingChange}>
              <SelectTrigger className="w-full bg-white h-9 text-sm rounded-lg border-slate-200">
                <SelectValue placeholder="All Wings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Wings</SelectItem>
                {filteredWings.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Filter */}
          <div className="flex flex-col gap-1 w-28 sm:w-32 shrink-0">
            <Label className="text-sm font-semibold text-slate-700">Room</Label>
            <Select value={selectedRoomId || "none"} onValueChange={onRoomChange}>
              <SelectTrigger className="w-full bg-white h-9 text-sm rounded-lg border-slate-200">
                <SelectValue placeholder="All Rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Rooms</SelectItem>
                {filteredRooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    Room {r.roomNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bed Filter */}
          <div className="flex flex-col gap-1 w-28 sm:w-32 shrink-0">
            <Label className="text-sm font-semibold text-slate-700">Bed</Label>
            <Select
              value={selectedBedId || "none"}
              onValueChange={onBedChange || (() => { })}
            >
              <SelectTrigger className="w-full bg-white h-9 text-sm rounded-lg border-slate-200">
                <SelectValue placeholder="All Beds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Beds</SelectItem>
                {filteredBeds.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    Bed {b.number || b.bedLabel || b.code || b.id.slice(0, 4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Resident Input */}
          <div className="flex flex-col gap-1 min-w-[160px] flex-1 [&_[data-slot=input-error]]:hidden">
            <Label className="text-sm font-semibold text-slate-700">Search Resident</Label>
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resident..."
                className="pl-8 bg-white h-9 text-sm rounded-lg border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          {selectedCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearResidents}
              className="text-slate-500 hover:text-slate-900 rounded-lg h-9 px-2.5 text-sm"
            >
              <X className="size-3 mr-1" />
              Clear ({selectedCount})
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={totalFiltered === 0}
            onClick={onAssignEntireFacility}
            className="rounded-lg h-9 px-3 text-sm font-semibold gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <UserCheck className="size-3.5 text-primary" />
            <span>Assign All {facilityLabel} ({totalFiltered})</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
