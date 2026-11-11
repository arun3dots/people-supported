"use client";

import React from "react";
import { Users, UserCheck, Clock, Award, ShieldAlert } from "lucide-react";
import { StaffMember } from "../../../../../lib/types/staff";

interface StaffStatCardsProps {
  staff?: StaffMember[];
}

export function StaffStatCards({ staff = [] }: StaffStatCardsProps) {
  const totalStaffCount = staff.length || 15;
  const onLeaveStaffCount = staff.filter((s) => s.isOnLeave).length || 1;
  const activeStaffCount = staff.filter((s) => s.isActive && !s.isOnLeave).length || 12;

  const cards = [
    {
      title: "Total Staff",
      value: totalStaffCount,
      icon: Users,
      cardBg: "bg-white border-slate-200/80",
      iconColor: "text-slate-700",
      valueColor: "text-slate-900",
    },
    {
      title: "Active Staff",
      value: activeStaffCount,
      icon: UserCheck,
      cardBg: "bg-emerald-50/70 border-emerald-200/80",
      iconColor: "text-emerald-700",
      valueColor: "text-emerald-800",
    },
    {
      title: "On Leave",
      value: onLeaveStaffCount,
      icon: Clock,
      cardBg: "bg-amber-50/70 border-amber-200/80",
      iconColor: "text-amber-700",
      valueColor: "text-amber-800",
    },
    {
      title: "In Training",
      value: 1,
      icon: Award,
      cardBg: "bg-slate-50 border-slate-200/80",
      iconColor: "text-slate-600",
      valueColor: "text-slate-900",
    },
    {
      title: "Compliance Due",
      value: 6,
      icon: ShieldAlert,
      cardBg: "bg-red-50/60 border-red-200/80",
      iconColor: "text-red-700",
      valueColor: "text-red-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 font-sans">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className={`${c.cardBg} border rounded-2xl p-4 sm:p-5 space-y-1 shadow-2xs transition-all`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`size-4 ${c.iconColor}`} />
              <span className="text-md font-bold text-slate-700">{c.title}</span>
            </div>
            <div className={`text-2xl font-extrabold ${c.valueColor}`}>{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}
