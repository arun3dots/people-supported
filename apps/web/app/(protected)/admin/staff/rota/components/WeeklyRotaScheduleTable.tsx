"use client";

import React from "react";
import { ArrowLeftRight, Bed, Moon } from "lucide-react";
import { Button, Card, Text } from "@repo/ui/components/ui";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";

export interface DayColumnInfo {
  key: string;
  dayName: string;
  dayNumber: string;
  dateStr: string;
}

interface WeeklyRotaScheduleTableProps {
  days: DayColumnInfo[];
  staffList: StaffMember[];
  shifts: Shift[];
  activeCareTypeFilter: string;
  onSelectShift: (shift: Shift, staffName: string, dayLabel: string) => void;
  onAddShiftBlock: (staff: StaffMember, day: DayColumnInfo) => void;
  onReassignStaff: (staff: StaffMember) => void;
}

export function WeeklyRotaScheduleTable({
  days,
  staffList,
  shifts,
  activeCareTypeFilter,
  onSelectShift,
  onAddShiftBlock,
  onReassignStaff,
}: WeeklyRotaScheduleTableProps): React.JSX.Element {
  const getShiftForStaffAndDay = (staffId: string, dayDateStr: string): Shift | null => {
    return (
      shifts.find((s) => {
        const hasStaff =
          s.userIds?.includes(staffId) ||
          s.assignments?.some((a) => a.userId === staffId);
        if (!hasStaff) return false;
        const shiftStartStr = new Date(s.startTime).toISOString().split("T")[0];
        return shiftStartStr === dayDateStr;
      }) ?? null
    );
  };

  return (
    <Card variant="white" border="secondary" className="p-5 shadow-2xs gap-4 font-sans">
      {/* Table Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <Text as="h2" size="lg" weight="semibold">
            Weekly Staff Rota &amp; Care Type Schedule
          </Text>
          <Text size="md" variant="subdued">
            Click any shift block to view the people supported, medication rounds, 1:1 tasks or reassign cover.
          </Text>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-md text-slate-600 font-medium">
          <Text as="span" size="md" weight="medium" className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-700" />
            Shared
          </Text>
          <Text as="span" size="md" weight="medium" className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-700" />
            1:1
          </Text>
          <Text as="span" size="md" weight="medium" className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            Sleep-in
          </Text>
          <Text as="span" size="md" weight="medium" className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-600" />
            Waking Night
          </Text>
        </div>
      </div>

      {/* Rota Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 text-md font-semibold text-slate-500">
              <th className="py-3 px-3 w-[220px]">Staff Member</th>
              {days.map((d) => (
                <th key={d.key} className="py-3 px-2 text-center min-w-[95px]">
                  <Text size="md" weight="semibold">{d.dayName}</Text>
                  <Text size="md" variant="subdued">{d.dayNumber}</Text>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-md">
            {staffList.map((staff) => {
              const staffRole = staff.role?.name || "Support Worker";
              const staffProperty = staff.assignedWings?.[0]?.name || "Oak House";

              return (
                <tr key={staff.id} className="hover:bg-slate-50/40 transition-colors">
                  {/* Staff Info Cell */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-md shrink-0">
                          {staff.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Text size="md" weight="semibold" className="truncate">
                            {staff.fullName}
                          </Text>
                          <Text size="md" variant="subdued" className="truncate">
                            {staffRole} &middot; {staffProperty}
                          </Text>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => onReassignStaff(staff)}
                        title="Reassign staff work"
                        aria-label={`Reassign ${staff.fullName}`}
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 shrink-0"
                      >
                        <ArrowLeftRight className="size-4" />
                      </Button>
                    </div>
                  </td>

                  {/* 7 Days Cells */}
                  {days.map((d) => {
                    const shift = getShiftForStaffAndDay(staff.id, d.dateStr);

                    if (!shift) {
                      return (
                        <td key={d.key} className="py-2.5 px-1.5 text-center">
                          <Button
                            type="button"
                            onClick={() => onAddShiftBlock(staff, d)}
                            variant="ghost"
                            className="w-full h-14 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 flex-col gap-0.5 transition-all"
                          >
                            <Text as="span" size="md" weight="medium" variant="subdued">Off</Text>
                          </Button>
                        </td>
                      );
                    }

                    const cType = shift.careType || "Shared Care (Core Support)";
                    const is1to1 = cType.includes("1:1");
                    const isSleepIn = cType.includes("Sleep-in");
                    const isNight = cType.includes("Waking Night");
                    const isOff = cType.includes("Off");

                    const cellBg = is1to1
                      ? "bg-emerald-50 border-emerald-200/90 text-emerald-900"
                      : isSleepIn
                        ? "bg-amber-50/70 border-amber-200/90 text-amber-900"
                        : isNight
                          ? "bg-rose-50/70 border-rose-200/90 text-rose-900"
                          : isOff
                            ? "bg-slate-50 border-slate-200/60 text-slate-500"
                            : "bg-slate-100/80 border-slate-200 text-slate-900";

                    return (
                      <td key={d.key} className="py-2.5 px-1.5 text-center">
                        <Button
                          type="button"
                          onClick={() =>
                            onSelectShift(shift, staff.fullName, `${d.dayName} ${d.dayNumber}`)
                          }
                          variant="ghost"
                          className={`w-full h-14 rounded-xl border p-1.5 flex-col gap-0.5 shadow-2xs hover:scale-[1.02] ${cellBg}`}
                        >
                          {isOff ? (
                            <Text as="span" size="md" weight="semibold" variant="subdued">Off</Text>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 leading-tight">
                                {isSleepIn && <Bed className="size-4 text-amber-700" />}
                                {isNight && <Moon className="size-4 text-rose-700" />}
                                <Text as="span" size="md" weight="semibold">
                                  {shift.durationHours ? `${shift.durationHours}h ` : ""}
                                  {is1to1 ? "1:1" : isSleepIn ? "Sleep-in" : isNight ? "Night" : "Shared"}
                                </Text>
                              </div>
                              <Text size="md" weight="medium" variant="subdued" className="truncate max-w-[85px]">
                                {is1to1 ? "1:1 Support" : "2 people"}
                              </Text>
                            </>
                          )}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
