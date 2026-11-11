"use client";

import React from "react";
import { Users, Clock, UserX, CalendarCheck2 } from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui/SummaryCard";
import { Shift, ShiftAssignment } from "../../../../../../lib/types/shifts";
import { StaffMember } from "../../../../../../lib/types/staff";

interface RotaSummaryCardsProps {
  viewMode?: "staff" | "facility";
  shifts?: Shift[];
  staffList?: StaffMember[];
}

export function RotaSummaryCards({
  viewMode = "staff",
  shifts = [],
  staffList = [],
}: RotaSummaryCardsProps) {
  // Derive stats from shift data (active / upcoming period)
  const now = new Date();
  const totalShifts = shifts.length;
  const activeShifts = shifts.filter((s) => !s.endTime || new Date(s.endTime) >= now);
  const publishedShifts = activeShifts.filter((s) => s.status === "Published").length;

  // Count unique assigned staff IDs across all shifts this week
  const assignedStaffIds = new Set<string>();
  shifts.forEach((s) => {
    (s.assignments as ShiftAssignment[] | undefined)?.forEach((a) => {
      const uid = a.user?.id;
      if (uid) assignedStaffIds.add(uid);
    });
  });

  const unassignedStaff = Math.max(0, staffList.length - assignedStaffIds.size);
  const assignedPct =
    staffList.length > 0
      ? `${Math.round((assignedStaffIds.size / staffList.length) * 100)}% on rota`
      : "0% on rota";

  const cards: SummaryCardItem[] =
    viewMode === "facility"
      ? [
          {
            title: "Total Staff",
            value: String(staffList.length),
            subtitle: "Registered members",
            icon: <Users className="size-5 text-primary" />,
            subtitleColor: "text-slate-500",
          },
          {
            title: "Published Shifts",
            value: String(publishedShifts),
            subtitle: "Active this week",
            icon: <CalendarCheck2 className="size-5 text-blue-700" />,
            subtitleColor: "text-blue-700 font-medium",
          },
          {
            title: "Assigned Staff",
            value: String(assignedStaffIds.size),
            subtitle: assignedPct,
            icon: <Clock className="size-5 text-purple-700" />,
            subtitleColor: "text-purple-700 font-medium",
          },
          {
            title: "Unassigned Staff",
            value: String(unassignedStaff),
            subtitle: "No shifts scheduled",
            icon: <UserX className="size-5 text-amber-700" />,
            subtitleColor: "text-amber-700 font-medium",
          },
        ]
      : [
          {
            title: "Total Staff",
            value: String(staffList.length),
            subtitle: "Registered members",
            icon: <Users className="size-5 text-primary" />,
            subtitleColor: "text-slate-500",
          },
          {
            title: "Total Shifts",
            value: String(totalShifts),
            subtitle: "Scheduled this period",
            icon: <Clock className="size-5 text-blue-700" />,
            subtitleColor: "text-blue-700 font-medium",
          },
          {
            title: "Staff Assigned",
            value: String(assignedStaffIds.size),
            subtitle: assignedPct,
            icon: <CalendarCheck2 className="size-5 text-purple-700" />,
            subtitleColor: "text-purple-700 font-medium",
          },
          {
            title: "Unassigned",
            value: String(unassignedStaff),
            subtitle: "No shifts assigned",
            icon: <UserX className="size-5 text-amber-700" />,
            subtitleColor: "text-amber-700 font-medium",
          },
        ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 font-sans mb-6"
    />
  );
}
