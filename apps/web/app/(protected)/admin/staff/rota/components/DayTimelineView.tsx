"use client";

import React from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Shift } from "../../../../../../lib/types/shifts";
import { Avatar, AvatarFallback, Badge, Text } from "@repo/ui/components/ui";
import {
  formatUkTime,
  getLocalCalendarDateString,
  getUkDateString,
  isCalendarDateBeforeUkToday,
} from "../../../../../../lib/utils/uk-date-time";

interface DayTimelineViewProps {
  currentDate: Date;
  viewMode: "staff" | "facility";
  shifts: Shift[];
  rows: Array<{ id: string; name: string; type: string }>;
  onAddShift: (date: Date, entityId: string, entityType: string) => void;
  onEditShift: (shift: Shift) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayTimelineView({
  currentDate,
  viewMode,
  shifts,
  rows,
  onAddShift,
  onEditShift,
}: DayTimelineViewProps) {
  const isPastDate = isCalendarDateBeforeUkToday(currentDate);

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs font-sans">
      <div className="min-w-[1400px]">
        {/* Header Row */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 sticky top-0 z-20">
          <div className="w-[240px] p-4 shrink-0 border-r border-slate-200 bg-slate-50/70 sticky left-0 z-30">
            <Text size="md" weight="bold" className="text-slate-700">
              {viewMode === "staff" ? "Staff Member" : "Area / Level"}
            </Text>
          </div>
          <div className="flex-1 grid grid-cols-24 divide-x divide-slate-200/80">
            {HOURS.map((h) => (
              <div key={h} className="py-3 text-center">
                <Text size="md" weight="semibold" className="text-md text-slate-500">
                  {String(h).padStart(2, "0")}:00
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {rows.map((row) => {
            const rowShifts = shifts.filter((s) => {
              const matchesDay =
                getUkDateString(s.startTime) === getLocalCalendarDateString(currentDate);
              if (viewMode === "staff") {
                return matchesDay && s.assignments?.some((a) => a.userId === row.id);
              } else {
                if (row.id === "facility") return matchesDay && !s.wingId && !s.unitId;
                if (row.type === "unit") return matchesDay && s.unitId === row.id;
                if (row.type === "wing") return matchesDay && s.wingId === row.id;
                return false;
              }
            });

            // Calculate non-overlapping vertical tracks for shifts
            const sortedShifts = [...rowShifts].sort(
              (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
            const trackEnds: number[] = [];
            const shiftTrackMap = new Map<string, number>();

            sortedShifts.forEach((shift) => {
              const sTime = new Date(shift.startTime);
              const eTime = new Date(shift.endTime);
              const [startHour = 0, startMinute = 0] = formatUkTime(sTime).split(":").map(Number);
              const [endHour = 0, endMinute = 0] = formatUkTime(eTime).split(":").map(Number);
              const startH = startHour + startMinute / 60;
              let endH = endHour + endMinute / 60;
              if (endH <= startH) endH = 24;

              let assignedTrack = -1;
              for (let i = 0; i < trackEnds.length; i++) {
                const currentTrackEnd = trackEnds[i];
                if (currentTrackEnd !== undefined && currentTrackEnd <= startH) {
                  assignedTrack = i;
                  trackEnds[i] = endH;
                  break;
                }
              }
              if (assignedTrack === -1) {
                assignedTrack = trackEnds.length;
                trackEnds.push(endH);
              }
              shiftTrackMap.set(shift.id, assignedTrack);
            });

            const maxTracks = Math.max(1, trackEnds.length);
            const rowMinHeight = Math.max(74, maxTracks * 34 + 16);

            return (
              <div
                key={row.id}
                style={{ minHeight: `${rowMinHeight}px` }}
                className="flex group hover:bg-slate-50/50 transition-colors"
              >
                {/* Row Header */}
                <div className="w-[240px] p-3 shrink-0 border-r border-slate-200 bg-white sticky left-0 z-10 flex items-center gap-3">
                  {viewMode === "staff" && (
                    <Avatar size="sm" className="size-8 shrink-0">
                      <AvatarFallback className="bg-primary text-white text-md font-bold">
                        {row.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Text size="md" weight="semibold" className="text-slate-900 truncate">
                    {row.name}
                  </Text>
                </div>

                {/* Timeline Grid Container */}
                <div
                  onClick={() => {
                    if (!isPastDate) onAddShift(currentDate, row.id, row.type);
                  }}
                  title={isPastDate ? "Past date — shifts cannot be scheduled" : undefined}
                  className={`flex-1 relative grid grid-cols-24 divide-x divide-slate-100 ${isPastDate ? "cursor-not-allowed bg-slate-50 opacity-70" : "cursor-pointer"}`}
                >
                  {/* Hour background column guides */}
                  {HOURS.map((h) => (
                    <div key={h} className="h-full" />
                  ))}

                  {/* Shift Timeline Bars */}
                  {rowShifts.map((shift) => {
                    const sTime = new Date(shift.startTime);
                    const eTime = new Date(shift.endTime);

                    const [startHour = 0, startMinute = 0] = formatUkTime(sTime).split(":").map(Number);
                    const [endHour = 0, endMinute = 0] = formatUkTime(eTime).split(":").map(Number);
                    const startH = startHour + startMinute / 60;
                    let endH = endHour + endMinute / 60;
                    if (endH <= startH) endH = 24;

                    const duration = Math.max(0.5, endH - startH);
                    const leftPct = (startH / 24) * 100;
                    const widthPct = (duration / 24) * 100;
                    const color = shift.type?.color || "#4a706a";

                    const trackIdx = shiftTrackMap.get(shift.id) || 0;
                    const topPx = 8 + trackIdx * 34;

                    return (
                      <div
                        key={shift.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditShift(shift);
                        }}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top: `${topPx}px`,
                          height: "28px",
                          borderColor: color,
                          backgroundColor: `${color}18`,
                        }}
                        className="absolute rounded-lg border-l-3 border shadow-xs px-2 py-0.5 text-slate-900 transition-all hover:scale-[1.01] hover:shadow-sm cursor-pointer overflow-hidden z-10 flex items-center justify-between gap-1.5"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Text size="md" weight="bold" className="text-md text-slate-900 truncate">
                            {shift.type?.name || "Custom"}
                          </Text>
                          <Text size="md" weight="semibold" className="text-md text-slate-600 shrink-0">
                            ({formatUkTime(sTime)}-{formatUkTime(eTime)})
                          </Text>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {shift.status === "Draft" && (
                            <Badge className="bg-amber-100 text-amber-800 text-md px-1.5 py-0 border-0 h-4 font-bold">
                              Draft
                            </Badge>
                          )}
                          {shift.status === "Cancelled" && (
                            <Badge className="bg-rose-100 text-rose-800 text-md px-1.5 py-0 border-0 h-4 font-bold">
                              Cancelled
                            </Badge>
                          )}
                          {(!shift.assignments || shift.assignments.length === 0) && (
                            <Badge className="bg-rose-100 text-rose-700 text-md px-1.5 py-0 border-0 h-4 font-bold">
                              Unassigned
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Plus Icon Overlay on Hover */}
                  {!isPastDate && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none flex items-center justify-center text-slate-400">
                      <Plus className="size-5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
