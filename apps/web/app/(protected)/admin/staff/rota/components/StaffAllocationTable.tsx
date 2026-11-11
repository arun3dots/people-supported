"use client";

import React from "react";
import { ArrowRightLeft, Building2, Home } from "lucide-react";
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
import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../../lib/types/facility";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { resolveStaffLocation } from "./rotaDataUtils";

interface StaffAllocationTableProps {
  filteredStaff: StaffMember[];
  schemes: SchemeItem[];
  properties: PropertyItem[];
  totalStaffCount: number;
  onReassignStaff: (staff: StaffMember) => void;
}

export function StaffAllocationTable({
  filteredStaff,
  schemes,
  properties,
  totalStaffCount,
  onReassignStaff,
}: StaffAllocationTableProps): React.JSX.Element {
  return (
    <Card
      variant="surface"
      border="default"
      className="p-5 lg:p-6 gap-0 border-none shadow-none"
    >
      <div className="pb-4 border-b border-border-secondary/50 mb-4">
        <Text as="h2" size="md" weight="semibold" className="text-slate-900">
          Staff Allocation ({filteredStaff.length} shown of {totalStaffCount})
        </Text>
        <Text size="sm" variant="muted">
          Manage primary, secondary and night cover allocations across homes
        </Text>
      </div>

      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border-secondary/50">
              <TableHead className="pl-3 font-medium text-slate-500">#</TableHead>
              <TableHead className="font-medium text-slate-500">
                Staff Member
              </TableHead>
              <TableHead className="font-medium text-slate-500">Role</TableHead>
              <TableHead className="font-medium text-slate-500">Scheme</TableHead>
              <TableHead className="font-medium text-slate-500">Property</TableHead>
              <TableHead className="font-medium text-slate-500">
                Assignment Type
              </TableHead>
              <TableHead className="font-medium text-slate-500">
                Availability
              </TableHead>
              <TableHead className="text-center font-medium text-slate-500">
                Status
              </TableHead>
              <TableHead className="pr-3 text-right font-medium text-slate-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredStaff.map((m, idx) => {
              const initials = m.fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const { schemeName, propertyName } = resolveStaffLocation(
                m,
                schemes,
                properties,
              );
              const isNight = m.role?.name?.toLowerCase().includes("night");
              const assignmentLabel = isNight
                ? "Night Cover"
                : m.contractType ||
                  (schemeName || propertyName ? "Assigned" : "Unassigned");
              const availabilityLabel = !m.isActive
                ? "Inactive"
                : m.isOnLeave
                  ? "On Leave"
                  : "Available";

              return (
                <TableRow
                  key={m.id}
                  className="border-b border-border-secondary/40 hover:bg-white/50"
                >
                  <TableCell className="pl-3 text-slate-500">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-surface-primary-light text-primary font-medium text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <Text size="sm" weight="medium" className="text-slate-900">
                          {m.fullName}
                        </Text>
                        <Text size="xs" variant="muted">
                          {m.email}
                        </Text>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      state={isNight ? "warning" : "success"}
                    >
                      {m.role?.name || "Staff"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 max-w-[180px] text-slate-700">
                      <Building2 className="size-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{schemeName || "Unassigned"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 max-w-[140px] text-slate-700">
                      <Home className="size-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{propertyName || "Unassigned"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" state="inactive">
                      {assignmentLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Text
                      as="span"
                      size="sm"
                      weight="medium"
                      variant={
                        availabilityLabel === "Available" ? "primary" : "muted"
                      }
                      className="inline-flex items-center gap-1.5"
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          availabilityLabel === "Available"
                            ? "bg-primary"
                            : availabilityLabel === "On Leave"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                        }`}
                      />
                      {availabilityLabel}
                    </Text>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      state={m.isActive ? "success" : "inactive"}
                    >
                      {m.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReassignStaff(m)}
                      className="h-9 px-3 rounded-lg text-slate-600 hover:bg-white hover:text-primary font-medium"
                    >
                      <ArrowRightLeft className="size-3.5" /> Reassign
                    </Button>
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
