"use client";

import { format, startOfWeek, addDays } from "date-fns";
import { Plus } from "lucide-react";
import { Shift } from "../../../../../../lib/types/shifts";
import { Avatar, AvatarFallback, Badge, Text } from "@repo/ui/components/ui";
import {
  formatUkTime,
  getLocalCalendarDateString,
  getUkDateString,
  isCalendarDateBeforeUkToday,
} from "../../../../../../lib/utils/uk-date-time";

interface WeekTimelineViewProps {
  currentDate: Date;
  viewMode: "staff" | "facility";
  shifts: Shift[];
  rows: Array<{ id: string; name: string; type: string }>;
  onAddShift: (date: Date, entityId: string, entityType: string) => void;
  onEditShift: (shift: Shift) => void;
}

export function WeekTimelineView({
  currentDate,
  viewMode,
  shifts,
  rows,
  onAddShift,
  onEditShift,
}: WeekTimelineViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getCellShifts = (day: Date, row: { id: string; type: string }) =>
    shifts.filter((shift) => {
      const matchesDay =
        getUkDateString(shift.startTime) === getLocalCalendarDateString(day);
      if (viewMode === "staff") {
        return matchesDay && shift.assignments?.some((assignment) => assignment.userId === row.id);
      }
      if (row.id === "facility") return matchesDay && !shift.wingId && !shift.unitId;
      if (row.type === "unit") return matchesDay && shift.unitId === row.id;
      if (row.type === "wing") return matchesDay && shift.wingId === row.id;
      return false;
    });

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm font-sans">
      <table className="w-full border-collapse table-fixed min-w-[1000px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70">
            <th className="p-3.5 text-left w-[220px] border-r border-slate-200 sticky left-0 z-20 bg-slate-50/70">
              <Text size="sm" weight="bold" className="text-slate-700">
                {viewMode === "staff" ? "Staff Member" : "Area / Level"}
              </Text>
            </th>
            {days.map((day) => (
              <th
                key={day.toISOString()}
                className="p-2.5 text-center border-r border-slate-200/80 last:border-r-0 min-w-[130px]"
              >
                <Text size="sm" weight="bold" className="text-slate-500 tracking-wider mb-0.5 uppercase">
                  {format(day, "EEE")}
                </Text>
                <Text size="base" weight="semibold" className="text-base font-semibold text-slate-900">
                  {format(day, "d")}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
              <td className="p-3 border-r border-slate-200 sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-2.5">
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
              </td>
              {days.map((day) => {
                const cellShifts = getCellShifts(day, row);
                const isPastDate = isCalendarDateBeforeUkToday(day);

                return (
                  <td
                    key={`${row.id}-${day.toISOString()}`}
                    title={isPastDate ? "Past date — shifts cannot be scheduled" : undefined}
                    className={`p-1.5 border-r border-slate-200/80 last:border-r-0 min-h-[90px] align-top group/cell relative ${isPastDate ? "cursor-not-allowed bg-slate-50 opacity-70" : "cursor-pointer"}`}
                    onClick={() => {
                      if (isPastDate) return;
                      onAddShift(day, row.id, row.type);
                    }}
                  >
                    <div className="flex flex-col gap-1.5 h-full">
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
                            className="p-1.5 px-2 rounded-lg border border-l-3 transition-all hover:scale-[1.01] hover:shadow-sm cursor-pointer overflow-hidden space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <Text size="sm" weight="bold" className="text-slate-900 truncate">
                                {shift.type?.name || "Custom"}
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

                            <div className="flex items-center justify-between gap-1">
                              <Text size="sm" weight="medium" className="text-sm text-slate-700">
                                {formatUkTime(shift.startTime)}-{formatUkTime(shift.endTime)}
                              </Text>
                              {(!shift.assignments || shift.assignments.length === 0) && (
                                <Badge className="bg-rose-100 text-rose-700 text-sm px-1.5 py-0 border-0 h-4 font-bold shrink-0">
                                  Unassigned
                                </Badge>
                              )}
                            </div>

                            {viewMode === "facility" && shift.assignments && shift.assignments.length > 0 && (
                              <div className="pt-1 flex -space-x-1 overflow-hidden">
                                {shift.assignments.map((a) => (
                                  <Avatar
                                    key={a.id}
                                    size="sm"
                                    className="size-5 ring-1 ring-white cursor-pointer hover:ring-primary"
                                    title={`Unassign ${a.user?.fullName}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newUserIds = shift.assignments?.filter((as) => as.id !== a.id).map((as) => as.userId) || [];
                                      onEditShift({ ...shift, userIds: newUserIds, _quickUnassign: true });
                                    }}
                                  >
                                    <AvatarFallback className="bg-slate-200 text-sm text-slate-800 font-bold">
                                      {a.user?.fullName?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            )}

                            {viewMode === "staff" && (
                              <Text size="sm" weight="bold" className="text-sm text-slate-500 tracking-tight truncate">
                                {shift.wing?.name || shift.unit?.name || "Facility"}
                              </Text>
                            )}
                          </div>
                        );
                      })}
                      {!isPastDate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddShift(day, row.id, row.type);
                          }}
                          className="mt-auto opacity-0 group-hover/cell:opacity-100 flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all py-1 w-full rounded-md cursor-pointer"
                          title="Add shift"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      )}
                    </div>
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
