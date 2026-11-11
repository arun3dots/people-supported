"use client";

import React from "react";
import { Activity, ShieldCheck, UserCheck, AlertTriangle } from "lucide-react";
import { SummaryCardsGrid, type SummaryCardItem } from "@repo/ui/components/ui/SummaryCard";
import type { AuditLog } from "../../../../../lib/queries/audit/useGetAuditLogsQuery";

interface AuditLogStatCardsProps {
  logs?: AuditLog[];
}

export function AuditLogStatCards({ logs = [] }: AuditLogStatCardsProps) {
  const totalEvents = logs.length;
  const loginEvents = logs.filter(
    (l) => l.actionType === "LOGIN" || l.actionType === "LOGOUT"
  ).length;
  const mutationEvents = logs.filter((l) =>
    ["CREATE", "UPDATE", "DELETE"].includes(l.actionType)
  ).length;
  const uniqueUsersCount = new Set(
    logs.map((l) => l.user?.id || l.userId).filter(Boolean)
  ).size;

  const cards: SummaryCardItem[] = [
    {
      title: "Total Audit Events",
      value: String(totalEvents),
      subtitle: "Recorded in system",
      icon: <Activity className="size-5 text-emerald-800" />,
      subtitleColor: "text-slate-500",
    },
    {
      title: "Active Actors",
      value: String(uniqueUsersCount),
      subtitle: "Distinct users logged",
      icon: <UserCheck className="size-5 text-emerald-800" />,
      subtitleColor: "text-emerald-800 font-medium",
    },
    {
      title: "Data Mutations",
      value: String(mutationEvents),
      subtitle: "Create, update, delete actions",
      icon: <ShieldCheck className="size-5 text-blue-700" />,
      subtitleColor: "text-blue-700 font-medium",
    },
    {
      title: "Auth / Session Events",
      value: String(loginEvents),
      subtitle: "Login & logout records",
      icon: <AlertTriangle className="size-5 text-amber-700" />,
      subtitleColor: "text-amber-700 font-medium",
    },
  ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 font-sans"
    />
  );
}
