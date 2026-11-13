"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronRight,
  Clock,
  Edit3,
  FileSpreadsheet,
  FileText,
  Lock,
  Unlock,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import {
  getCareTypeBreakdown,
  getShiftPlannedHours,
  getShiftStaffIds,
  roundHours,
} from "./rotaDataUtils";

interface RotaSummaryWidgetsProps {
  shifts?: Shift[];
  staffList?: StaffMember[];
  isLocked?: boolean;
  onLockToggle?: (isLocked: boolean) => void;
  onViewHours?: () => void;
  onViewAllocation?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onViewAudit?: () => void;
}

export function RotaSummaryWidgets({
  shifts = [],
  staffList = [],
  isLocked: controlledLocked,
  onLockToggle,
  onViewHours,
  onViewAllocation,
  onExportPdf,
  onExportExcel,
  onViewAudit,
}: RotaSummaryWidgetsProps): React.JSX.Element {
  const [internalLocked, setInternalLocked] = useState(false);
  const isLocked = controlledLocked ?? internalLocked;

  const handleToggleLock = (): void => {
    const next = !isLocked;
    setInternalLocked(next);
    onLockToggle?.(next);
  };

  const breakdown = useMemo(() => getCareTypeBreakdown(shifts), [shifts]);

  const legendItems = useMemo(() => {
    const total = breakdown.totalHours;
    const toPercent = (val: number): number =>
      total > 0 ? Math.round((val / total) * 100) : 0;

    return [
      {
        label: "Shared Hours",
        hours: breakdown.sharedHours,
        percent: toPercent(breakdown.sharedHours),
        strokeClass: "text-slate-700",
        dotClass: "bg-slate-700",
      },
      {
        label: "1:1 Hours",
        hours: breakdown.oneToOneHours,
        percent: toPercent(breakdown.oneToOneHours),
        strokeClass: "text-primary",
        dotClass: "bg-primary",
      },
      {
        label: "Sleep-ins",
        hours: breakdown.sleepInHours,
        percent: toPercent(breakdown.sleepInHours),
        strokeClass: "text-amber-500",
        dotClass: "bg-amber-500",
      },
      {
        label: "Waking Nights",
        hours: breakdown.wakingNightHours,
        percent: toPercent(breakdown.wakingNightHours),
        strokeClass: "text-rose-600",
        dotClass: "bg-rose-600",
      },
    ];
  }, [breakdown]);

  const donutSegments = useMemo(() => {
    const total = breakdown.totalHours;
    if (total <= 0) return [];
    let cumulative = 0;
    return legendItems
      .filter((item) => item.hours > 0)
      .map((item) => {
        const arc = (item.hours / total) * 100;
        const offset = -cumulative;
        cumulative += arc;
        return { ...item, arc, offset };
      });
  }, [legendItems, breakdown.totalHours]);

  const staffAllocations = useMemo(() => {
    const hoursByStaff = new Map<string, number>();
    shifts.forEach((shift) => {
      const hours = getShiftPlannedHours(shift);
      if (hours <= 0) return;
      getShiftStaffIds(shift).forEach((staffId) => {
        hoursByStaff.set(staffId, roundHours((hoursByStaff.get(staffId) ?? 0) + hours));
      });
    });

    return staffList
      .map((member) => ({
        id: member.id,
        name: member.fullName,
        hours: hoursByStaff.get(member.id) ?? 0,
        role: member.role?.name || "Staff",
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 4);
  }, [staffList, shifts]);

  const rotaActions = [
    ...(onExportExcel
      ? [{ label: "Export Rota (CSV)", icon: FileSpreadsheet, onClick: onExportExcel }]
      : []),
    ...(onViewHours
      ? [{ label: "Hours Summary", icon: FileText, onClick: onViewHours }]
      : []),
    ...(onViewAudit
      ? [{ label: "View Audit Log", icon: Clock, onClick: onViewAudit }]
      : []),
  ];

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Hours Summary Donut Chart Widget */}
        <Card variant="surface" border="default" className="p-5 gap-4 justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <Text as="h2" size="md" weight="semibold" className="text-slate-900">
                Hours Summary
              </Text>
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onViewHours}
              className="h-auto px-1 text-primary font-medium"
            >
              View Details &rarr;
            </Button>
          </div>

          <div className="flex items-center gap-6 py-1">
            <div className="relative size-28 shrink-0 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {donutSegments.map((seg) => (
                  <path
                    key={seg.label}
                    className={seg.strokeClass}
                    strokeDasharray={`${seg.arc}, 100`}
                    strokeDashoffset={`${seg.offset}`}
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                ))}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <Text as="span" size="xl" weight="semibold" className="leading-tight text-slate-900">
                  {breakdown.totalHours}
                </Text>
                <Text as="span" size="md" variant="muted" className="leading-none">
                  hrs / Week
                </Text>
              </div>
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <Text as="span" size="md" variant="muted" className="flex items-center gap-1.5 truncate">
                    <span className={`size-2 rounded-full ${item.dotClass} shrink-0`} />
                    {item.label}
                  </Text>
                  <Text as="span" size="md" weight="medium" className="text-slate-900 shrink-0">
                    {item.hours} hrs ({item.percent}%)
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 2. Staff Allocation Mini-Table Widget */}
        <Card variant="surface" border="default" className="p-5 gap-3 justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-border-secondary/50">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <Text as="h2" size="md" weight="semibold" className="text-slate-900">
                Staff Allocation
              </Text>
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onViewAllocation}
              className="h-auto px-1 text-primary font-medium"
            >
              All staff &rarr;
            </Button>
          </div>

          {staffAllocations.length === 0 ? (
            <div className="py-6 text-center">
              <Text size="md" variant="muted">
                No staff members available yet.
              </Text>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border-secondary/40 hover:bg-transparent">
                  <TableHead className="h-8 px-1 py-1 text-md font-medium text-slate-500">
                    Staff Member
                  </TableHead>
                  <TableHead className="h-8 px-1 py-1 text-md font-medium text-slate-500">
                    Hours
                  </TableHead>
                  <TableHead className="h-8 px-1 py-1 text-md font-medium text-slate-500">
                    Role
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffAllocations.map((s) => (
                  <TableRow
                    key={s.id}
                    className="border-b border-border-secondary/30 hover:bg-white/60"
                  >
                    <TableCell className="px-1 py-2 font-medium text-slate-900">
                      {s.name}
                    </TableCell>
                    <TableCell className="px-1 py-2 text-slate-700">
                      {s.hours} hrs
                    </TableCell>
                    <TableCell className="px-1 py-2 text-slate-500 truncate max-w-[120px]">
                      {s.role}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* 3. Rota Actions Card Widget */}
        <Card variant="surface" border="default" className="p-5 gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="size-4 text-primary" />
            <Text as="h2" size="md" weight="semibold" className="text-slate-900">
              Rota Actions
            </Text>
          </div>

          <div className="flex flex-col gap-2">
            {rotaActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="flex items-center justify-between w-full h-11 px-3 rounded-xl bg-white hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full bg-surface-primary-light flex items-center justify-center text-primary shrink-0">
                      <Icon className="size-3.5" />
                    </div>
                    <Text as="span" size="md" weight="medium" className="text-slate-800">
                      {action.label}
                    </Text>
                  </div>
                  <ChevronRight className="size-4 text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Bottom Lock / Unlock Banner */}
      <Card
        variant="secondary"
        border="default"
        className={`p-4 flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLocked ? "bg-amber-50/70 border-amber-200" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 text-slate-700">
          {isLocked ? (
            <Lock className="size-4 text-primary shrink-0" />
          ) : (
            <Unlock className="size-4 text-primary shrink-0" />
          )}
          <Text size="md" weight="medium" className="text-slate-800">
            {isLocked
              ? "Rota is locked for editing. Rota changes are restricted until unlocked."
              : "Rota is currently unlocked for editing. Remember to lock the rota once shift allocations are finalised."}
          </Text>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleToggleLock}
          className="bg-white hover:bg-slate-50 text-slate-800 rounded-xl h-9 px-3.5 shrink-0 font-medium"
        >
          {isLocked ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
          {isLocked ? "Unlock Rota" : "Lock Rota"}
        </Button>
      </Card>
    </div>
  );
}
