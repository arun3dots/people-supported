"use client";

import React from "react";
import { CalendarPlus, Clock, Home, ShieldCheck, Users } from "lucide-react";
import { Badge, Button } from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../../lib/components/shared";
import type { StaffMember } from "../../../../../../lib/types/staff";
import type { StaffAllocationRow } from "./StaffAllocationTable";

interface StaffAllocationCardGridProps {
  rows: StaffAllocationRow[];
  onReassignStaff: (staff: StaffMember) => void;
}

export function StaffAllocationCardGrid({
  rows,
  onReassignStaff,
}: StaffAllocationCardGridProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {rows.map((row, idx) => {
        const initials = row.fullName
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

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

        const statusState =
          row.availability === "On Leave" || overtimeHours > 0
            ? "warning"
            : row.availability === "Inactive"
              ? "inactive"
              : "success";

        return (
          <EntityCard
            key={row.id}
            showRightDivider={idx % 3 !== 2 && idx !== rows.length - 1}
            avatar={
              <div className="size-11 rounded-full bg-surface-primary-light text-primary flex items-center justify-center font-medium text-md shrink-0">
                {initials}
              </div>
            }
            title={row.fullName}
            subtitle={row.roleName}
            headerBadge={
              <Badge variant="secondary" state="info">
                {row.scheduledShiftsCount} shifts · {row.scheduledHours}h
              </Badge>
            }
            meta={[
              {
                icon: <Home className="size-4 text-primary" />,
                label: "Allocated Properties",
                value:
                  row.allocatedPropertyNames.length > 0
                    ? row.allocatedPropertyNames.join(", ")
                    : "Unassigned",
              },
              {
                icon: <Clock className="size-4 text-primary" />,
                label: "Weekly Utilization",
                value: `${row.scheduledHours}h / ${row.contractedHoursPerWeek}h (${row.utilizationPercent}%)`,
              },
              {
                icon: <Users className="size-4 text-primary" />,
                label: "People Supported",
                value: `${row.assignedResidentsCount} assigned`,
              },
              {
                icon: <ShieldCheck className="size-4 text-primary" />,
                label: "Capacity",
                value: capacityLabel,
              },
            ]}
            statusText={capacityLabel}
            statusState={statusState}
            actions={
              row.staffMember ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReassignStaff(row.staffMember!);
                  }}
                  className="h-8 rounded-lg bg-surface-primary-light hover:bg-emerald-100/70 text-primary gap-1.5 text-md font-medium"
                >
                  <CalendarPlus className="size-3.5" /> Assign
                </Button>
              ) : null
            }
          />
        );
      })}
    </div>
  );
}
