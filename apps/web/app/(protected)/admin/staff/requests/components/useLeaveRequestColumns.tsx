"use client";

import React, { useMemo } from "react";
import { Badge, Button, Text } from "@repo/ui/components/ui";
import type { TableColumn } from "../../../../../../lib/components/shared/tableColumns";
import type { LeaveRequestItem } from "../../../../../../lib/queries/shifts";
import type { Shift } from "../../../../../../lib/types/shifts";
import {
  formatLeavePeriod,
  getLeaveDurationDays,
  getLeaveStaffInitials,
  getLeaveStatusBadgeState,
  getLeaveTypeBadgeState,
  getOverlappingShiftsForLeave,
} from "./leaveRequestUtils";

interface UseLeaveRequestColumnsProps {
  shifts: Shift[];
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  onReview: (request: LeaveRequestItem) => void;
  isUpdating?: boolean;
}

export function useLeaveRequestColumns({
  shifts,
  onApprove,
  onDecline,
  onReview,
  isUpdating = false,
}: UseLeaveRequestColumnsProps): TableColumn<LeaveRequestItem>[] {
  return useMemo<TableColumn<LeaveRequestItem>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        kind: "person",
        id: "staffMember",
        header: "Staff Member",
        maxWidthClassName: "max-w-60",
        avatar: true,
        avatarClassName: "size-10 shrink-0 bg-surface-primary-light",
        fallbackClassName:
          "bg-surface-primary-light text-primary font-semibold text-md",
        getTitle: (r) => r.staff?.fullName || "Staff Member",
        getSubtitle: (r) => r.staff?.role?.name || null,
        getInitials: (r) => getLeaveStaffInitials(r.staff?.fullName),
        getImageUrl: (r) => r.staff?.profile?.profilePhotoUrl || null,
      },
      {
        id: "type",
        header: "Leave Type",
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <Badge
              variant="secondary"
              state={getLeaveTypeBadgeState(type)}
              className="px-2.5 py-0.5 shadow-none font-medium"
            >
              {type}
            </Badge>
          );
        },
      },
      {
        id: "dates",
        header: "Dates",
        cell: ({ row }) => {
          const req = row.original;
          const days = getLeaveDurationDays(req.startDate, req.endDate);
          return (
            <div className="flex flex-col gap-0.5">
              <Text
                size="md"
                weight="medium"
                className="text-slate-900 whitespace-nowrap"
              >
                {formatLeavePeriod(req.startDate, req.endDate)} ({days}{" "}
                {days === 1 ? "day" : "days"})
              </Text>
              {req.reason && (
                <Text size="md" variant="muted" className="truncate max-w-52">
                  {req.reason}
                </Text>
              )}
            </div>
          );
        },
      },
      {
        id: "rotaCover",
        header: "Rota Cover",
        cell: ({ row }) => {
          const req = row.original;
          const overlapping = getOverlappingShiftsForLeave(req, shifts);
          if (overlapping.length > 0 && req.status === "Pending") {
            return (
              <Badge
                variant="secondary"
                state="warning"
                className="px-2.5 py-0.5 shadow-none font-medium"
              >
                {overlapping.length} shift
                {overlapping.length === 1 ? "" : "s"} affected
              </Badge>
            );
          }
          if (overlapping.length > 0) {
            return (
              <Text size="md" className="text-slate-600 whitespace-nowrap">
                {overlapping.length} shift
                {overlapping.length === 1 ? "" : "s"} in period
              </Text>
            );
          }
          return (
            <Text size="md" variant="muted" className="whitespace-nowrap">
              No clashes
            </Text>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant="secondary"
              state={getLeaveStatusBadgeState(status)}
              className="px-2.5 py-0.5 shadow-none font-medium"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        meta: { align: "right" },
        enableSorting: false,
        cell: ({ row }) => {
          const req = row.original;
          return (
            <div
              className="flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {req.status === "Pending" ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => onApprove(req.id)}
                    className="h-8 px-2.5 rounded-lg text-md font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => onDecline(req.id)}
                    className="h-8 px-2.5 rounded-lg text-md font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                  >
                    Decline
                  </Button>
                </>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onReview(req)}
                className="h-8 px-3 rounded-lg bg-white hover:bg-slate-100 text-md font-medium text-slate-700 shadow-none cursor-pointer"
              >
                {req.status === "Pending" ? "Review" : "View"}
              </Button>
            </div>
          );
        },
      },
    ],
    [shifts, onApprove, onDecline, onReview, isUpdating],
  );
}
