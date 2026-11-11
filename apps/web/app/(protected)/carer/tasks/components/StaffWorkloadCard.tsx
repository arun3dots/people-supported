"use client";

import React from "react";
import { Card, Text, Badge } from "@repo/ui/components/ui";
import { StaffMember } from "../../../../../lib/types/staff";

interface StaffWorkloadCardProps {
  staff: StaffMember;
  loadCount: number;
  maxLoad: number;
  keyWorkerResidents: string[];
}

export function StaffWorkloadCard({
  staff,
  loadCount,
  maxLoad,
  keyWorkerResidents,
}: StaffWorkloadCardProps) {
  const roleName = staff.role?.name || "Care Staff";
  const unitName =
    staff.assignedWings && staff.assignedWings.length > 0
      ? staff.assignedWings[0]?.name
      : "General Unit";

  const pct = maxLoad > 0 ? Math.min(100, Math.round((loadCount / maxLoad) * 100)) : 0;
  const isHighLoad = loadCount > 6 && loadCount >= maxLoad * 0.8;

  return (
    <Card variant="surface" className="p-4 gap-3">
      {/* Header with Name, Role/Unit and Workload Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <Text as="h3" size="md" weight="bold" className="text-text-heading">
            {staff.fullName}
          </Text>
          <Text size="md" variant="muted">
            {roleName} · {unitName}
          </Text>
        </div>
        <Badge state={isHighLoad ? "warning" : "success"}>
          {loadCount} task(s)
        </Badge>
      </div>

      {/* Tags row: Key worker, Certifications / Training, Contract */}
      <div className="flex flex-wrap items-center gap-1.5">
        {keyWorkerResidents.length > 0 && (
          <Badge state="info">
            Key worker: {keyWorkerResidents.join(", ")}
          </Badge>
        )}
        <Badge state="inactive">
          {staff.department || "Permanent"}
        </Badge>
        {staff.certifications && staff.certifications.length > 0 ? (
          staff.certifications.slice(0, 2).map((cert) => (
            <Badge
              key={cert.id}
              state={cert.status === "Expired" ? "danger" : "info"}
            >
              {cert.name}
            </Badge>
          ))
        ) : (
          <Badge state="info">Moving & Handling</Badge>
        )}
      </div>

      {/* Workload Progress Bar */}
      <div className="space-y-1 pt-1">
        <div className="w-full bg-border-secondary/30 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isHighLoad ? "bg-amber-500" : "bg-primary"
              }`}
            style={{ width: `${Math.max(5, pct)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
