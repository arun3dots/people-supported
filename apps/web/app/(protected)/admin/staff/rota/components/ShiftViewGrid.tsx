"use client";

import React from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { Shift, ShiftType } from "../../../../../../lib/types/shifts";
import {
  getUkDateString,
  getLocalCalendarDateString,
} from "../../../../../../lib/utils/uk-date-time";

interface ShiftViewGridProps {
  currentDate: Date;
  shiftTypes?: ShiftType[];
  shifts?: Shift[];
  onAddShift: (date?: Date) => void;
  onEditShift: (shift: Shift) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ShiftViewGrid({
  currentDate,
  shiftTypes = [],
  shifts = [],
  onAddShift,
  onEditShift,
}: ShiftViewGridProps) {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // If no shift types defined yet, show a fallback row
  const rowTypes = shiftTypes.length > 0 ? shiftTypes : [
    { id: "early", name: "Early Shift", startTime: "06:00", endTime: "15:00", color: "#3D5C57" } as unknown as ShiftType,
    { id: "noon", name: "Noon Shift", startTime: "15:00", endTime: "00:00", color: "#1F2937" } as unknown as ShiftType,
    { id: "night", name: "Night Shift", startTime: "21:00", endTime: "06:00", color: "#6B7280" } as unknown as ShiftType,
  ];

  const getShiftsForTypeAndDay = (type: ShiftType, day: Date): Shift[] => {
    return shifts.filter((s) => {
      return (
        getUkDateString(s.startTime) === getLocalCalendarDateString(day) &&
        s.type?.id === type.id
      );
    });
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm overflow-x-auto">
      <table className="w-full border-collapse min-w-[900px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="py-4 px-4 text-left text-md font-bold text-foreground w-36">Day</th>
            {days.map((day, idx) => (
              <th key={idx} className="py-4 px-3 text-center">
                <div className="text-sm font-semibold text-muted-foreground tracking-wider">
                  {format(day, "EEEE")}
                </div>
                <div className="text-md font-bold text-foreground mt-0.5">{format(day, "d MMM")}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rowTypes.map((shiftType) => (
            <tr key={shiftType.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-6 px-4 align-middle">
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: shiftType.color ?? "#6B7280" }}
                  />
                  <div>
                    <div className="text-md font-bold text-foreground">{shiftType.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {shiftType.startTime} - {shiftType.endTime}
                    </div>
                  </div>
                </div>
              </td>

              {days.map((day, dayIdx) => {
                const dayShifts = getShiftsForTypeAndDay(shiftType, day);

                return (
                  <td key={dayIdx} className="py-4 px-2 text-center align-middle">
                    {dayShifts.length > 0 ? (() => {
                      const firstShift = dayShifts[0]!;
                      return (
                        <div
                          onClick={() => onEditShift(firstShift)}
                          className="p-2 rounded-2xl border hover:opacity-80 cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 min-h-[72px]"
                          style={{
                            backgroundColor: `${shiftType.color ?? "#3D5C57"}12`,
                            borderColor: `${shiftType.color ?? "#3D5C57"}40`,
                          }}
                        >
                          {/* Staff avatars */}
                          <div className="flex items-center -space-x-2 overflow-hidden">
                            {(firstShift.assignments ?? []).slice(0, 4).map((assignment: { user?: { fullName?: string } }, i: number) => (
                              <div
                                key={i}
                                className="inline-block size-7 rounded-full ring-2 ring-white overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0"
                              >
                                {assignment.user?.fullName ? getInitials(assignment.user.fullName) : "?"}
                              </div>
                            ))}
                            {(firstShift.assignments?.length ?? 0) > 4 && (
                              <div className="inline-block size-7 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                +{(firstShift.assignments?.length ?? 0) - 4}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-slate-600">
                            {firstShift.assignments?.length ?? 0} staff
                          </span>
                          {dayShifts.length > 1 && (
                            <span className="text-sm text-slate-500">+{dayShifts.length - 1} more</span>
                          )}
                        </div>
                      );
                    })() : (
                      <div
                        onClick={() => onAddShift(day)}
                        className="p-2 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 min-h-[72px]"
                      >
                        <span className="text-sm font-semibold text-slate-500 hover:text-primary">
                          + Add Shift
                        </span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
