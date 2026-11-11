"use client";

import React from "react";
import { ArrowLeftRight, Bed, Moon } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
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

interface CareBlockAppearance {
  cellClassName: string;
  shortLabel: string;
  subLabel: string;
  isSleepIn: boolean;
  isNight: boolean;
  isOff: boolean;
}

function getCareBlockAppearance(careType?: string | null): CareBlockAppearance {
  const cType = careType || "Shared Care (Core Support)";
  const is1to1 = cType.includes("1:1");
  const isSleepIn = cType.includes("Sleep-in");
  const isNight = cType.includes("Waking Night");
  const isOff = cType.includes("Off");

  if (is1to1) {
    return {
      cellClassName:
        "bg-surface-primary-light border-border-secondary text-primary hover:bg-emerald-50",
      shortLabel: "1:1",
      subLabel: "1:1 Support",
      isSleepIn: false,
      isNight: false,
      isOff: false,
    };
  }
  if (isSleepIn) {
    return {
      cellClassName:
        "bg-amber-50/80 border-amber-200/80 text-amber-900 hover:bg-amber-50",
      shortLabel: "Sleep-in",
      subLabel: "Overnight",
      isSleepIn: true,
      isNight: false,
      isOff: false,
    };
  }
  if (isNight) {
    return {
      cellClassName:
        "bg-rose-50/80 border-rose-200/80 text-rose-900 hover:bg-rose-50",
      shortLabel: "Night",
      subLabel: "Waking Night",
      isSleepIn: false,
      isNight: true,
      isOff: false,
    };
  }
  if (isOff) {
    return {
      cellClassName:
        "bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
      shortLabel: "Off",
      subLabel: "Rest Day",
      isSleepIn: false,
      isNight: false,
      isOff: true,
    };
  }

  return {
    cellClassName:
      "bg-surface-card-grey border-slate-200 text-slate-900 hover:bg-slate-100",
    shortLabel: "Shared",
    subLabel: "2 people",
    isSleepIn: false,
    isNight: false,
    isOff: false,
  };
}

const LEGEND_ITEMS = [
  { label: "Shared", dotClass: "bg-slate-700" },
  { label: "1:1", dotClass: "bg-primary" },
  { label: "Sleep-in", dotClass: "bg-amber-500" },
  { label: "Waking Night", dotClass: "bg-rose-600" },
];

export function WeeklyRotaScheduleTable({
  days,
  staffList,
  shifts,
  onSelectShift,
  onAddShiftBlock,
  onReassignStaff,
}: WeeklyRotaScheduleTableProps): React.JSX.Element {
  const getShiftForStaffAndDay = (
    staffId: string,
    dayDateStr: string,
  ): Shift | null => {
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
    <Card
      variant="white"
      border="secondary"
      className="p-0 gap-0 overflow-hidden font-sans"
    >
      {/* Table Header & Legend */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Text as="h2" size="lg" weight="semibold" className="text-slate-900">
            Weekly Staff Rota &amp; Care Type Schedule
          </Text>
          <Text size="sm" variant="muted">
            Click any shift block to view the people supported, medication rounds, 1:1 tasks or reassign cover.
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {LEGEND_ITEMS.map((item) => (
            <Text
              key={item.label}
              as="span"
              size="xs"
              weight="medium"
              className="text-slate-600 inline-flex items-center gap-1.5"
            >
              <span className={cn("size-2 rounded-full", item.dotClass)} />
              {item.label}
            </Text>
          ))}
        </div>
      </div>

      {staffList.length === 0 ? (
        <EmptyState
          title="No staff members available"
          description="Add staff members in the Staff Directory to begin scheduling weekly shifts."
        />
      ) : (
        <Table className="min-w-[900px]">
          <TableHeader className="bg-surface-card-grey/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[240px] pl-5 font-medium text-slate-600">
                Staff Member
              </TableHead>
              {days.map((d) => (
                <TableHead key={d.key} className="text-center min-w-[96px]">
                  <Text size="sm" weight="medium" className="text-slate-700">
                    {d.dayName}
                  </Text>
                  <Text size="xs" variant="muted" weight="regular">
                    {d.dayNumber}
                  </Text>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffList.map((staff) => {
              const staffRole = staff.role?.name || "Support Worker";
              const staffProperty =
                staff.assignedWings?.[0]?.name || "Oak House";

              return (
                <TableRow key={staff.id}>
                  <TableCell className="pl-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-full bg-surface-primary-light text-primary flex items-center justify-center font-medium text-xs shrink-0">
                          {staff.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Text
                            size="sm"
                            weight="medium"
                            className="text-slate-900 truncate"
                          >
                            {staff.fullName}
                          </Text>
                          <Text
                            size="xs"
                            variant="muted"
                            className="truncate"
                          >
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
                        className="size-8 rounded-lg text-slate-500 hover:text-primary hover:bg-surface-primary-light shrink-0"
                      >
                        <ArrowLeftRight className="size-4" />
                      </Button>
                    </div>
                  </TableCell>

                  {days.map((d) => {
                    const shift = getShiftForStaffAndDay(staff.id, d.dateStr);

                    if (!shift) {
                      return (
                        <TableCell key={d.key} className="py-2.5 px-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => onAddShiftBlock(staff, d)}
                            className="w-full h-14 rounded-xl border border-dashed border-slate-200 bg-white text-slate-400 hover:border-primary hover:text-primary hover:bg-surface-primary-light/50 flex flex-col items-center justify-center transition-colors cursor-pointer"
                          >
                            <Text as="span" size="xs" weight="medium" variant="muted">
                              Off
                            </Text>
                          </button>
                        </TableCell>
                      );
                    }

                    const appearance = getCareBlockAppearance(shift.careType);

                    return (
                      <TableCell key={d.key} className="py-2.5 px-1.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectShift(
                              shift,
                              staff.fullName,
                              `${d.dayName} ${d.dayNumber}`,
                            )
                          }
                          className={cn(
                            "w-full h-14 rounded-xl border px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer",
                            appearance.cellClassName,
                          )}
                        >
                          {appearance.isOff ? (
                            <Text as="span" size="xs" weight="medium" variant="muted">
                              Off
                            </Text>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 leading-tight">
                                {appearance.isSleepIn && (
                                  <Bed className="size-3.5 text-amber-700 shrink-0" />
                                )}
                                {appearance.isNight && (
                                  <Moon className="size-3.5 text-rose-700 shrink-0" />
                                )}
                                <Text as="span" size="xs" weight="semibold">
                                  {shift.durationHours
                                    ? `${shift.durationHours}h `
                                    : ""}
                                  {appearance.shortLabel}
                                </Text>
                              </div>
                              <Text
                                as="span"
                                size="xs"
                                variant="muted"
                                className="truncate max-w-[85px]"
                              >
                                {appearance.subLabel}
                              </Text>
                            </>
                          )}
                        </button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
