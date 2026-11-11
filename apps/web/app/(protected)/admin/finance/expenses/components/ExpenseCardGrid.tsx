"use client";

import React from "react";
import { format } from "date-fns";
import { Receipt, Calendar, CreditCard } from "lucide-react";
import { Badge, Avatar, AvatarFallback } from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../../lib/components/shared";
import type { ExpenseItem } from "./types";
import {
  getExpenseStatusBadgeState,
  getExpenseStatusLabel,
} from "./useExpenseColumns";

function formatDateLabel(dateStr?: string | Date): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export interface ExpenseCardProps {
  expense: ExpenseItem;
  showRightDivider?: boolean;
}

export function ExpenseCard({
  expense,
  showRightDivider = false,
}: ExpenseCardProps) {
  const vendorName = expense.vendor || "Unknown Supplier";
  const initial = vendorName.charAt(0).toUpperCase();
  const state = getExpenseStatusBadgeState(expense.status);
  const label = getExpenseStatusLabel(expense.status);

  return (
    <EntityCard
      showRightDivider={showRightDivider}
      avatar={
        <Avatar size="sm" className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light">
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-base">
            {initial}
          </AvatarFallback>
        </Avatar>
      }
      title={vendorName}
      subtitle={expense.expenseNo || "Expense Record"}
      headerBadge={
        <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">
          {expense.category || "—"}
        </Badge>
      }
      meta={[
        {
          icon: <Receipt className="size-4 text-emerald-800 shrink-0" />,
          label: "Expense No.",
          value: expense.expenseNo || "—",
        },
        {
          icon: <Calendar className="size-4 text-emerald-800 shrink-0" />,
          label: "Date",
          value: formatDateLabel(expense.date),
        },
        {
          icon: <CreditCard className="size-4 text-emerald-800 shrink-0" />,
          label: "Amount",
          value: formatCurrency(expense.amount),
        },
      ]}
      statusBadge={
        <Badge variant="secondary" state={state} className="px-2.5 py-0.5 shadow-none">
          {label}
        </Badge>
      }
    >
      {expense.description ? (
        <div className="text-md text-slate-600 leading-relaxed line-clamp-2">
          {expense.description}
        </div>
      ) : null}
    </EntityCard>
  );
}

export interface ExpenseCardGridProps {
  expenses?: ExpenseItem[];
  paginatedExpenses: ExpenseItem[];
  isLoading: boolean;
}

export function ExpenseCardGrid({
  paginatedExpenses,
}: ExpenseCardGridProps) {
  if (!paginatedExpenses || paginatedExpenses.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {paginatedExpenses.map((expense, idx) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          showRightDivider={
            idx % 3 !== 2 && idx !== paginatedExpenses.length - 1
          }
        />
      ))}
    </div>
  );
}
