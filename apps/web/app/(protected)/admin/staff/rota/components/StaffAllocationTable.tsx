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
import type { StaffMember } from "../../../../../../lib/types/staff";

interface StaffAllocationTableProps {
  filteredStaff: StaffMember[];
  totalStaffCount: number;
  onReassignStaff: (staff: StaffMember) => void;
}

export function StaffAllocationTable({
  filteredStaff,
  totalStaffCount,
  onReassignStaff,
}: StaffAllocationTableProps): React.JSX.Element {
  return (
    <Card variant="white" border="secondary" className="gap-0 overflow-hidden p-0">
      <div className="p-5 border-b border-slate-100">
        <Text as="h2" size="md" weight="semibold" className="text-slate-900">
          Staff Allocation ({filteredStaff.length} shown of {totalStaffCount})
        </Text>
        <Text size="sm" variant="muted">
          Manage primary, secondary and night cover allocations across homes
        </Text>
      </div>

      <Table>
        <TableHeader className="bg-surface-card-grey/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 font-medium text-slate-600">#</TableHead>
            <TableHead className="font-medium text-slate-600">
              Staff Member
            </TableHead>
            <TableHead className="font-medium text-slate-600">Role</TableHead>
            <TableHead className="font-medium text-slate-600">Scheme</TableHead>
            <TableHead className="font-medium text-slate-600">Property</TableHead>
            <TableHead className="font-medium text-slate-600">
              Assignment Type
            </TableHead>
            <TableHead className="font-medium text-slate-600">
              Availability
            </TableHead>
            <TableHead className="text-center font-medium text-slate-600">
              Status
            </TableHead>
            <TableHead className="pr-5 text-right font-medium text-slate-600">
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
            const schemeName =
              m.scheme?.name || "North Yorkshire Supported Living";
            const propName = m.property?.name || "Oak House";
            const isNight = m.role?.name?.toLowerCase().includes("night");

            return (
              <TableRow key={m.id}>
                <TableCell className="pl-5 text-slate-500">{idx + 1}</TableCell>
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
                        STA-{m.id.slice(0, 3).toUpperCase()}
                      </Text>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    state={isNight ? "warning" : "success"}
                    className="border"
                  >
                    {m.role?.name || "Support Worker"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 max-w-[180px] text-slate-700">
                    <Building2 className="size-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{schemeName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 max-w-[140px] text-slate-700">
                    <Home className="size-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{propName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" state="inactive" className="border">
                    {isNight ? "Night Cover" : "Primary"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Text
                    as="span"
                    size="sm"
                    weight="medium"
                    variant="primary"
                    className="inline-flex items-center gap-1.5"
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    Available
                  </Text>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" state="success" className="border">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReassignStaff(m)}
                    className="h-9 px-3 text-slate-600 hover:text-primary font-medium"
                  >
                    <ArrowRightLeft className="size-3.5" /> Reassign
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
