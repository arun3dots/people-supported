"use client";

import React from "react";
import { Users, ShieldCheck, Clock, Filter, CheckCircle2, XCircle } from "lucide-react";
import { Text, Input, SummaryCardsGrid, type SummaryCardItem } from "@repo/ui/components/ui";
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

  // Stat cards configuration
  const statCards: SummaryCardItem[] = [
    {
      title: "Pending Requests",
      value: pendingCount,
      subtitle: "Awaiting review",
      subtitleColor: "text-amber-700 font-medium",
      icon: <Clock className="size-5 text-amber-700" />,
    },
    {
      title: "Approved Requests",
      value: approvedCount,
      subtitle: "Total approved",
      subtitleColor: "text-emerald-700 font-medium",
      icon: <CheckCircle2 className="size-5 text-emerald-700" />,
    },
    {
      title: "Rejected Requests",
      value: rejectedCount,
      subtitle: "Total rejected",
      subtitleColor: "text-red-600 font-medium",
      icon: <XCircle className="size-5 text-red-600" />,
    },
    {
      title: "Total Requests",
      value: totalCount,
      subtitle: "All time",
      subtitleColor: "text-slate-500",
      icon: <ShieldCheck className="size-5 text-blue-700" />,
    },
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Title Header */}
      <div>
        <Text as="h1" size="xl" weight="bold" className="text-text-body">
          Leave Management
        </Text>
        <Text size="sm" weight="regular" className="text-text-description mt-0.5">
          Review and approve staff leave requests and monitor impact on coverage.
        </Text>
      </div>

      {/* 4 Stat Cards Grid */}
      <SummaryCardsGrid cards={statCards} />

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
        <div className=" flex-1 max-w-[480px] justify-center items-center flex">
          {/* <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-description" /> */}
          <Input
            placeholder="Search staff requests…"
          />
        </div>

        <div className="flex  items-center gap-3 w-3/4">
          <Select defaultValue="all">
            <SelectTrigger >
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
            <SelectTrigger > <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger > <div className="flex items-center gap-2">
              <Filter className="size-4 text-icon-primary shrink-0" />
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
