"use client";

import React from "react";
import { format, eachDayOfInterval } from "date-fns";
import { Plus } from "lucide-react";
import { Shift } from "../../../../../../lib/types/shifts";
import { Avatar, AvatarFallback, Badge, Text } from "@repo/ui/components/ui";
import {
  formatUkTime,
  getLocalCalendarDateString,
  getUkDateString,
  isCalendarDateBeforeUkToday,
} from "../../../../../../lib/utils/uk-date-time";

interface CustomRangeTimelineViewProps {
  startDate: Date;
  endDate: Date;
  viewMode: "staff" | "facility";
  shifts: Shift[];
  rows: Array<{ id: string; name: string; type: string }>;
  onAddShift: (date: Date, entityId: string, entityType: string) => void;
  onEditShift: (shift: Shift) => void;
}

export function CustomRangeTimelineView({
  startDate,
  endDate,
  viewMode,
  shifts,
  rows,
  onAddShift,
  onEditShift,
}: CustomRangeTimelineViewProps) {
  const safeStart = startDate <= endDate ? startDate : endDate;
  const safeEnd = startDate <= endDate ? endDate : startDate;
  const days = eachDayOfInterval({ start: safeStart, end: safeEnd });

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs font-sans">
      <div className="min-w-[1000px]">
        {/* Header Row */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 sticky top-0 z-20">
          <div className="w-[220px] p-3 shrink-0 border-r border-slate-200 bg-slate-50/70 sticky left-0 z-30">
            <Text size="sm" weight="bold" className="text-slate-700">
              {viewMode === "staff" ? "Staff Member" : "Area / Level"}
            </Text>
          </div>
          <div className="flex-1 flex divide-x divide-slate-200/80">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="flex-1 min-w-[110px] p-2 text-center flex flex-col items-center justify-center"
              >
                <Text size="sm" weight="medium" className="text-sm text-slate-500 tracking-wider mb-0.5 uppercase font-medium">
                  {format(day, "EEE")}
                </Text>
                <Text size="sm" weight="semibold" className="text-sm font-semibold text-slate-900">
                  {format(day, "MMM d")}
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.id} className="flex min-h-[75px] group hover:bg-slate-50/50 transition-colors">
              {/* Entity Header */}
              <div className="w-[220px] p-3 shrink-0 border-r border-slate-200 bg-white sticky left-0 z-10 flex items-center gap-2.5">
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

              {/* Day Columns Grid */}
              <div className="flex-1 flex divide-x divide-slate-200/80">
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
                      key={`${row.id}-${day.toISOString()}`}
                      onClick={() => {
                        if (!isPastDate) onAddShift(day, row.id, row.type);
                      }}
                      title={isPastDate ? "Past date — shifts cannot be scheduled" : undefined}
                      className={`flex-1 min-w-[110px] p-1.5 flex flex-col gap-1.5 group/cell hover:bg-slate-50/80 transition-colors relative ${isPastDate ? "cursor-not-allowed bg-slate-50 opacity-70" : "cursor-pointer"}`}
                    >
                      {cellShifts.map((shift) => {
                        const color = shift.type?.color || "#4a706a";
                        return (
                          <div
                            key={shift.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditShift(shift);
                            }}
                            style={{
                              borderLeftColor: color,
                              borderColor: `${color}30`,
                              backgroundColor: `${color}12`,
                            }}
                            className="p-1.5 px-2 rounded-lg border border-l-3 transition-all hover:scale-[1.01] hover:shadow-xs overflow-hidden cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <Text size="sm" weight="bold" className="text-slate-900 truncate">
                                {shift.type?.name || "Custom Shift"}
                              </Text>
                              {shift.status === "Draft" && (
                                <Badge className="bg-amber-100 text-amber-800 text-sm px-1.5 py-0 border-0 h-4 font-bold shrink-0">
                                  Draft
                                </Badge>
                              )}
                              {shift.status === "Cancelled" && (
                                <Badge className="bg-rose-100 text-rose-800 text-sm px-1.5 py-0 border-0 h-4 font-bold shrink-0">
                                  Cancelled
                                </Badge>
                              )}
                            </div>
                            <Text size="sm" weight="medium" className="text-sm text-slate-600 flex items-center justify-between">
                              {formatUkTime(shift.startTime)}-{formatUkTime(shift.endTime)}
                            </Text>
                          </div>
                        );
                      })}
                      {!isPastDate && cellShifts.length === 0 && (
                        <div className="size-full opacity-0 group-hover/cell:opacity-100 flex items-center justify-center text-slate-400">
                          <Plus className="size-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
