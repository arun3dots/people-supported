"use client";

import React from "react";
import { ArrowRightLeft, Building2, Home, ShieldCheck } from "lucide-react";
import { Badge, Button } from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../../lib/components/shared";
import type { StaffMember } from "../../../../../../lib/types/staff";

interface StaffAllocationCardGridProps {
  staffList: StaffMember[];
  onReassignStaff: (staff: StaffMember) => void;
}

export function StaffAllocationCardGrid({
  staffList,
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
        const schemeName =
          member.scheme?.name || "North Yorkshire Supported Living";
        const propName = member.property?.name || "Oak House";
        const isNight = member.role?.name?.toLowerCase().includes("night");

        return (
          <EntityCard
            key={member.id}
            showRightDivider={idx % 3 !== 2 && idx !== staffList.length - 1}
            avatar={
              <div className="size-11 rounded-full bg-surface-primary-light text-primary flex items-center justify-center font-medium text-sm shrink-0">
                {initials}
              </div>
            }
            title={member.fullName}
            subtitle={`STA-${member.id.slice(0, 3).toUpperCase()} · ${member.role?.name || "Support Worker"}`}
            headerBadge={
              <Badge
                variant="secondary"
                state={isNight ? "warning" : "info"}
                className="border"
              >
                {isNight ? "Night Cover" : "Primary"}
              </Badge>
            }
            meta={[
              {
                icon: <Building2 className="size-4 text-primary" />,
                label: "Scheme",
                value: schemeName,
              },
              {
                icon: <Home className="size-4 text-primary" />,
                label: "Property",
                value: propName,
              },
              {
                icon: <ShieldCheck className="size-4 text-primary" />,
                label: "Availability",
                value: "Available",
              },
            ]}
            statusText="Active"
            statusState="success"
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReassignStaff(member);
                }}
                className="h-8 rounded-lg gap-1.5 text-xs font-medium"
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
