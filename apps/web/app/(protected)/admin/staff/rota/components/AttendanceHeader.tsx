"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  UserCheck,
} from "lucide-react";
import {
  Button,
  Input,
  SummaryCardsGrid,
  Text,
  type SummaryCardItem,
} from "@repo/ui/components/ui";

interface AttendanceHeaderProps {
  selectedDateStr: string;
  onDateChange: (dateStr: string) => void;
  onExport?: () => void;
  totalScheduled: number;
  clockedInCount: number;
  lateCount: number;
  absentCount: number;
  punctuality: number;
  totalHoursLogged: string;
}

export function AttendanceHeader({
  selectedDateStr,
  onDateChange,
  onExport,
  totalScheduled,
  clockedInCount,
  lateCount,
  absentCount,
  punctuality,
  totalHoursLogged,
}: AttendanceHeaderProps): React.JSX.Element {
  const kpiCards: SummaryCardItem[] = [
    {
      title: "Clocked In",
      value: `${clockedInCount}/${totalScheduled}`,
      subtitle: "Scheduled shifts today",
      subtitleColor: "text-slate-500",
      icon: <UserCheck className="size-5 text-primary" />,
      iconClassName: "bg-surface-primary-light",
    },
    {
      title: "Punctuality",
      value: `${punctuality}%`,
      subtitle: `${clockedInCount} shifts started so far`,
      subtitleColor: "text-emerald-700 font-medium",
      icon: <CheckCircle2 className="size-5 text-emerald-700" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Late Arrivals",
      value: lateCount,
      subtitle: "More than 5 mins after start",
      subtitleColor: lateCount > 0 ? "text-amber-700 font-medium" : "text-slate-500",
      icon: <Clock className="size-5 text-amber-600" />,
      iconClassName: "bg-amber-50",
    },
    {
      title: "Absent",
      value: absentCount,
      subtitle: absentCount > 0 ? "Cover needed" : "Full attendance",
      subtitleColor: absentCount > 0 ? "text-rose-700 font-medium" : "text-slate-500",
      icon: <AlertTriangle className="size-5 text-rose-600" />,
      iconClassName: "bg-rose-50",
    },
    {
      title: "Hours Logged",
      value: `${totalHoursLogged}h`,
      subtitle: "Clocked time today",
      subtitleColor: "text-primary font-medium",
      icon: <Clock className="size-5 text-primary" />,
      iconClassName: "bg-slate-100",
    },
  ];

  return (
    <div className="space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Text as="span" size="md" weight="medium" variant="muted">
              Rota Management
            </Text>
            <Text as="span" size="md" variant="muted">
              &rsaquo;
            </Text>
            <Text as="span" size="md" weight="medium" className="text-slate-800">
              Attendance
            </Text>
          </div>
          <Text as="h1" size="2xl" weight="semibold" className="tracking-tight text-slate-900">
            Attendance
          </Text>
          <Text variant="muted" size="md" className="mt-0.5">
            Track clock-ins against the rota, follow up lateness and absence, and keep timesheets accurate for payroll.
          </Text>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Input
            type="date"
            value={selectedDateStr}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-9 px-3 rounded-xl bg-white border-slate-200 text-sm font-medium w-40"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onExport || (() => typeof window !== "undefined" && window.print())}
            className="h-9 px-3 rounded-xl bg-surface-card-grey hover:bg-slate-200/70 text-md font-medium text-slate-700 flex items-center gap-1.5 shadow-none cursor-pointer"
          >
            <Download className="size-3.5" />
            Export Timesheet
          </Button>
        </div>
      </div>

      <SummaryCardsGrid cards={kpiCards} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" />
    </div>
  );
}

