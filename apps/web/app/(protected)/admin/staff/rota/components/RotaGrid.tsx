"use client";

import React, { useState, useEffect } from "react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Shift } from "../../../../../../lib/types/shifts";
import { RotaGridToolbar, PeriodViewMode } from "./RotaGridToolbar";
import { DayTimelineView } from "./DayTimelineView";
import { WeekTimelineView } from "./WeekTimelineView";
import { MonthTimelineView } from "./MonthTimelineView";
import { CustomRangeTimelineView } from "./CustomRangeTimelineView";
import { normalizeLocalCalendarDate } from "../../../../../../lib/utils/uk-date-time";

interface RotaGridProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: "staff" | "facility";
  searchQuery?: string;
  shifts: Shift[];
  staff: any[];
  wings: any[];
  units: any[];
  onAddShift: (date: Date, entityId: string, entityType: string) => void;
  onEditShift: (shift: Shift) => void;
}

export function RotaGrid({
  currentDate,
  onDateChange,
  viewMode,
  searchQuery = "",
  shifts,
  staff,
  wings,
  units,
  onAddShift,
  onEditShift,
}: RotaGridProps) {
  const [periodView, setPeriodView] = useState<PeriodViewMode>("week");
  const [gridDate, setGridDate] = useState<Date>(currentDate);
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);
  const [rangeStart, setRangeStart] = useState<Date | undefined>(
    startOfWeek(currentDate, { weekStartsOn: 1 })
  );
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(
    endOfWeek(currentDate, { weekStartsOn: 1 })
  );

  useEffect(() => {
    setGridDate(currentDate);
    if (!isCustomRange && rangeStart !== undefined && rangeEnd !== undefined) {
      if (periodView === "day") {
        setRangeStart(currentDate);
        setRangeEnd(currentDate);
      } else if (periodView === "week") {
        setRangeStart(startOfWeek(currentDate, { weekStartsOn: 1 }));
        setRangeEnd(endOfWeek(currentDate, { weekStartsOn: 1 }));
      } else if (periodView === "month") {
        setRangeStart(startOfMonth(currentDate));
        setRangeEnd(endOfMonth(currentDate));
      }
    }
  }, [currentDate, periodView, isCustomRange]);

  const handlePeriodViewChange = (newMode: PeriodViewMode) => {
    setIsCustomRange(false);
    setPeriodView(newMode);
    if (newMode === "day") {
      setRangeStart(gridDate);
      setRangeEnd(gridDate);
    } else if (newMode === "week") {
      setRangeStart(startOfWeek(gridDate, { weekStartsOn: 1 }));
      setRangeEnd(endOfWeek(gridDate, { weekStartsOn: 1 }));
    } else if (newMode === "month") {
      setRangeStart(startOfMonth(gridDate));
      setRangeEnd(endOfMonth(gridDate));
    }
  };

  const handleGridDateChange = (date: Date) => {
    const calendarDate = normalizeLocalCalendarDate(date);
    setGridDate(calendarDate);
    onDateChange(calendarDate);
  };

  const handleRangeChange = (start?: Date, end?: Date) => {
    setRangeStart(start);
    setRangeEnd(end);
    if (start && end) {
      setIsCustomRange(true);
    } else {
      setIsCustomRange(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();

  // Filter staff based on searchQuery
  const filteredStaff = query
    ? staff.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.department?.toLowerCase().includes(query) ||
          s.role?.name?.toLowerCase().includes(query)
      )
    : staff;

  // Filter units and wings based on searchQuery
  const filteredUnits = query
    ? units.filter((u) => u.name?.toLowerCase().includes(query))
    : units;

  const filteredWings = query
    ? wings.filter((w) => w.name?.toLowerCase().includes(query))
    : wings;

  // Determine rows based on viewMode and search filter
  const rows =
    viewMode === "staff"
      ? filteredStaff.map((s) => ({ id: s.id, name: s.fullName, type: "staff" }))
      : [
          { id: "facility", name: "Facility Wide", type: "facility" },
          ...filteredUnits.map((u) => ({ id: u.id, name: u.name, type: "unit" })),
          ...filteredWings.map((w) => ({ id: w.id, name: w.name, type: "wing" })),
        ].filter((r) => !query || r.name?.toLowerCase().includes(query));

  // Filter shifts based on searchQuery (matching type, assigned user, or area)
  const filteredShifts = query
    ? shifts.filter(
        (s) =>
          s.type?.name?.toLowerCase().includes(query) ||
          s.status?.toLowerCase().includes(query) ||
          s.assignments?.some((a) =>
            a.user?.fullName?.toLowerCase().includes(query)
          ) ||
          s.wing?.name?.toLowerCase().includes(query) ||
          s.unit?.name?.toLowerCase().includes(query)
      )
    : shifts;

  return (
    <div className="w-full space-y-4">
      {/* Date Navigation & View Mode Switcher Toolbar */}
      <RotaGridToolbar
        currentDate={gridDate}
        onDateChange={handleGridDateChange}
        periodView={periodView}
        onPeriodViewChange={handlePeriodViewChange}
        viewMode={viewMode}
        startDate={rangeStart}
        endDate={rangeEnd}
        onRangeChange={handleRangeChange}
      />

      {/* Dynamic View Component */}
      {isCustomRange && rangeStart && rangeEnd ? (
        <CustomRangeTimelineView
          startDate={rangeStart}
          endDate={rangeEnd}
          viewMode={viewMode}
          shifts={filteredShifts}
          rows={rows}
          onAddShift={onAddShift}
          onEditShift={onEditShift}
        />
      ) : (
        <>
          {periodView === "day" && (
            <DayTimelineView
              currentDate={gridDate}
              viewMode={viewMode}
              shifts={filteredShifts}
              rows={rows}
              onAddShift={onAddShift}
              onEditShift={onEditShift}
            />
          )}

          {periodView === "week" && (
            <WeekTimelineView
              currentDate={gridDate}
              viewMode={viewMode}
              shifts={filteredShifts}
              rows={rows}
              onAddShift={onAddShift}
              onEditShift={onEditShift}
            />
          )}

          {periodView === "month" && (
            <MonthTimelineView
              currentDate={gridDate}
              viewMode={viewMode}
              shifts={filteredShifts}
              rows={rows}
              onAddShift={onAddShift}
              onEditShift={onEditShift}
            />
          )}
        </>
      )}
    </div>
  );
}
