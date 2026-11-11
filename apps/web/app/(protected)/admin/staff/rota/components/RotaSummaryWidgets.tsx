"use client";

import React, { useState } from "react";
import {
  Clock,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  Lock,
  Unlock,
  Users,
} from "lucide-react";
import { Button, Card, Text } from "@repo/ui/components/ui";

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

  const sharedHours = 160;
  const oneToOneHours = 120;
  const sleepInHours = 28;
  const wakingNightHours = 12;

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Hours Summary Donut Chart Widget */}
        <Card variant="white" border="secondary" className="p-5 shadow-2xs gap-4 justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <Text as="h2" size="md" weight="semibold">Hours Summary</Text>
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-1 text-primary"
            >
              View Details &rarr;
            </Button>
          </div>

          <div className="flex items-center gap-6 py-1">
            {/* Donut representation */}
            <div className="relative size-28 shrink-0 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* 50% Shared Care */}
                <path
                  className="text-slate-700"
                  strokeDasharray="50, 100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* 38% 1:1 Care */}
                <path
                  className="text-emerald-700"
                  strokeDasharray="38, 100"
                  strokeDashoffset="-50"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* 9% Sleep-in */}
                <path
                  className="text-amber-500"
                  strokeDasharray="9, 100"
                  strokeDashoffset="-88"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* 3% Waking Night */}
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
                <Text as="span" size="xl" weight="semibold" className="leading-tight">
                  {totalHours}
                </Text>
                <Text as="span" size="md" weight="medium" variant="subdued" className="leading-none">
                  hrs / Week
                </Text>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1.5 text-md flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                  <span className="size-2 rounded-full bg-slate-700 shrink-0" />
                  Shared Hours
                </span>
                <Text as="span" size="md" weight="semibold">{sharedHours} hrs (50%)</Text>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                  <span className="size-2 rounded-full bg-emerald-700 shrink-0" />
                  1:1 Hours
                </span>
                <Text as="span" size="md" weight="semibold">{oneToOneHours} hrs (38%)</Text>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                  <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                  Sleep-ins
                </span>
                <Text as="span" size="md" weight="semibold">{sleepInHours} hrs (9%)</Text>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                  <span className="size-2 rounded-full bg-rose-600 shrink-0" />
                  Waking Nights
                </span>
                <Text as="span" size="md" weight="semibold">{wakingNightHours} hrs (4%)</Text>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Staff Allocation Mini-Table Widget */}
        <Card variant="white" border="secondary" className="p-5 shadow-2xs gap-3 justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <Text as="h2" size="md" weight="semibold">Staff Allocation</Text>
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-1 text-primary"
            >
              All staff &rarr;
            </Button>
          </div>

          <div className="overflow-x-auto text-md">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-md text-slate-400 font-semibold">
                  <th className="pb-1.5">Staff Member</th>
                  <th className="pb-1.5">Allocated Hours</th>
                  <th className="pb-1.5">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {staffAllocations.slice(0, 4).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2 text-slate-800 font-semibold">{s.name}</td>
                    <td className="py-2 text-slate-900">{s.hours} hrs</td>
                    <td className="py-2 text-slate-500 truncate max-w-[120px]">{s.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 3. Rota Actions Card Widget */}
        <Card variant="white" border="secondary" className="p-5 shadow-2xs gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="size-4 text-primary" />
            <Text as="h2" size="md" weight="semibold">Rota Actions</Text>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={onExportPdf}
              className="w-full justify-start gap-2 h-9 text-md rounded-xl border-slate-200 hover:bg-slate-50"
            >
              <FileText className="size-3.5 text-slate-500" />
              Export to PDF
            </Button>
            <Button
              variant="outline"
              onClick={onExportExcel}
              className="w-full justify-start gap-2 h-9 text-md rounded-xl border-slate-200 hover:bg-slate-50"
            >
              <FileSpreadsheet className="size-3.5 text-slate-500" />
              Export to Excel
            </Button>
            <Button
              variant="outline"
              onClick={onViewAudit}
              className="w-full justify-start gap-2 h-9 text-md rounded-xl border-slate-200 hover:bg-slate-50"
            >
              <Clock className="size-3.5 text-slate-500" />
              View Audit Log
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom Lock / Unlock Banner */}
      <Card variant="white" border="secondary" className="bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          {isLocked ? (
            <Lock className="size-4 text-primary shrink-0" />
          ) : (
            <Unlock className="size-4 text-primary shrink-0" />
          )}
          <Text size="md" weight="medium">
            {isLocked
              ? "Rota is locked for editing. Rota changes are restricted until unlocked."
              : "Rota is currently unlocked for editing. Remember to lock the rota once shift allocations are finalised."}
          </Text>
        </div>

        <Button
          size="default"
          variant="outline"
          onClick={handleToggleLock}
          className="rounded-xl h-10 px-3.5 shrink-0 shadow-2xs"
        >
          {isLocked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
          {isLocked ? "Unlock Rota" : "Lock Rota"}
        </Button>
      </Card>
    </div>
  );
}
