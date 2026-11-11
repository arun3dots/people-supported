"use client";

import React from "react";
import { Users, UserCheck, Clock, ShieldAlert } from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui/SummaryCard";
import type { StaffMember } from "../../../../../lib/types/staff";

interface StaffStatCardsProps {
  staff?: StaffMember[];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function StaffStatCards({ staff = [] }: StaffStatCardsProps) {
  const totalStaffCount = staff.length;
  const onLeaveStaffCount = staff.filter((s) => s.isOnLeave).length;
  const activeStaffCount = staff.filter((s) => s.isActive && !s.isOnLeave).length;

  const nowMs = Date.now();
  const dbsDueCount = staff.filter((s) => {
    if (!s.dbsExpiryDate) return false;
    const expiryMs = new Date(s.dbsExpiryDate).getTime();
    if (!Number.isFinite(expiryMs)) return false;
    return (expiryMs - nowMs) / MS_PER_DAY <= 30;
  }).length;

  const activeShareText =
    totalStaffCount > 0
      ? `${Math.round((activeStaffCount / totalStaffCount) * 100)}% of workforce`
      : "No active staff yet";

  const cards: SummaryCardItem[] = [
    {
      title: "Total Staff",
      value: totalStaffCount,
      subtitle: "Registered staff members",
      icon: <Users className="size-5 text-primary" />,
      iconClassName: "bg-surface-primary-light",
    },
    {
      title: "Active Staff",
      value: activeStaffCount,
      subtitle: activeShareText,
      subtitleColor:
        activeStaffCount > 0 ? "text-emerald-700 font-medium" : "text-slate-500",
      icon: <UserCheck className="size-5 text-emerald-700" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "On Leave",
      value: onLeaveStaffCount,
      subtitle:
        onLeaveStaffCount > 0
          ? "Currently on approved leave"
          : "No staff on leave",
      subtitleColor:
        onLeaveStaffCount > 0 ? "text-amber-700 font-medium" : "text-slate-500",
      icon: <Clock className="size-5 text-amber-600" />,
      iconClassName: "bg-amber-50",
    },
    {
      title: "DBS Renewal Due",
      value: dbsDueCount,
      subtitle:
        totalStaffCount === 0
          ? "No staff records yet"
          : dbsDueCount > 0
            ? "Expired or due within 30 days"
            : "All recorded DBS checks valid",
      subtitleColor:
        dbsDueCount > 0 ? "text-rose-700 font-medium" : "text-slate-500",
      icon: (
        <ShieldAlert
          className={dbsDueCount > 0 ? "size-5 text-rose-600" : "size-5 text-slate-600"}
        />
      ),
      iconClassName: dbsDueCount > 0 ? "bg-rose-50" : "bg-slate-100",
    },
  ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 font-sans"
    />
  );
}
