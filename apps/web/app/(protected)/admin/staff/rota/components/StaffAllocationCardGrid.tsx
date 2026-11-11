"use client";

import React from "react";
import { ArrowRightLeft, Building2, Home, ShieldCheck } from "lucide-react";
import { Badge, Button } from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../../lib/components/shared";
import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../../lib/types/facility";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { resolveStaffLocation } from "./rotaDataUtils";

interface StaffAllocationCardGridProps {
  staffList: StaffMember[];
  schemes: SchemeItem[];
  properties: PropertyItem[];
  onReassignStaff: (staff: StaffMember) => void;
}

export function StaffAllocationCardGrid({
  staffList,
  schemes,
  properties,
  onReassignStaff,
}: StaffAllocationCardGridProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {staffList.map((member, idx) => {
        const initials = member.fullName
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        const { schemeName, propertyName } = resolveStaffLocation(
          member,
          schemes,
          properties,
        );
        const isNight = member.role?.name?.toLowerCase().includes("night");
        const assignmentLabel = isNight
          ? "Night Cover"
          : member.contractType ||
            (schemeName || propertyName ? "Assigned" : "Unassigned");
        const availabilityLabel = !member.isActive
          ? "Inactive"
          : member.isOnLeave
            ? "On Leave"
            : "Available";

        return (
          <EntityCard
            key={member.id}
            showRightDivider={idx % 3 !== 2 && idx !== staffList.length - 1}
            avatar={
              <div className="size-11 rounded-full bg-surface-primary-light text-primary flex items-center justify-center font-medium text-md shrink-0">
                {initials}
              </div>
            }
            title={member.fullName}
            subtitle={`${member.role?.name || "Staff"} · ${member.email}`}
            headerBadge={
              <Badge
                variant="secondary"
                state={isNight ? "warning" : "info"}
              >
                {assignmentLabel}
              </Badge>
            }
            meta={[
              {
                icon: <Building2 className="size-4 text-primary" />,
                label: "Scheme",
                value: schemeName || "Unassigned",
              },
              {
                icon: <Home className="size-4 text-primary" />,
                label: "Property",
                value: propertyName || "Unassigned",
              },
              {
                icon: <ShieldCheck className="size-4 text-primary" />,
                label: "Availability",
                value: availabilityLabel,
              },
            ]}
            statusText={member.isActive ? "Active" : "Inactive"}
            statusState={member.isActive ? "success" : "inactive"}
            actions={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReassignStaff(member);
                }}
                className="h-8 rounded-lg bg-surface-primary-light hover:bg-emerald-100/70 text-primary gap-1.5 text-md font-medium"
              >
                <ArrowRightLeft className="size-3.5" />
                Reassign
              </Button>
            }
          />
        );
      })}
    </div>
  );
}
