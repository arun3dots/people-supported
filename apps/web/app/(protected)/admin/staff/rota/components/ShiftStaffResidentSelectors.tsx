"use client";

import React, { useState, useMemo } from "react";
import { Check, Search } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { Resident } from "../../../../../../lib/types/resident";
import type { StaffMember } from "../../../../../../lib/types/staff";

interface ShiftStaffResidentSelectorsProps {
  careType: string;
  isSharedCare: boolean;
  isOneToOne: boolean;
  isOffDay: boolean;
  staffList: StaffMember[];
  selectedStaffIds: string[];
  onToggleStaff: (staffId: string) => void;
  onSetSingleStaff: (staffId: string) => void;
  residents: Resident[];
  selectedResidentIds: string[];
  onToggleResident: (residentId: string) => void;
  onSetSingleResident: (residentId: string) => void;
  onSelectAllResidents?: () => void;
  onClearResidents?: () => void;
}

export function ShiftStaffResidentSelectors({
  careType,
  isSharedCare,
  isOneToOne,
  isOffDay,
  staffList,
  selectedStaffIds,
  onToggleStaff,
  onSetSingleStaff,
  residents,
  selectedResidentIds,
  onToggleResident,
  onSetSingleResident,
  onSelectAllResidents,
  onClearResidents,
}: ShiftStaffResidentSelectorsProps): React.JSX.Element {
  const [residentSearch, setResidentSearch] = useState("");
  const isTwoToOne = careType.includes("2:1");
  const isHouseWide =
    isSharedCare ||
    careType.includes("Sleep-in") ||
    careType.includes("Waking Night");
  const isMultiStaff = isSharedCare || isTwoToOne;

  const activeResident = residents.find((r) => selectedResidentIds.includes(r.id));

  const getAccommodationLabel = (r: Resident): string | null => {
    const roomNum = r.bed?.room?.roomNumber?.trim();
    if (!roomNum) return null;
    const lower = roomNum.toLowerCase();
    if (lower.startsWith("flat") || lower.startsWith("room") || lower.startsWith("apt") || lower.startsWith("unit")) {
      return roomNum;
    }
    return `Flat / Room ${roomNum}`;
  };

  const filteredResidents = useMemo(() => {
    if (!residentSearch.trim()) return residents;
    const query = residentSearch.toLowerCase().trim();
    return residents.filter((r) => {
      const nameMatch = r.fullName.toLowerCase().includes(query);
      const roomMatch = r.bed?.room?.roomNumber?.toLowerCase().includes(query);
      return nameMatch || roomMatch;
    });
  }, [residents, residentSearch]);

  const handleStaffChipClick = (id: string) => {
    if (activeResident?.doNotAssignIds?.includes(id)) {
      return;
    }
    if (isTwoToOne) {
      if (selectedStaffIds.includes(id)) {
        onToggleStaff(id);
      } else if (selectedStaffIds.length >= 2) {
        // Toggle the second staff member to swap with the newly selected one
        const secondId = selectedStaffIds[1];
        if (secondId) onToggleStaff(secondId);
        onToggleStaff(id);
      } else {
        onToggleStaff(id);
      }
    } else {
      onToggleStaff(id);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Staff Allocation */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label required className="text-md font-semibold text-slate-800">
            {isTwoToOne
              ? "Assigned Staff Members (2 Required for 2:1 Support)"
              : isSharedCare
                ? "Assigned Staff Members (Multiple Allowed)"
                : "Assigned Staff Member"}
          </Label>
          {isTwoToOne ? (
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-semibold ${selectedStaffIds.length === 2
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
            >
              {selectedStaffIds.length} / 2 Assigned
            </span>
          ) : isSharedCare ? (
            <Text size="sm" variant="muted">
              {selectedStaffIds.length} staff selected
            </Text>
          ) : null}
        </div>

        {isMultiStaff ? (
          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
            {staffList.map((st) => {
              const isSelected = selectedStaffIds.includes(st.id);
              const isRegularTeam = activeResident?.preferredCarerIds?.includes(st.id);
              const isRestricted = activeResident?.doNotAssignIds?.includes(st.id);

              return (
                <button
                  key={st.id}
                  type="button"
                  disabled={Boolean(isRestricted)}
                  onClick={() => handleStaffChipClick(st.id)}
                  title={isRestricted ? "Safeguarding restriction: Do-Not-Assign for this resident" : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isRestricted
                    ? "opacity-50 line-through bg-rose-50 text-rose-700 border border-rose-200 cursor-not-allowed"
                    : isSelected
                      ? "bg-primary text-white shadow-xs cursor-pointer"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 cursor-pointer"
                    }`}
                >
                  {isSelected && <Check className="size-3.5" />}
                  {st.fullName} ({st.role?.name || "Staff"})
                  {isRegularTeam && !isSelected && (
                    <span className="text-xs px-1 rounded bg-emerald-100 text-emerald-800 font-normal">
                      Regular Team
                    </span>
                  )}
                  {isRestricted && (
                    <span className="text-xs px-1 rounded bg-rose-100 text-rose-800 font-normal not-sr-only">
                      Restricted
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <Select
            value={selectedStaffIds[0] || ""}
            onValueChange={(val) => onSetSingleStaff(val)}
          >
            <SelectTrigger className="w-full h-10 bg-white">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {staffList.map((st) => {
                const isRegularTeam = activeResident?.preferredCarerIds?.includes(st.id);
                const isRestricted = activeResident?.doNotAssignIds?.includes(st.id);

                return (
                  <SelectItem
                    key={st.id}
                    value={st.id}
                    disabled={Boolean(isRestricted)}
                  >
                    {st.fullName} ({st.role?.name || "Staff"})
                    {isRegularTeam ? " ★ Regular Team" : ""}
                    {isRestricted ? " ⛔ Restricted (Do Not Assign)" : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Competency & Certification Requirement Banner */}
      {activeResident?.requiredCertifications && activeResident.requiredCertifications.length > 0 && !isOffDay && (
        <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <span className="font-medium">Mandatory Competencies Required:</span>
          <div className="flex flex-wrap gap-1">
            {activeResident.requiredCertifications.map((cert) => (
              <span key={cert} className="px-2 py-0.5 rounded-md bg-blue-100 font-semibold text-blue-800">
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. People Supported Selection (Hidden for Off Days) */}
      {!isOffDay && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <Label required className="text-md font-semibold text-slate-800">
                {isOneToOne
                  ? "Person Supported (1:1 Dedicated)"
                  : isTwoToOne
                    ? "Person Supported (2:1 Dedicated)"
                    : isHouseWide
                      ? "People Supported (House Coverage)"
                      : "People Supported"}
              </Label>
              {isHouseWide && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedResidentIds.length} of {residents.length} selected
                </span>
              )}
            </div>

            {isHouseWide && (
              <div className="flex items-center gap-1.5 shrink-0">
                {onSelectAllResidents && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onSelectAllResidents}
                    className="h-7 px-2 text-xs text-primary font-semibold hover:bg-emerald-50 cursor-pointer"
                  >
                    Select All House
                  </Button>
                )}
                {onClearResidents && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClearResidents}
                    className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>

          {isHouseWide ? (
            <div className="space-y-2">
              {residents.length > 6 && (
                <div className="relative">
                  <Search className="h-9 size-4 text-slate-400 absolute left-3 top-4 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search people supported by name, room, or flat..."
                    value={residentSearch}
                    onChange={(e) => setResidentSearch(e.target.value)}
                    className="h-9 pl-9 text-xs bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl max-h-56 overflow-y-auto">
                {filteredResidents.map((r) => {
                  const isSelected = selectedResidentIds.includes(r.id);
                  const roomLabel = getAccommodationLabel(r);

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onToggleResident(r.id)}
                      className={cn(
                        "flex items-center justify-between gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer",
                        isSelected
                          ? "bg-emerald-50/90 border-emerald-300 text-slate-900 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/60",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "size-4 rounded flex items-center justify-center shrink-0 border transition-colors",
                            isSelected
                              ? "bg-primary border-primary text-white"
                              : "border-slate-300 bg-white",
                          )}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-slate-900 truncate">
                          {r.fullName}
                        </span>
                      </div>
                      {roomLabel && (
                        <span className="text-[11px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/80 shrink-0">
                          {roomLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <Select
              value={selectedResidentIds[0] || ""}
              onValueChange={(val) => onSetSingleResident(val)}
            >
              <SelectTrigger className="w-full h-10 bg-white">
                <SelectValue placeholder="Select person supported" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {residents.map((r) => {
                  const roomLabel = getAccommodationLabel(r);
                  return (
                    <SelectItem key={r.id} value={r.id}>
                      {r.fullName} {roomLabel ? `(${roomLabel})` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}

