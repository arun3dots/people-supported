"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { Button, Text } from "@repo/ui/components/ui";
import { ShiftRequest } from "../../../../../../lib/types/shifts";
import { DataTable } from "../../../../../../lib/components/shared/DataTable";
import type { TableColumn } from "../../../../../../lib/components/shared/tableColumns";

interface LeaveRequestTableProps {
  requests: ShiftRequest[];
  isLoading?: boolean;
  onReviewRequest: (request: ShiftRequest) => void;
}

function formatDateRange(startTime: string, endTime: string) {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const days =
      Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      );
    return `${format(start, "d MMM")} – ${format(end, "d MMM")} (${days} day${days > 1 ? "s" : ""})`;
  } catch {
    return "—";
  }
}

function formatLeaveDates(request: ShiftRequest) {
  if (request.type !== "Leave") return "—";
  return formatDateRange(request.startTime, request.endTime);
}

function formatSwapDates(request: ShiftRequest) {
  if (request.type !== "Change") return "—";
  try {
    const requestedDate = format(new Date(request.startTime), "d MMM");
    if (request.shift?.startTime) {
      const origDate = format(new Date(request.shift.startTime), "d MMM");
      if (origDate !== requestedDate) {
        return `${origDate} → ${requestedDate}`;
      }
      const origTime = format(new Date(request.shift.startTime), "HH:mm");
      const reqTime = format(new Date(request.startTime), "HH:mm");
      return `${origDate} (${origTime} → ${reqTime})`;
    }
    return requestedDate;
  } catch {
    return "—";
  }
}

export function LeaveRequestTable({
  requests,
  isLoading,
  onReviewRequest,
}: LeaveRequestTableProps) {
  const columns = useMemo<TableColumn<ShiftRequest>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
        align: "left",
      },
      {
        id: "staffMember",
        header: "Staff Member",
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <Text size="md" weight="medium" className="text-slate-900 truncate">
              {row.original.user?.fullName || "Staff Member"}
            </Text>
            <Text size="sm" weight="medium" className="text-slate-500 truncate">
              {row.original.user?.role?.name || "Staff"}
            </Text>
          </div>
        ),
      },
      {
        kind: "text",
        id: "requestType",
        header: "Request Type",
        getValue: (request) => request.type,
        tone: "secondary",
        fallback: "—",
      },
      {
        id: "leaveDates",
        header: "Leave Dates",
        accessorFn: (request) => formatLeaveDates(request),
        cell: ({ row }) => (
          <Text size="md" weight="normal" className="text-slate-700 whitespace-nowrap">
            {formatLeaveDates(row.original)}
          </Text>
        ),
      },
      {
        id: "shiftSwap",
        header: "Shift Swap",
        accessorFn: (request) => formatSwapDates(request),
        cell: ({ row }) => (
          <Text size="md" weight="normal" className="text-slate-700 whitespace-nowrap">
            {formatSwapDates(row.original)}
          </Text>
        ),
      },
      {
        kind: "badge",
        id: "status",
        header: "Status",
        getValue: (request) => request.status,
        getLabel: (request) => request.status,
        getState: (request) => {
          if (request.status === "Approved") return "success";
          if (request.status === "Rejected") return "danger";
          return "warning";
        },
      },
      {
        id: "actions",
        header: "Action",
        align: "right",
        meta: { align: "right" },
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant={row.original.status === "Pending" ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              onReviewRequest(row.original);
            }}
            className="rounded-xl border-slate-200"
          >
            {row.original.status === "Pending" ? "Review Request" : "View Details"}
          </Button>
        ),
      },
    ],
    [onReviewRequest],
  );

  return (
    <div className="w-full rounded-2xl border-none bg-surface-card-grey px-4 py-5 font-sans shadow-none sm:px-6">
      <div className="mb-4 flex items-center justify-between border-b border-border-secondary/50 pb-4">
        <Text size="base" weight="bold" className="text-slate-900">
          Leave Request Overview
        </Text>
      </div>
      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        onRowClick={onReviewRequest}
        emptyTitle="No leave requests found"
        emptyDescription="There are no leave requests matching the selected criteria."
      />
    </div>
  );
}
