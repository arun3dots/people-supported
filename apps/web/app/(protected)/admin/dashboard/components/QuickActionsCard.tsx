"use client";

import React from "react";
import Link from "next/link";
import { UserPlus, PlusCircle, FileText, CalendarPlus, ChevronRight } from "lucide-react";
import { Card, Text } from "@repo/ui/components/ui";

export function QuickActionsCard() {
  const actions = [
    {
      title: "Admit Resident",
      url: "/admin/residents/admit",
      icon: UserPlus,
    },
    {
      title: "Report Incident",
      url: "/admin/incidents/record",
      icon: PlusCircle,
    },
    {
      title: "Audit Log",
      url: "/admin/audit-log",
      icon: FileText,
    },
    {
      title: "Add Shift",
      url: "/admin/staff/rota",
      icon: CalendarPlus,
    },
  ];

  return (
    <Card
      variant="surface"
      border="default"
      className="w-full h-full min-h-[285px] justify-between p-5 rounded-2xl duration-300 hover:shadow-sm"
    >
      {/* Header (Frame 195) */}
      <div className="flex items-center justify-between w-full h-[18px]">
        <Text as="h3" size="md" weight="medium" className="leading-tight">
          Quick Actions
        </Text>
      </div>

      {/* Actions List (Frame 318) */}
      <div className="flex flex-col gap-2.5 w-full mt-auto">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.url}
              className="flex items-center justify-between w-full h-12 px-3 rounded-xl bg-[#F5F8F7] hover:bg-[#EAEFEF] transition-all duration-200 hover:translate-x-1 group"
            >
              <div className="flex items-center gap-[10px]">
                {/* Circle Icon Badge */}
                <div className="w-[32px] h-[32px] rounded-full bg-white flex items-center justify-center text-[#4A706A] shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <Icon className="w-[16px] h-[16px]" />
                </div>
                {/* Label */}
                <Text size="md" weight="medium" className="text-slate-800">
                  {action.title}
                </Text>
              </div>
              <ChevronRight className="w-[16px] h-[16px] text-[#4A706A] group-hover:translate-x-1 transition-transform duration-200 shrink-0" />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
