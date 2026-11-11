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
import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../../lib/types/facility";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import {
  getCareBlockAppearance,
  getShiftAssignedResidentIds,
  getShiftDateStr,
  resolveStaffLocation,
} from "./rotaDataUtils";

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
  onSelectShift: (shift: Shift, staffName: string, dayLabel: string) => void;
  onAddShiftBlock: (staff: StaffMember, day: DayColumnInfo) => void;
  onReassignStaff: (staff: StaffMember) => void;
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
  schemes = [],
  properties = [],
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
        return getShiftDateStr(s) === dayDateStr;
      }) ?? null
    );
  };

  return (
    <Card
      variant="surface"
      border="default"
      className="p-5 lg:p-6 gap-0 border-none shadow-none font-sans"
    >
      {/* Pack Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-secondary/50 mb-4">
        <div>
          <Text as="h2" size="base" weight="semibold" className="text-slate-900">
            Weekly Staff Rota &amp; Care Type Schedule
          </Text>
          <Text size="md" variant="muted">
            Click any shift block to view the people supported, medication rounds, 1:1 tasks or reassign cover.
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 shrink-0">
          {LEGEND_ITEMS.map((item) => (
            <Text
              key={item.label}
              as="span"
              size="md"
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
                        </Button>
                      </div>
                    </TableCell>

                    {days.map((d) => {
                      const shift = getShiftForStaffAndDay(staff.id, d.dateStr);

                      if (!shift) {
                        return (
                          <TableCell key={d.key} className="py-2 px-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => onAddShiftBlock(staff, d)}
                              title="Click to assign shift"
                              className="w-full h-13 rounded-xl bg-white/60 hover:bg-white text-slate-400 hover:text-primary flex flex-col items-center justify-center transition-colors cursor-pointer"
                            >
                              <Text as="span" size="md" weight="medium" variant="muted">
                                &mdash;
                              </Text>
                            </button>
                          </TableCell>
                        );
                      }

                      const appearance = getCareBlockAppearance(
                        shift.careType,
                        getShiftAssignedResidentIds(shift).length,
                      );

                      return (
                        <TableCell key={d.key} className="py-2 px-1.5 text-center">
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
                              "w-full h-13 rounded-xl px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer",
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
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
