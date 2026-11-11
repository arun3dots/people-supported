"use client";

import React from "react";
import { Shift } from "../../../../../../lib/types/shifts";
import {
  formatUkTime,
  getUkDateString,
} from "../../../../../../lib/utils/uk-date-time";

interface ShiftHourlyTimelineProps {
  onAddShift?: (time?: string) => void;
  shifts?: Shift[];
}

const HOURS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00",
];

const TOTAL_HOUR_COLS = HOURS.length; // 17

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ShiftBlock({ shift }: { shift: Shift }) {
  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);
  const [startHourValue = 0, startMinuteValue = 0] = formatUkTime(start).split(":").map(Number);
  const [endHourValue = 0, endMinuteValue = 0] = formatUkTime(end).split(":").map(Number);
  const startHour = startHourValue + startMinuteValue / 60;
  const endHour = endHourValue + endMinuteValue / 60;

  // Only show shifts that start within our 17-hour window (00:00 – 16:00)
  if (startHour >= TOTAL_HOUR_COLS) return null;

  const clampedEnd = Math.min(endHour, TOTAL_HOUR_COLS);
  const durationCols = clampedEnd - startHour;

  const color = shift.type?.color ?? "#3D5C57";
  const name = shift.type?.name ?? "Shift";

  return (
    <div
      className="absolute inset-y-0 rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 shadow-xs z-10 overflow-hidden"
      style={{
        left: `calc((100% / ${TOTAL_HOUR_COLS}) * ${startHour})`,
        width: `calc((100% / ${TOTAL_HOUR_COLS}) * ${durationCols})`,
        backgroundColor: `${color}18`,
        borderColor: `${color}50`,
      }}
    >
      <span className="text-md font-bold" style={{ color }}>{name}</span>
      <div className="flex items-center -space-x-2 overflow-hidden">
        {(shift.assignments ?? []).slice(0, 4).map((assignment: { user?: { fullName?: string } }, i: number) => (
          <div
            key={i}
            className="inline-block size-7 rounded-full ring-2 ring-white overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0"
          >
            {assignment.user?.fullName ? getInitials(assignment.user.fullName) : "?"}
          </div>
        ))}
        {(shift.assignments?.length ?? 0) > 4 && (
          <div className="inline-block size-7 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
            +{(shift.assignments?.length ?? 0) - 4}
          </div>
        )}
      </div>
      {(shift.assignments?.length ?? 0) === 0 && (
        <span className="text-xs text-slate-400 font-medium">No staff</span>
      )}
    </div>
  );
}

export function ShiftHourlyTimeline({ onAddShift, shifts = [] }: ShiftHourlyTimelineProps) {
  const today = getUkDateString(new Date());
  const todayShifts = shifts.filter((s) => getUkDateString(s.startTime) === today);

  // Group by shift type for row rendering
  const uniqueTypeIds = Array.from(new Set(todayShifts.map((s) => s.type?.id ?? s.id)));
  const rows = uniqueTypeIds.length > 0 ? uniqueTypeIds : ["early", "noon", "night"];

  const getShiftsForRow = (typeIdOrLabel: string) =>
    todayShifts.filter((s) => (s.type?.id ?? s.id) === typeIdOrLabel);

  const getRowLabel = (typeIdOrLabel: string) => {
    const shift = todayShifts.find((s) => (s.type?.id ?? s.id) === typeIdOrLabel);
    return shift?.type?.name ?? typeIdOrLabel.charAt(0).toUpperCase() + typeIdOrLabel.slice(1) + " Shift";
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm overflow-x-auto">
      <div className="min-w-[1100px]">
        {/* Timeline Header Row */}
        <div className={`grid border-b border-gray-100 pb-3`} style={{ gridTemplateColumns: `140px repeat(${TOTAL_HOUR_COLS}, 1fr)` }}>
          <div className="text-md font-bold text-foreground">Shift</div>
          {HOURS.map((hour) => (
            <div key={hour} className="text-xs font-medium text-muted-foreground text-center">
              {hour}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {rows.map((rowId) => {
            const rowShifts = getShiftsForRow(rowId);
            return (
              <div
                key={rowId}
                className="py-6 items-center relative"
                style={{ display: "grid", gridTemplateColumns: `140px repeat(${TOTAL_HOUR_COLS}, 1fr)` }}
              >
                <div className="text-md font-bold text-foreground pr-2">{getRowLabel(rowId)}</div>

                <div
                  className="h-full relative"
                  style={{ gridColumn: `2 / span ${TOTAL_HOUR_COLS}` }}
                >
                  {rowShifts.map((shift) => (
                    <ShiftBlock key={shift.id} shift={shift} />
                  ))}
                  {rowShifts.length === 0 && (
                    <div
                      onClick={() => onAddShift?.()}
                      className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary/50 hover:text-primary transition-all"
                    >
                      + Add shift
                    </div>
                  )}
                  {HOURS.map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-r border-gray-100/60" style={{ left: `calc((100% / ${TOTAL_HOUR_COLS}) * ${i})` }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
