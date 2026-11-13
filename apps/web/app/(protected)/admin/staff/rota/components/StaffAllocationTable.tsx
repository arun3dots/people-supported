"use client";

import React from "react";
import { CalendarPlus, Home, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import type { StaffAllocationItemDTO } from "@repo/schema";
import type { StaffMember } from "../../../../../../lib/types/staff";

export interface StaffAllocationRow extends StaffAllocationItemDTO {
  staffMember?: StaffMember;
}

interface StaffAllocationTableProps {
  rows: StaffAllocationRow[];
  totalStaffCount: number;
  onReassignStaff: (staff: StaffMember) => void;
}

export function StaffAllocationTable({
  rows,
  totalStaffCount,
  onReassignStaff,
}: StaffAllocationTableProps): React.JSX.Element {
  return (
    <Card
      variant="surface"
      border="default"
      className="p-5 lg:p-6 gap-0 border-none shadow-none"
    >
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border-secondary/50">
              <TableHead className="pl-3 font-medium text-slate-500">#</TableHead>
              <TableHead className="font-medium text-slate-500">Staff Member</TableHead>
              <TableHead className="font-medium text-slate-500">Allocated Properties</TableHead>
              <TableHead className="text-center font-medium text-slate-500">Shifts</TableHead>
              <TableHead className="font-medium text-slate-500">Care Mix</TableHead>
              <TableHead className="font-medium text-slate-500">Hours &amp; Utilization</TableHead>
              <TableHead className="text-center font-medium text-slate-500">People Supported</TableHead>
              <TableHead className="font-medium text-slate-500">Capacity</TableHead>
              <TableHead className="pr-3 text-right font-medium text-slate-500">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row, idx) => {
              const initials = row.fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              const mixParts = [
                row.careMix.sharedHours > 0 ? `Shared ${row.careMix.sharedHours}h` : null,
                row.careMix.oneToOneHours > 0 ? `1:1 ${row.careMix.oneToOneHours}h` : null,
                row.careMix.twoToOneHours > 0 ? `2:1 ${row.careMix.twoToOneHours}h` : null,
                row.careMix.sleepInHours > 0 ? `Sleep ${row.careMix.sleepInHours}h` : null,
                row.careMix.wakingNightHours > 0 ? `Night ${row.careMix.wakingNightHours}h` : null,
              ].filter((p): p is string => Boolean(p));

              const utilBarWidth = Math.min(100, row.utilizationPercent);
              const utilColor =
                row.utilizationPercent > 100
                  ? "bg-rose-500"
                  : row.utilizationPercent >= 80
                    ? "bg-amber-500"
                    : "bg-primary";

              return (
                <TableRow
                  key={row.id}
                  className="border-b border-border-secondary/40 hover:bg-white/50"
                >
                  <TableCell className="pl-3 text-slate-500">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-surface-primary-light text-primary font-medium text-md flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <Text size="md" weight="medium" className="text-slate-900">
                          {row.fullName}
                        </Text>
                        <Text size="xs" variant="muted">
                          {row.roleName}
                        </Text>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 max-w-[200px] text-slate-700">
                      <Home className="size-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {row.allocatedPropertyNames.length > 0
                          ? row.allocatedPropertyNames.join(", ")
                          : "Unassigned"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium text-slate-800">
                    {row.scheduledShiftsCount}
                  </TableCell>
                  <TableCell>
                    {mixParts.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {mixParts.map((part) => (
                          <Badge key={part} variant="secondary" state="inactive" className="text-xs font-normal">
                            {part}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Text size="xs" variant="muted">No shifts scheduled</Text>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[140px] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">
                          {row.scheduledHours}h
                        </span>
                        <span className="text-slate-500">
                          / {row.contractedHoursPerWeek}h ({row.utilizationPercent}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${utilColor}`}
                          style={{ width: `${utilBarWidth}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                      <Users className="size-3.5 text-slate-400" />
                      {row.assignedResidentsCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const remainingHours = Math.max(
                        0,
                        Math.round((row.contractedHoursPerWeek - row.scheduledHours) * 10) / 10,
                      );
                      const overtimeHours = Math.max(
                        0,
                        Math.round((row.scheduledHours - row.contractedHoursPerWeek) * 10) / 10,
                      );

                      const capacityLabel =
                        row.availability === "On Leave"
                          ? "On Leave"
                          : row.availability === "Inactive"
                            ? "Inactive"
                            : overtimeHours > 0
                              ? `Overbooked (+${overtimeHours}h)`
                              : remainingHours === 0
                                ? "Fully Booked"
                                : `${remainingHours}h left`;

                      const capacityState =
                        row.availability === "On Leave" || overtimeHours > 0
                          ? "warning"
                          : row.availability === "Inactive"
                            ? "inactive"
                            : remainingHours === 0
                              ? "info"
                              : "success";

                      return (
                        <Badge variant="secondary" state={capacityState}>
                          {capacityLabel}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="pr-3 text-right">
                    {row.staffMember && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReassignStaff(row.staffMember!)}
                        className="h-9 px-3 rounded-lg text-slate-600 hover:bg-white hover:text-primary font-medium"
                      >
                        <CalendarPlus className="size-3.5" /> Assign
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
