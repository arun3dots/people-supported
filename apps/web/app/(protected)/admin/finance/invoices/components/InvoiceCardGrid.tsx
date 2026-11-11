"use client";

import React from "react";
import { format } from "date-fns";
import { Eye, CreditCard, Trash2, Calendar, FileText } from "lucide-react";
import {
  Button,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/Tooltip";
import { EntityCard } from "../../../../../../lib/components/shared";
import type { InvoiceResponse } from "../../../../../../lib/queries/finance/types";
import { getInvoiceStatusBadgeState } from "./useInvoiceColumns";

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

export interface InvoiceCardProps {
  invoice: InvoiceResponse;
  showRightDivider?: boolean;
  onViewInvoice: (invoice: InvoiceResponse) => void;
  onRecordPayment: (invoice: InvoiceResponse) => void;
  onDeleteInvoice: (invoice: InvoiceResponse) => void;
}

export function InvoiceCard({
  invoice,
  showRightDivider = false,
  onViewInvoice,
  onRecordPayment,
  onDeleteInvoice,
}: InvoiceCardProps) {
  const residentName = invoice.resident?.fullName || "Unassigned Resident";
  const initial = residentName.charAt(0).toUpperCase();
  const room = invoice.resident?.bed?.room?.roomNumber;

  return (
    <EntityCard
      onClick={() => onViewInvoice(invoice)}
      showRightDivider={showRightDivider}
      avatar={
        <Avatar size="sm" className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light">
          {invoice.resident?.photoUrl && (
            <AvatarImage
              src={invoice.resident.photoUrl}
              alt={residentName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-base">
            {initial}
          </AvatarFallback>
        </Avatar>
      }
      title={invoice.invoiceNumber}
      subtitle={`${residentName}${room ? ` • Room ${room}` : ""}`}
      headerBadge={
        <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">
          {invoice.invoiceType || "Residential Fees"}
        </Badge>
      }
      meta={[
        {
          icon: <CreditCard className="size-4 text-emerald-800 shrink-0" />,
          label: "Amount",
          value: formatCurrency(invoice.amount),
        },
        {
          icon: <Calendar className="size-4 text-emerald-800 shrink-0" />,
          label: "Due Date",
          value: formatDateLabel(invoice.dueDate),
        },
        {
          icon: <FileText className="size-4 text-emerald-800 shrink-0" />,
          label: "Issued",
          value: formatDateLabel(invoice.issuedDate),
        },
      ]}
      statusBadge={
        <Badge
          variant="secondary"
          state={getInvoiceStatusBadgeState(invoice.status || "Draft")}
          className="px-2.5 py-0.5 shadow-none"
        >
          {invoice.status || "Draft"}
        </Badge>
      }
      actions={
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
      }
    />
  );
}

export interface InvoiceCardGridProps {
  invoices?: InvoiceResponse[];
  paginatedInvoices: InvoiceResponse[];
  isLoading: boolean;
  onViewInvoice: (invoice: InvoiceResponse) => void;
  onRecordPayment: (invoice: InvoiceResponse) => void;
  onDeleteInvoice: (invoice: InvoiceResponse) => void;
}

export function InvoiceCardGrid({
  paginatedInvoices,
  onViewInvoice,
  onRecordPayment,
  onDeleteInvoice,
}: InvoiceCardGridProps) {
  if (!paginatedInvoices || paginatedInvoices.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {paginatedInvoices.map((invoice, idx) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          showRightDivider={
            idx % 3 !== 2 && idx !== paginatedInvoices.length - 1
          }
          onViewInvoice={onViewInvoice}
          onRecordPayment={onRecordPayment}
          onDeleteInvoice={onDeleteInvoice}
        />
      ))}
    </div>
  );
}
