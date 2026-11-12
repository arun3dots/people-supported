"use client";

import React from "react";
import { format } from "date-fns";
import { ArrowLeftRight, Bed, ChevronLeft, ChevronRight, Moon } from "lucide-react";
import {
  Button, Card, DatePicker, EmptyState, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { PropertyItem, SchemeItem } from "../../../../../../lib/types/facility";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import {
  getCareBlockAppearance, getShiftAssignedResidentIds,
  getShiftDateStr, resolveStaffLocation,
} from "./rotaDataUtils";
import { WeeklyRotaDailyCoverageFooter } from "./WeeklyRotaDailyCoverageFooter";

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
  schemes?: SchemeItem[];
  properties?: PropertyItem[];
  activeCareTypeFilter: string;
  isLocked?: boolean;
  onSelectShift: (shift: Shift, staffName: string, dayLabel: string) => void;
  onAddShiftBlock: (staff: StaffMember, day: DayColumnInfo) => void;
  onReassignStaff: (staff: StaffMember) => void;
  currentDate?: Date;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
  onCurrentWeek?: () => void;
  onSelectDate?: (date: Date) => void;
}

const LEGEND_ITEMS = [
  { label: "Shared", dotClass: "bg-slate-700" },
  { label: "1:1", dotClass: "bg-primary" },
  { label: "2:1", dotClass: "bg-indigo-600" },
  { label: "Sleep-in", dotClass: "bg-amber-500" },
  { label: "Waking Night", dotClass: "bg-rose-600" },
];

export function WeeklyRotaScheduleTable({
  days,
  staffList,
  shifts,
  schemes = [],
  properties = [],
  isLocked = false,
  onSelectShift,
  onAddShiftBlock,
  onReassignStaff,
  currentDate,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onSelectDate,
}: WeeklyRotaScheduleTableProps): React.JSX.Element {
  const todayDateStr = format(new Date(), "yyyy-MM-dd");

  const getShiftsForStaffAndDay = (
    staffId: string,
    dayDateStr: string,
  ): Shift[] => {
    return shifts
      .filter((s) => {
        if (s.status === "Cancelled") return false;
        const hasStaff =
          s.userIds?.includes(staffId) ||
          s.assignments?.some((a) => a.userId === staffId);
        if (!hasStaff) return false;
        return getShiftDateStr(s) === dayDateStr;
      })
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  };

  return (
    <Card
      variant="surface"
      border="default"
      className="p-5 lg:p-6 gap-0 border-none shadow-none font-sans"
    >
      {/* Pack Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-border-secondary/50 mb-4">
        <div>
          <Text as="h2" size="base" weight="semibold" className="text-slate-900">
            Weekly Staff Rota &amp; Care Type Schedule
          </Text>
          <Text size="md" variant="muted">
            Click any shift block to view the people supported, medication rounds, 1:1 tasks or reassign cover.
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Week Stepper (< This Week >) */}
          {onPreviousWeek && onNextWeek && (
            <div className="flex items-center gap-0.5 bg-surface-card-grey p-1 rounded-xl border border-slate-200/80">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onPreviousWeek}
                title="Previous Week"
                className="size-8 p-0 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {onCurrentWeek && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCurrentWeek}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-white cursor-pointer"
                >
                  This Week
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onNextWeek}
                title="Next Week"
                className="size-8 p-0 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}

          {/* Date Picker Jump Popover */}
          {onSelectDate && (
            <div className="w-40 sm:w-44">
              <DatePicker
                value={currentDate}
                onChange={(d) => d && onSelectDate(d)}
                maxYear={new Date().getFullYear() + 5}
                formatString="dd MMM yyyy"
                placeholder="Pick date/week..."
                className="w-full"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 sm:pl-3 sm:border-l sm:border-slate-200">
            {LEGEND_ITEMS.map((item) => (
              <Text
                key={item.label}
                as="span"
                size="sm"
                weight="medium"
                className="text-slate-600 inline-flex items-center gap-1.5"
              >
                <span className={cn("size-2 rounded-full", item.dotClass)} />
                {item.label}
              </Text>
            ))}
          </div>
        </div>
      </div>

      {staffList.length === 0 ? (
        <EmptyState
          title="No staff members available"
          description="Add staff members in the Staff Directory to begin scheduling weekly shifts."
        />
      ) : (
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[900px] border-collapse">
            <TableHeader>
              <TableRow className="border-b border-border-secondary/50 hover:bg-transparent">
                <TableHead className="w-[240px] py-3 px-3.5 font-medium text-slate-600">
                  Staff Member
                </TableHead>
                {days.map((d) => (
                  <TableHead
                    key={d.key}
                    className="py-3 px-2 text-center min-w-[96px]"
                  >
                    <Text size="md" weight="medium" className="text-slate-700">
                      {d.dayName}
                    </Text>
                    <Text size="md" variant="muted" weight="regular">
                      {d.dayNumber}
                    </Text>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {staffList.map((staff) => {
                const staffRole = staff.role?.name || "Staff";
                const { propertyName } = resolveStaffLocation(
                  staff,
                  schemes,
                  properties,
                );

                return (
                  <TableRow
                    key={staff.id}
                    className="border-b border-border-secondary/40 hover:bg-white/50"
                  >
                    <TableCell className="py-3 px-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-9 rounded-full bg-surface-primary-light text-primary flex items-center justify-center font-medium text-md shrink-0">
                            {staff.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Text size="md" weight="medium" className="text-slate-900 truncate">
                              {staff.fullName}
                            </Text>
                            <Text size="md" variant="muted" className="truncate">
                              {propertyName
                                ? `${staffRole} · ${propertyName}`
                                : staffRole}
                            </Text>
                          </div>
                        </div>
                        {/* 
                        <Button
                          type="button"
                          onClick={() => onReassignStaff(staff)}
                          title="Reassign staff work"
                          aria-label={`Reassign ${staff.fullName}`}
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-slate-400 hover:text-primary hover:bg-white shrink-0"
                        >
                          <ArrowLeftRight className="size-4" />
                        </Button> */}
                      </div>
                    </TableCell>

                    {days.map((d) => {
                      const dayShifts = getShiftsForStaffAndDay(staff.id, d.dateStr);
                      const isPastDate = d.dateStr < todayDateStr;
                      const isAddDisabled = isPastDate || isLocked;

                      if (dayShifts.length === 0) {
                        return (
                          <TableCell key={d.key} className="py-2 px-1.5 text-center">
                            <button
                              type="button"
                              disabled={isAddDisabled}
                              onClick={() => !isAddDisabled && onAddShiftBlock(staff, d)}
                              title={
                                isLocked
                                  ? "Rota is locked for this week"
                                  : isPastDate
                                    ? "Cannot create shifts on past dates"
                                    : "Click to assign shift"
                              }
                              className={cn(
                                "w-full h-13 rounded-xl flex flex-col items-center justify-center transition-colors",
                                isAddDisabled
                                  ? "bg-slate-50/50 text-slate-300 cursor-not-allowed"
                                  : "bg-white/60 hover:bg-white text-slate-400 hover:text-primary cursor-pointer",
                              )}
                            >
                              <Text as="span" size="md" weight="medium" variant="muted">
                                &mdash;
                              </Text>
                            </button>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={d.key} className="py-2 px-1.5 text-center align-top">
                          <div className="flex flex-col gap-1">
                            {dayShifts.map((shift) => {
                              const appearance = getCareBlockAppearance(
                                shift.careType,
                                getShiftAssignedResidentIds(shift).length,
                              );
                              return (
                                <button
                                  key={shift.id}
                                  type="button"
                                  onClick={() =>
                                    onSelectShift(
                                      shift,
                                      staff.fullName,
                                      `${d.dayName} ${d.dayNumber}`,
                                    )
                                  }
                                  className={cn(
                                    "w-full min-h-12 rounded-xl px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer",
                                    appearance.cellClassName,
                                  )}
                                >
                                  {appearance.isOff ? (
                                    <Text as="span" size="md" weight="medium" variant="muted">
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
                                        <Text as="span" size="md" weight="medium">
                                          {shift.durationHours ? `${shift.durationHours}h ` : ""}
                                          {appearance.shortLabel}
                                        </Text>
                                      </div>
                                      <Text as="span" size="md" variant="muted" className="truncate max-w-[85px]">
                                        {appearance.subLabel}
                                      </Text>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>

            <WeeklyRotaDailyCoverageFooter days={days} shifts={shifts} />
          </Table>
        </div>
      )}
    </Card>
  );
}
