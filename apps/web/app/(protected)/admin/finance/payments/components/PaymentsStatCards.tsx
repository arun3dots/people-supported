"use client";

import React from "react";
import { CreditCard, CheckCircle2, Clock, Landmark } from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui/SummaryCard";
import type { PaymentHistoryResponse, FinanceStatsResponse } from "../../../../../../lib/queries/finance/types";

interface PaymentsStatCardsProps {
  payments?: PaymentHistoryResponse[];
  stats?: FinanceStatsResponse;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function PaymentsStatCards({
  payments = [],
  stats,
}: PaymentsStatCardsProps) {
  const totalCollected = stats?.totalCollected ?? payments.reduce((sum, p) => sum + p.amountPaid, 0);

  const cards: SummaryCardItem[] = [
    {
      title: "Total Collected",
      value: formatCurrency(totalCollected),
      subtitle: "Settled revenue",
      icon: <CheckCircle2 className="size-5 text-emerald-800" />,
      subtitleColor: "text-emerald-800 font-medium",
    },
    {
      title: "Transactions Recorded",
      value: String(payments.length),
      subtitle: "Total transactions to date",
      icon: <CreditCard className="size-5 text-emerald-800" />,
      subtitleColor: "text-slate-500",
    },
    {
      title: "Outstanding Balance",
      value: formatCurrency(stats?.totalOutstanding ?? 0),
      subtitle: "Pending fee collection",
      icon: <Clock className="size-5 text-amber-700" />,
      subtitleColor: "text-amber-700 font-medium",
    },
    {
      title: "Total Invoiced Volume",
      value: formatCurrency(stats?.totalInvoiced ?? 0),
      subtitle: "Across all billing cycles",
      icon: <Landmark className="size-5 text-blue-700" />,
      subtitleColor: "text-blue-700 font-medium",
    },
  ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 font-sans"
    />
  );
}
