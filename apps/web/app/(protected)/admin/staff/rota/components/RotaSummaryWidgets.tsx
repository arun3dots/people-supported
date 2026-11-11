"use client";

import React, { useState } from "react";
import {
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

interface StaffAllocItem {
  id: string;
  name: string;
  hours: number;
  role: string;
}

interface RotaSummaryWidgetsProps {
  totalHours?: number;
  staffAllocations?: StaffAllocItem[];
  onLockToggle?: (isLocked: boolean) => void;
  onViewHours?: () => void;
  onViewAllocation?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onViewAudit?: () => void;
}

const DEFAULT_ALLOCATIONS: StaffAllocItem[] = [
  { id: "1", name: "Deborah Lee", hours: 48, role: "Support Worker" },
  { id: "2", name: "Tom Reilly", hours: 34, role: "Senior Support Worker" },
  { id: "3", name: "Sarah Jane", hours: 36, role: "Nurse" },
  { id: "4", name: "Kieran Patel", hours: 40, role: "Night Support Worker" },
  { id: "5", name: "Hannah Clarke", hours: 40, role: "Senior Support Worker" },
];

export function RotaSummaryWidgets({
  totalHours = 320,
  staffAllocations = DEFAULT_ALLOCATIONS,
  onLockToggle,
  onViewHours,
  onViewAllocation,
  onExportPdf,
  onExportExcel,
  onViewAudit,
}: RotaSummaryWidgetsProps): React.JSX.Element {
  const [isLocked, setIsLocked] = useState(false);

  const handleToggleLock = () => {
    const next = !isLocked;
    setIsLocked(next);
    onLockToggle?.(next);
  };

  const legendItems = [
    {
      label: "Shared Hours",
      value: "160 hrs (50%)",
      dotClass: "bg-slate-700",
    },
    {
      label: "1:1 Hours",
      value: "120 hrs (38%)",
      dotClass: "bg-primary",
    },
    {
      label: "Sleep-ins",
      value: "28 hrs (9%)",
      dotClass: "bg-amber-500",
    },
    {
      label: "Waking Nights",
      value: "12 hrs (4%)",
      dotClass: "bg-rose-600",
    },
  ];

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Hours Summary Donut Chart Widget */}
        <Card variant="surface" className="p-5 gap-4 justify-between">
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
                <path
                  className="text-slate-700"
                  strokeDasharray="50, 100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary"
                  strokeDasharray="38, 100"
                  strokeDashoffset="-50"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500"
                  strokeDasharray="9, 100"
                  strokeDashoffset="-88"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-rose-600"
                  strokeDasharray="3, 100"
                  strokeDashoffset="-97"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <Text as="span" size="xl" weight="semibold" className="leading-tight text-slate-900">
                  {totalHours}
                </Text>
                <Text as="span" size="xs" variant="muted" className="leading-none">
                  hrs / Week
                </Text>
              </div>
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <Text as="span" size="sm" variant="muted" className="flex items-center gap-1.5 truncate">
                    <span className={`size-2 rounded-full ${item.dotClass} shrink-0`} />
                    {item.label}
                  </Text>
                  <Text as="span" size="sm" weight="medium" className="text-slate-900 shrink-0">
                    {item.value}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 2. Staff Allocation Mini-Table Widget */}
        <Card variant="surface" className="p-5 gap-3 justify-between">
          <div className="flex items-center justify-between">
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

          <Card variant="white" border="secondary" className="p-0 gap-0 overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-card-grey/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 py-1.5 text-xs font-medium text-slate-500">
                    Staff Member
                  </TableHead>
                  <TableHead className="h-9 py-1.5 text-xs font-medium text-slate-500">
                    Hours
                  </TableHead>
                  <TableHead className="h-9 py-1.5 text-xs font-medium text-slate-500">
                    Role
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffAllocations.slice(0, 4).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="py-2 font-medium text-slate-900">
                      {s.name}
                    </TableCell>
                    <TableCell className="py-2 text-slate-700">
                      {s.hours} hrs
                    </TableCell>
                    <TableCell className="py-2 text-slate-500 truncate max-w-[120px]">
                      {s.role}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Card>

        {/* 3. Rota Actions Card Widget */}
        <Card variant="surface" className="p-5 gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="size-4 text-primary" />
            <Text as="h2" size="md" weight="semibold" className="text-slate-900">
              Rota Actions
            </Text>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPdf}
              className="w-full justify-start gap-2 h-10 bg-white rounded-xl font-medium"
            >
              <FileText className="size-3.5 text-primary" />
              Export to PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              className="w-full justify-start gap-2 h-10 bg-white rounded-xl font-medium"
            >
              <FileSpreadsheet className="size-3.5 text-primary" />
              Export to Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAudit}
              className="w-full justify-start gap-2 h-10 bg-white rounded-xl font-medium"
            >
              <Clock className="size-3.5 text-primary" />
              View Audit Log
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom Lock / Unlock Banner */}
      <Card
        variant="secondary"
        border="secondary"
        className="p-4 flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 text-slate-700">
          {isLocked ? (
            <Lock className="size-4 text-primary shrink-0" />
          ) : (
            <Unlock className="size-4 text-primary shrink-0" />
          )}
          <Text size="sm" weight="medium" className="text-slate-800">
            {isLocked
              ? "Rota is locked for editing. Rota changes are restricted until unlocked."
              : "Rota is currently unlocked for editing. Remember to lock the rota once shift allocations are finalised."}
          </Text>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleToggleLock}
          className="bg-white rounded-xl h-9 px-3.5 shrink-0 font-medium"
        >
          {isLocked ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
          {isLocked ? "Unlock Rota" : "Lock Rota"}
        </Button>
      </Card>
    </div>
  );
}
