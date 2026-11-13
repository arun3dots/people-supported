"use client";

import { useMemo } from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  useGetWingsQuery,
  useGetRoomsQuery,
} from "../../../../../lib/queries/facility";
import { ADMISSION_DROPDOWNS } from "../../../../../lib/constants/admissionDropdowns";

interface FilterSectionProps {
  search?: string;
  setSearch?: (val: string) => void;
  selectedDept?: string;
  setSelectedDept?: (val: string) => void;
  selectedDob?: string;
  setSelectedDob?: (val: string) => void;
  selectedRoom?: string;
  setSelectedRoom?: (val: string) => void;
  selectedCareType?: string;
  setSelectedCareType?: (val: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (val: string) => void;
  hideDraftStatusOption?: boolean;
  onReset?: () => void;
}

export function FilterSection({
  search = "",
  setSearch = () => {},
  selectedDept = "All",
  setSelectedDept = () => {},
  selectedDob = "",
  setSelectedDob = () => {},
  selectedRoom = "All",
  setSelectedRoom = () => {},
  selectedCareType = "All",
  setSelectedCareType = () => {},
  selectedStatus = "All",
  setSelectedStatus = () => {},
  hideDraftStatusOption = false,
  onReset,
}: FilterSectionProps) {
  const { data: wingsData } = useGetWingsQuery();
  const { data: roomsData } = useGetRoomsQuery();

  const normalizedDept =
    !selectedDept || selectedDept === "All Units / Wings" ? "All" : selectedDept;
  const normalizedRoom =
    !selectedRoom || selectedRoom === "All Rooms" ? "All" : selectedRoom;
  const normalizedCareType =
    !selectedCareType ||
    selectedCareType === "All Care type" ||
    selectedCareType === "All Care Types"
      ? "All"
      : selectedCareType;
  const normalizedStatus =
    !selectedStatus || selectedStatus === "All Status" ? "All" : selectedStatus;

  const wingOptions = useMemo(() => {
    if (wingsData && wingsData.length > 0) {
      return wingsData.map((w) => w.name).filter(Boolean);
    }
    return [];
  }, [wingsData]);

  const roomOptions = useMemo(() => {
    if (roomsData && roomsData.length > 0) {
      let filtered = roomsData;
      if (normalizedDept !== "All") {
        filtered = roomsData.filter(
          (r) => r.wingName === normalizedDept || r.wing?.name === normalizedDept,
        );
      }
      return filtered.map((r) =>
        r.roomNumber
          ? `Room ${r.roomNumber}`
          : r.name || `Room ${r.id.slice(-3)}`,
      );
    }
    return [];
  }, [roomsData, normalizedDept]);

  const hasActiveFilters =
    normalizedStatus !== "All" ||
    normalizedCareType !== "All" ||
    normalizedDept !== "All" ||
    normalizedRoom !== "All" ||
    search.trim() !== "";

  const handleClearAll = () => {
    if (onReset) {
      onReset();
      return;
    }
    setSelectedStatus("All");
    setSelectedCareType("All");
    setSelectedDept("All");
    setSelectedRoom("All");
    setSearch("");
  };

  return (
    <div className="w-full font-sans flex flex-col gap-3">
      {/* Status Tabs Pill Row */}
      <div className="flex items-center gap-6 border-b border-slate-200/80 text-md overflow-x-auto pb-px">
        {(
          [
            { value: "All", label: "All People" },
            { value: "Active", label: "Active" },
            ...(!hideDraftStatusOption
              ? [{ value: "Draft", label: "In referral" }]
              : []),
            { value: "Hospitalized", label: "In hospital" },
          ] as const
        ).map((tab) => {
          const active = normalizedStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={cn(
                "pb-2.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer text-md",
                active
                  ? "border-primary-800 text-primary-900 font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-800 font-normal",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-3 justify-between w-full">
        {/* Search Input */}
        <div className="relative flex-1 min-w-60 [&_[data-slot=input-error]]:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
          <Input
            type="text"
            placeholder="Search by name, reference, NHS number or key worker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Property Filter */}
            <Select value={normalizedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-40 sm:w-44 h-10 bg-white border-slate-200 rounded-xl text-md font-medium text-slate-700 cursor-pointer">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
                <SelectItem value="All">All Properties</SelectItem>
                {wingOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rooms / Units Filter */}
            <Select value={normalizedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="w-32 sm:w-36 h-10 bg-white border-slate-200 rounded-xl text-md font-medium text-slate-700 cursor-pointer">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
                <SelectItem value="All">All Units</SelectItem>
                {roomOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Primary Need / Funding Filter */}
            <Select value={normalizedCareType} onValueChange={setSelectedCareType}>
              <SelectTrigger className="w-36 sm:w-40 h-10 bg-white border-slate-200 rounded-xl text-md font-medium text-slate-700 cursor-pointer">
                <SelectValue placeholder="All Needs" />
              </SelectTrigger>
              <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)]">
                <SelectItem value="All">All Needs</SelectItem>
                {ADMISSION_DROPDOWNS.fundingTypes.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={!hasActiveFilters}
            className="h-10 px-3 rounded-xl border-slate-200 text-md font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
