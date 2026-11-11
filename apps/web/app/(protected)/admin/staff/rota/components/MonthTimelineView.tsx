"use client";

import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Plus } from "lucide-react";
import { Shift } from "../../../../../../lib/types/shifts";
import { Avatar, AvatarFallback, Text } from "@repo/ui/components/ui";
import {
  formatUkTime,
  getLocalCalendarDateString,
  getUkDateString,
  isCalendarDateBeforeUkToday,
} from "../../../../../../lib/utils/uk-date-time";

interface MonthTimelineViewProps {
  currentDate: Date;
  viewMode: "staff" | "facility";
  shifts: Shift[];
  rows: Array<{ id: string; name: string; type: string }>;
  onAddShift: (date: Date, entityId: string, entityType: string) => void;
  onEditShift: (shift: Shift) => void;
}

export function MonthTimelineView({
  currentDate,
  viewMode,
  shifts,
  rows,
  onAddShift,
  onEditShift,
}: MonthTimelineViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs font-sans">
      <div
        className="min-w-max"
        style={{ gridTemplateColumns: `220px repeat(${days.length}, 80px)` }}
      >
        {/* Header Row */}
        <div
          className="grid border-b border-slate-200 bg-slate-50/70 sticky top-0 z-20"
          style={{ gridTemplateColumns: `220px repeat(${days.length}, 80px)` }}
        >
          <div className="w-[220px] p-3 border-r border-slate-200 bg-slate-50/70 sticky left-0 z-30">
            <Text size="sm" weight="bold" className="text-slate-700">
              {viewMode === "staff" ? "Staff Member" : "Area / Level"}
            </Text>
          </div>
          <div className="contents">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="w-20 shrink-0 py-2 text-center flex flex-col items-center justify-center leading-tight"
              >
                <Text size="sm" weight="medium" className="text-sm text-slate-500 mb-0.5 uppercase font-medium">
                  {format(day, "EEE")}
                </Text>
                <Text size="base" weight="semibold" className="text-base font-semibold text-slate-900">
                  {format(day, "d")}
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid min-h-[70px] group hover:bg-slate-50/50 transition-colors"
              style={{ gridTemplateColumns: `220px repeat(${days.length}, 80px)` }}
            >
              {/* Entity Header */}
              <div className="w-[220px] p-3 border-r border-slate-200 bg-white sticky left-0 z-10 flex items-center gap-2.5">
                {viewMode === "staff" && (
                  <Avatar size="sm" className="size-7 shrink-0">
                    <AvatarFallback className="bg-primary text-white text-md font-bold">
                      {row.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Text size="sm" weight="semibold" className="text-slate-900 truncate">
                  {row.name}
                </Text>
              </div>

              {/* Day Cells */}
              {days.map((day) => {
                const isPastDate = isCalendarDateBeforeUkToday(day);
                const cellShifts = shifts.filter((s) => {
                  const matchesDay =
                    getUkDateString(s.startTime) === getLocalCalendarDateString(day);
                  if (viewMode === "staff") {
                    return matchesDay && s.assignments?.some((a) => a.userId === row.id);
                  } else {
                    if (row.id === "facility") return matchesDay && !s.wingId && !s.unitId;
                    if (row.type === "unit") return matchesDay && s.unitId === row.id;
                    if (row.type === "wing") return matchesDay && s.wingId === row.id;
                    return false;
                  }
                });

                  return (
                    <div
                      key={day.toISOString()}
                      title={isPastDate ? "Past date — shifts cannot be scheduled" : undefined}
                      className={`w-20 p-1 flex flex-col gap-1 items-center justify-start group/cell relative hover:bg-slate-50/80 ${isPastDate ? "cursor-not-allowed bg-slate-50 opacity-70" : "cursor-pointer"}`}
                      onClick={() => {
                        if (!isPastDate) onAddShift(day, row.id, row.type);
                      }}
                    >
                      {cellShifts.map((shift) => {
                        const isCancelled = shift.status === "Cancelled";
                        const color = isCancelled ? "#94a3b8" : (shift.type?.color || "#4a706a");
                        return (
                          <div
                            key={shift.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditShift(shift);
                            }}
                            style={{ backgroundColor: color }}
                            title={`${shift.type?.name || "Shift"} (${formatUkTime(shift.startTime)}-${formatUkTime(shift.endTime)})${isCancelled ? " [Cancelled]" : ""}`}
                            className={`w-full h-5 rounded text-white flex items-center justify-center overflow-hidden hover:opacity-85 shadow-2xs cursor-pointer ${isCancelled ? "opacity-60 line-through" : ""}`}
                          >
                            <Text size="sm" weight="bold" className="text-sm text-white leading-none">
                              {shift.type?.name?.charAt(0) || "S"}
                            </Text>
                          </div>
                        );
                      })}
                      {!isPastDate && (
                        <div className="mt-auto opacity-0 group-hover/cell:opacity-100 flex justify-center text-slate-400 py-0.5">
                          <Plus className="size-3" />
                        </div>
                      )}
                    </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
