"use client";

import React from "react";
import { AlertTriangle, Calendar, CheckCircle2, Clock } from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui/SummaryCard";
import type { LeaveRequestItem } from "../../../../../../lib/queries/shifts";
import type { Shift } from "../../../../../../lib/types/shifts";
import {
  getDaysInCurrentMonth,
  getOverlappingShiftsForLeave,
} from "./leaveRequestUtils";

interface LeaveRequestStatCardsProps {
  requests: LeaveRequestItem[];
  shifts: Shift[];
}

export function LeaveRequestStatCards({
  requests,
  shifts,
}: LeaveRequestStatCardsProps): React.JSX.Element {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const pendingRequests = requests.filter((r) => r.status === "Pending");
  const approvedRequests = requests.filter((r) => r.status === "Approved");

  const approvedThisMonth = approvedRequests.filter((r) => {
    const dt = new Date(r.startDate);
    return (
      !Number.isNaN(dt.getTime()) &&
      dt.getMonth() === currentMonth &&
      dt.getFullYear() === currentYear
    );
  }).length;

  let coverNeededRequests = 0;
  let affectedShiftsCount = 0;
  for (const req of pendingRequests) {
    const overlapping = getOverlappingShiftsForLeave(req, shifts);
    if (overlapping.length > 0) {
      coverNeededRequests += 1;
      affectedShiftsCount += overlapping.length;
    }
  }

  let sickDaysThisMonth = 0;
  let sickRequestsThisMonth = 0;
  for (const req of requests) {
    if (
      req.type !== "Sick Leave" ||
      req.status === "Cancelled" ||
      req.status === "Declined"
    ) {
      continue;
    }
    const days = getDaysInCurrentMonth(req.startDate, req.endDate, now);
    if (days > 0) {
      sickRequestsThisMonth += 1;
      sickDaysThisMonth += days;
    }
  }

  const cards: SummaryCardItem[] = [
    {
      title: "Awaiting Review",
      value: pendingRequests.length,
      subtitle:
        pendingRequests.length > 0
          ? "Pending manager decision"
          : "No pending requests",
      subtitleColor:
        pendingRequests.length > 0
          ? "text-amber-700 font-medium"
          : "text-slate-500",
      icon: (
        <Clock
          className={
            pendingRequests.length > 0
              ? "size-5 text-amber-600"
              : "size-5 text-slate-500"
          }
        />
      ),
      iconClassName:
        pendingRequests.length > 0 ? "bg-amber-50" : "bg-slate-100",
    },
    {
      title: "Approved",
      value: approvedRequests.length,
      subtitle: `${approvedThisMonth} scheduled this month`,
      subtitleColor:
        approvedRequests.length > 0
          ? "text-emerald-700 font-medium"
          : "text-slate-500",
      icon: <CheckCircle2 className="size-5 text-emerald-700" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Cover Needed",
      value: coverNeededRequests,
      subtitle:
        coverNeededRequests > 0
          ? `${affectedShiftsCount} scheduled shift${affectedShiftsCount === 1 ? "" : "s"} affected`
          : "No scheduled shift clashes",
      subtitleColor:
        coverNeededRequests > 0
          ? "text-rose-700 font-medium"
          : "text-slate-500",
      icon: (
        <AlertTriangle
          className={
            coverNeededRequests > 0
              ? "size-5 text-rose-600"
              : "size-5 text-slate-500"
          }
        />
      ),
      iconClassName: coverNeededRequests > 0 ? "bg-rose-50" : "bg-slate-100",
    },
    {
      title: "Sick Days (Month)",
      value: sickDaysThisMonth,
      subtitle:
        sickRequestsThisMonth > 0
          ? `${sickRequestsThisMonth} sick leave record${sickRequestsThisMonth === 1 ? "" : "s"}`
          : "No sick leave this month",
      subtitleColor: "text-slate-500",
      icon: <Calendar className="size-5 text-primary" />,
      iconClassName: "bg-surface-primary-light",
    },
  ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 font-sans"
    />
  );
}
