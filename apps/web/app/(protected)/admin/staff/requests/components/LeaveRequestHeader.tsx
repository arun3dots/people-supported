"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Input,
  SummaryCardsGrid,
  Text,
  type SummaryCardItem,
} from "@repo/ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";

interface LeaveRequestHeaderProps {
  pendingCount?: number;
  approvedCount?: number;
  rejectedCount?: number;
}

export function LeaveRequestHeader({
  pendingCount = 0,
  approvedCount = 0,
  rejectedCount = 0,
}: LeaveRequestHeaderProps) {
  const totalCount = pendingCount + approvedCount + rejectedCount;

  const statCards: SummaryCardItem[] = [
    {
      title: "Pending Requests",
      value: pendingCount,
      subtitle: "Awaiting review",
      subtitleColor: "text-amber-700 font-medium",
      icon: <Clock className="size-5 text-amber-700" />,
      iconClassName: "bg-amber-50",
    },
    {
      title: "Approved Requests",
      value: approvedCount,
      subtitle: "Total approved",
      subtitleColor: "text-emerald-700 font-medium",
      icon: <CheckCircle2 className="size-5 text-emerald-700" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Rejected Requests",
      value: rejectedCount,
      subtitle: "Total rejected",
      subtitleColor: "text-rose-600 font-medium",
      icon: <XCircle className="size-5 text-rose-600" />,
      iconClassName: "bg-rose-50",
    },
    {
      title: "Total Requests",
      value: totalCount,
      subtitle: "All time",
      subtitleColor: "text-slate-500",
      icon: <ShieldCheck className="size-5 text-primary" />,
      iconClassName: "bg-surface-primary-light",
    },
  ];

  return (
    <div className="space-y-6 mb-6 font-sans">
      <div>
        <Text as="h1" size="xl" weight="bold" className="text-slate-900">
          Leave Management
        </Text>
        <Text size="xs" weight="regular" variant="subdued" className="mt-0.5">
          Review and approve staff leave requests and monitor impact on coverage.
        </Text>
      </div>

      <SummaryCardsGrid cards={statCards} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 min-w-60 [&_[data-slot=input-error]]:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
          <Input
            placeholder="Search staff requests..."
            className="w-full h-10 pl-10 pr-4 bg-white border-slate-200/80 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Select defaultValue="all">
            <SelectTrigger className="w-36 h-10 bg-white border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 cursor-pointer">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Leave">Leave</SelectItem>
              <SelectItem value="Change">Change</SelectItem>
              <SelectItem value="Cover">Cover</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-36 h-10 bg-white border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 cursor-pointer">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-36 h-10 bg-white border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 cursor-pointer">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-primary shrink-0" />
                <SelectValue placeholder="All Time" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
