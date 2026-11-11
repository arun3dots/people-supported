"use client";

import React, { useMemo } from "react";
import type { ExpenseItem } from "./types";
import { BadgeState, TableColumn } from "../../../../../../lib/components/shared/tableColumns";


export function getExpenseStatusBadgeState(status?: string): BadgeState {
  if (status === "Paid") {
    return "success";
  }
  if (status === "Approved") {
    return "info";
  }
  if (status === "Draft") {
    return "inactive";
  }
  return "warning";
}

export function getExpenseStatusLabel(status?: string): string {
  if (status === "Paid" || status === "Approved" || status === "Draft") {
    return status;
  }
  return status || "Pending";
}

export function useExpenseColumns(): TableColumn<ExpenseItem>[] {
  return useMemo(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        kind: "reference",
        id: "expenseNo",
        accessorKey: "expenseNo",
        header: "Expense No.",
      },
      {
        kind: "badge",
        id: "category",
        accessorKey: "category",
        header: "Category",
        state: "info",
      },
      {
        kind: "text",
        id: "vendor",
        accessorKey: "vendor",
        header: "Vendor / Supplier",
        tone: "default",
        truncate: true,
      },
      {
        kind: "text",
        id: "description",
        accessorKey: "description",
        header: "Description",
        tone: "clamped",
      },
      {
        kind: "date",
        id: "date",
        accessorKey: "date",
        header: "Date",
      },
      {
        kind: "currency",
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        currencyCode: "GBP",
      },
      {
        kind: "badge",
        id: "status",
        accessorKey: "status",
        header: "Status",
        getState: (row) => getExpenseStatusBadgeState(row.status),
        getLabel: (row) => getExpenseStatusLabel(row.status),
      },
    ],
    []
  );
}
