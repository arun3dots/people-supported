"use client";

import React, { useMemo } from "react";
import { Eye, CreditCard, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/Tooltip";
import type { InvoiceResponse } from "../../../../../../lib/queries/finance/types";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../../lib/components/shared/tableColumns";

interface UseInvoiceColumnsProps {
  onViewInvoice: (invoice: InvoiceResponse) => void;
  onRecordPayment: (invoice: InvoiceResponse) => void;
  onDeleteInvoice: (invoice: InvoiceResponse) => void;
}

export function getInvoiceStatusBadgeState(status: string): BadgeState {
  switch (status) {
    case "Paid":
      return "success";
    case "Partially Paid":
      return "info";
    case "Overdue":
      return "danger";
    case "Draft":
      return "inactive";
    default:
      return "warning";
  }
}

export function useInvoiceColumns({
  onViewInvoice,
  onRecordPayment,
  onDeleteInvoice,
}: UseInvoiceColumnsProps): TableColumn<InvoiceResponse>[] {
  return useMemo<TableColumn<InvoiceResponse>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        kind: "reference",
        id: "invoiceNo",
        accessorKey: "invoiceNumber",
        header: "Invoice No.",
        fallback: "—",
      },
      {
        kind: "person",
        id: "resident",
        avatar: true,
        header: "Resident",
        maxWidthClassName: "max-w-56",
        getTitle: (i) => i.resident?.fullName || "Unassigned Resident",
        getSubtitle: (i) => {
          const room = i.resident?.bed?.room?.roomNumber;
          return room ? `Room ${room}` : "Resident Account";
        },
        getInitials: (i) =>
          (i.resident?.fullName || "Unassigned Resident").charAt(0).toUpperCase(),
        getImageUrl: (i) => i.resident?.photoUrl || null,
      },
      {
        kind: "text",
        id: "invoiceType",
        accessorKey: "invoiceType",
        header: "Invoice Type",
        tone: "muted",
        fallback: "Residential Fees",
      },
      {
        kind: "date",
        id: "issuedDate",
        accessorKey: "issuedDate",
        header: "Issue Date",
        fallback: "—",
      },
      {
        kind: "date",
        id: "dueDate",
        accessorKey: "dueDate",
        header: "Due Date",
        fallback: "—",
      },
      {
        kind: "currency",
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
      },
      {
        kind: "badge",
        id: "status",
        accessorKey: "status",
        header: "Status",
        getState: (i) => getInvoiceStatusBadgeState(i.status || "Draft"),
        getLabel: (i) => i.status || "Draft",
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div
              className="flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewInvoice(invoice)}
                className="h-8 px-2.5 rounded-xl gap-1.5 font-medium shadow-none border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
                title="View Details"
              >
                <Eye className="size-3.5 text-emerald-800" />
                <span>View</span>
              </Button>

              {invoice.status !== "Paid" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onRecordPayment(invoice)}
                  className="h-8 px-3 rounded-xl gap-1.5 cursor-pointer"
                  title="Record Payment"
                >
                  <CreditCard className="size-3.5" />
                  <span>Pay</span>
                </Button>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteInvoice(invoice)}
                    className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    aria-label="Delete Invoice"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  sideOffset={6}
                  className="bg-white border border-slate-200/80 text-slate-800 rounded-lg px-2.5 py-1 text-sm font-medium shadow-lg"
                >
                  Delete Invoice
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [onViewInvoice, onRecordPayment, onDeleteInvoice],
  );
}
