"use client";

import React from "react";
import { ShieldCheck, Lock, UserCog, Users } from "lucide-react";
import { SummaryCardsGrid, type SummaryCardItem } from "@repo/ui/components/ui/SummaryCard";
import { RoleMember } from "../../../../../../lib/types/role";
import { StaffMember } from "../../../../../../lib/types/staff";

interface RoleStatCardsProps {
  roles?: RoleMember[];
  staff?: StaffMember[];
}

export function RoleStatCards({ roles = [], staff = [] }: RoleStatCardsProps) {
  const totalRoles = roles.length;
  const systemRoles = roles.filter((r) => r.isSystem).length;
  const customRoles = roles.filter((r) => !r.isSystem).length;
  const assignedStaffCount = staff.filter((s) => !!s.role?.name).length;

  const cards: SummaryCardItem[] = [
    {
      title: "Total Roles",
      value: String(totalRoles),
      subtitle: "Configured access roles",
      icon: <ShieldCheck className="size-5 text-emerald-800" />,
      subtitleColor: "text-slate-500",
    },
    {
      title: "System Roles",
      value: String(systemRoles),
      subtitle: "Built-in baseline profiles",
      icon: <Lock className="size-5 text-emerald-800" />,
      subtitleColor: "text-emerald-800 font-medium",
    },
    {
      title: "Custom Roles",
      value: String(customRoles),
      subtitle: "Tailored permission sets",
      icon: <UserCog className="size-5 text-blue-700" />,
      subtitleColor: "text-blue-700 font-medium",
    },
    {
      title: "Assigned Staff",
      value: String(assignedStaffCount),
      subtitle: "Mapped to active roles",
      icon: <Users className="size-5 text-amber-700" />,
      subtitleColor: "text-amber-700 font-medium",
    },
  ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
    />
  );
}
