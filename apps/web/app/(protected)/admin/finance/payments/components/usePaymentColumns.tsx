"use client";

import React, { useMemo } from "react";
import type { PaymentItem } from "./types";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../../lib/components/shared/tableColumns";

export function getPaymentStatusBadgeState(
  invoiceStatus?: string,
  paymentStatus?: string,
): BadgeState {
  const status = invoiceStatus || paymentStatus;
  if (status === "Paid" || status === "Completed") {
    return "success";
  }
  if (status === "Partially Paid" || status === "In-Payment") {
    return "info";
  }
  return "warning";
}

export function getPaymentStatusLabel(
  invoiceStatus?: string,
  paymentStatus?: string,
): string {
  const status = invoiceStatus || paymentStatus;
  if (status === "Paid" || status === "Completed") {
    return "Paid";
  }
  if (status === "Partially Paid" || status === "In-Payment") {
    return "In-Payment";
  }
  return status || "Unpaid";
}

export function usePaymentColumns(): TableColumn<PaymentItem>[] {
  return useMemo<TableColumn<PaymentItem>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        kind: "date",
        id: "paymentDate",
        accessorKey: "paymentDate",
        header: "Payment Date",
        emphasized: true,
        fallback: "—",
      },
      {
        kind: "reference",
        id: "invoiceNo",
        header: "Invoice No.",
        getValue: (p) => p.invoice?.invoiceNumber || "—",
        getLabel: (p) => p.invoice?.invoiceNumber || "—",
      },
      {
        kind: "person",
        id: "resident",
        avatar: true,
        header: "Resident",
        maxWidthClassName: "max-w-56",
        getTitle: (p) => p.invoice?.resident?.fullName || "Unassigned Resident",
        getSubtitle: (p) => {
          const room = p.invoice?.resident?.bed?.room?.roomNumber;
          return room ? `Room ${room}` : "Resident Account";
        },
        getInitials: (p) =>
          (p.invoice?.resident?.fullName || "Unassigned Resident")
            .charAt(0)
            .toUpperCase(),
        getImageUrl: (p) => p.invoice?.resident?.photoUrl || null,
      },
      {
        kind: "text",
        id: "paymentMethod",
        accessorKey: "paymentMethod",
        header: "Method",
        tone: "secondary",
        fallback: "—",
      },
      {
        kind: "reference",
        id: "reference",
        accessorKey: "reference",
        header: "Reference",
        fallback: "—",
      },
      {
        kind: "currency",
        id: "amountPaid",
        accessorKey: "amountPaid",
        header: "Amount Paid",
        accent: true,
        fallback: "—",
      },
      {
        kind: "badge",
        id: "status",
        header: "Status",
        getValue: (p) => p.invoice?.status || p.status || "",
        getState: (p) =>
          getPaymentStatusBadgeState(p.invoice?.status, p.status),
        getLabel: (p) => getPaymentStatusLabel(p.invoice?.status, p.status),
      },
    ],
    [],
  );
}
