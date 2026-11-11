"use client";

import React from "react";
import { FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui";
import type { FinanceStatsResponse } from "../../../../../lib/queries/finance/types";

interface FinanceStatCardsProps {
  stats?: FinanceStatsResponse;
  isLoading?: boolean;
}

function formatCurrency(val?: number): string {
  if (val === undefined || val === null) return "£0.00";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(val);
}

export function FinanceStatCards({ stats, isLoading }: FinanceStatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full font-sans">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 lg:h-32 rounded-2xl bg-surface-card-grey border border-slate-200/80 p-4 shadow-none animate-pulse"
          />
        ))}
      </div>
    );
  }

  const cards: SummaryCardItem[] = [
    {
      title: "Total Invoiced",
      value: formatCurrency(stats?.totalInvoiced),
      subtitle: `${stats?.invoicesCount ?? 0} invoices issued`,
      icon: <FileText className="size-5 text-emerald-800" />,
      subtitleColor: "text-slate-500 font-medium",
    },
    {
      title: "Total Collected",
      value: formatCurrency(stats?.totalCollected),
      subtitle: "Paid to date",
      icon: <CheckCircle2 className="size-5 text-emerald-800" />,
      subtitleColor: "text-emerald-800 font-medium",
    },
    {
      title: "Total Outstanding",
      value: formatCurrency(stats?.totalOutstanding),
      subtitle: "Awaiting settlement",
      icon: <Clock className="size-5 text-blue-700" />,
      subtitleColor: "text-blue-700 font-medium",
    },
    {
      title: "Overdue Invoices",
      value: formatCurrency(stats?.overdueAmount),
      subtitle: `${stats?.overdueCount ?? 0} overdue invoices`,
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
