"use client";

import React from "react";
import { Receipt, Activity, Building, Users } from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui/SummaryCard";
import type { ExpenseResponse } from "../../../../../../lib/queries/finance/types";

interface ExpensesStatCardsProps {
  expenses?: ExpenseResponse[];
  totalExpenses?: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ExpensesStatCards({
  expenses = [],
  totalExpenses,
}: ExpensesStatCardsProps) {
  const calculatedTotal =
    totalExpenses !== undefined
      ? totalExpenses
      : expenses.reduce((sum, e) => sum + e.amount, 0);

  const medicalSpend = expenses
    .filter((e) => e.category === "Medical Supplies")
    .reduce((sum, e) => sum + e.amount, 0);

  const facilitySpend = expenses
    .filter(
      (e) => e.category === "Utilities" || e.category === "Maintenance"
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const staffingSpend = expenses
    .filter((e) => e.category === "Staffing & Agency")
    .reduce((sum, e) => sum + e.amount, 0);

  const cards: SummaryCardItem[] = [
    {
      title: "Total Operating Costs",
      value: formatCurrency(calculatedTotal),
      subtitle: "Recorded operational expenses",
      icon: <Receipt className="size-5 text-emerald-800" />,
      subtitleColor: "text-slate-500",
    },
    {
      title: "Care & Medical Supplies",
      value: formatCurrency(medicalSpend),
      subtitle: "Clinical & PPE expenditure",
      icon: <Activity className="size-5 text-emerald-800" />,
      subtitleColor: "text-emerald-800 font-medium",
    },
    {
      title: "Utilities & Facility",
      value: formatCurrency(facilitySpend),
      subtitle: "Facility & energy operations",
      icon: <Building className="size-5 text-blue-700" />,
      subtitleColor: "text-blue-700 font-medium",
    },
    {
      title: "Staffing & Agency",
      value: formatCurrency(staffingSpend),
      subtitle: "Agency & temporary staffing",
      icon: <Users className="size-5 text-amber-700" />,
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
