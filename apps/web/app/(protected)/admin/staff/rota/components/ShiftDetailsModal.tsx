"use client";

import React from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Home,
  Pill,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Text,
} from "@repo/ui/components/ui";
import type { Shift } from "../../../../../../lib/types/shifts";

interface ShiftDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  staffName?: string;
  dayLabel?: string;
  onEditShift: (shift: Shift) => void;
}

export function ShiftDetailsModal({
  open,
  onOpenChange,
  shift,
  staffName = "Staff Member",
  dayLabel = "Scheduled Shift",
  onEditShift,
}: ShiftDetailsModalProps): React.JSX.Element {
  if (!shift) return <></>;

  const careType = shift.careType || "Shared Care (Core Support)";
  const windowLabel = shift.shiftWindow || "07:00 - 15:00";
  const hours = shift.durationHours ?? 8;
  const propertyName = shift.wing?.name || "Oak House";
  const schemeName = "North Yorkshire Supported Living";

  const is1to1 = careType.includes("1:1");
  const isSleepIn = careType.includes("Sleep-in");
  const isWakingNight = careType.includes("Waking Night");

  const badgeColor = is1to1
    ? "bg-primary/10 text-primary border-primary/20"
    : isSleepIn
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : isWakingNight
        ? "bg-rose-100 text-rose-800 border-rose-200"
        : "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Home className="size-4 text-primary" />
              <Text as="span" size="md" weight="medium" variant="subdued">
                {propertyName} &middot; {schemeName}
              </Text>
            </div>
            <Badge variant="outline" className={`border p-0 px-2.5 py-0.5 text-md font-medium ${badgeColor}`}>
              {hours}h {is1to1 ? "1:1" : isSleepIn ? "Sleep-in" : isWakingNight ? "Night" : "Shared"}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-md shrink-0">
              {staffName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl font-semibold text-slate-900">{staffName}</DialogTitle>
              <Text as="span" size="md" variant="subdued" className="block font-normal">
                Support Worker &middot; {dayLabel}
              </Text>
            </div>
          </div>
        </DialogHeader>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <Card variant="white" border="secondary" className="rounded-xl bg-slate-50/90 p-3 gap-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-slate-500" />
              <Text as="span" size="md" variant="subdued">Shift Window</Text>
            </div>
            <Text size="md" weight="semibold">{windowLabel}</Text>
          </Card>
          <Card variant="white" border="secondary" className="rounded-xl bg-slate-50/90 p-3 gap-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-slate-500" />
              <Text as="span" size="md" variant="subdued">Allocated Hours</Text>
            </div>
            <Text size="md" weight="semibold">
              {hours} hrs ({is1to1 ? "1:1" : "Shared"})
            </Text>
          </Card>
          <Card variant="white" border="secondary" className="rounded-xl bg-slate-50/90 p-3 gap-0.5">
            <div className="flex items-center gap-1.5">
              <User className="size-4 text-slate-500" />
              <Text as="span" size="md" variant="subdued">Handover Lead</Text>
            </div>
            <Text size="md" weight="semibold">Tom Reilly</Text>
          </Card>
        </div>

        {/* Shift Brief & Handover Context */}
        <Card variant="white" border="secondary" className="mt-2 rounded-2xl bg-slate-50/70 p-4 gap-2">
          <div className="flex items-center justify-between">
            <Text as="h3" size="md" weight="semibold" className="text-slate-700">
              Shift Brief &amp; Handover Context
            </Text>
            <Badge variant="success" className="border border-emerald-200 p-0 px-2 py-0.5 text-md font-medium">
              <CheckCircle2 className="size-4 text-emerald-700" />
              Evidence complete
            </Badge>
          </div>
          <Text size="md" weight="medium" className="leading-relaxed">
            {shift.notes || "Includes 10:30 GP accompaniment and mid-week medication stock check."}
          </Text>
          <div className="flex items-center gap-1.5 pt-1">
            <ShieldCheck className="size-4 text-primary" />
            <Text size="md" variant="subdued">Medication administration observation &amp; induction verified.</Text>
          </div>
        </Card>

        {/* People Supported on this Shift */}
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <Text as="h3" size="md" weight="semibold">People Supported on this Shift</Text>
              <Text size="md" variant="subdued">
                Individual support ratios, MAR rounds and scheduled care outcomes
              </Text>
            </div>
            <Badge variant="outline" className="rounded-md border-0 bg-slate-100 p-0 px-2 py-0.5 text-md font-medium text-slate-700">
              2 people
            </Badge>
          </div>

          <div className="space-y-2.5">
            <Card variant="white" border="secondary" className="rounded-xl p-3.5 gap-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-md text-primary">
                    MW
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2">
                    <Text as="span" size="md" weight="semibold">Marcus Webb</Text>
                    <Text as="span" size="md" variant="subdued">Flat 1 &middot; NHS 485 777 3456</Text>
                  </div>
                </div>
                <Badge variant="outline" className="border-0 bg-slate-100 p-0 px-2 py-0.5 text-md font-medium text-slate-700">
                  Shared Core Support (4h)
                </Badge>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                <Pill className="size-4 text-primary shrink-0" />
                <Text size="md"><strong className="font-semibold">Medication (MAR):</strong> 08:00 &amp; 20:00 MAR &ndash; Amlodipine 5mg (Observed)</Text>
              </div>
              <ul className="space-y-1 pl-1">
                <Text as="li" size="md" variant="subdued" className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-700" /> Morning personal care &amp; breakfast</Text>
                <Text as="li" size="md" variant="subdued" className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-700" /> 10:30 GP annual health check accompaniment</Text>
              </ul>
            </Card>

            <Card variant="white" border="secondary" className="rounded-xl p-3.5 gap-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-md text-primary">
                    EB
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2">
                    <Text as="span" size="md" weight="semibold">Evelyn Barker</Text>
                    <Text as="span" size="md" variant="subdued">Flat 2 &middot; NHS 519 402 7781</Text>
                  </div>
                </div>
                <Badge variant="outline" className="border-0 bg-slate-100 p-0 px-2 py-0.5 text-md font-medium text-slate-700">
                  Shared Core Support (4h)
                </Badge>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                <Pill className="size-4 text-primary shrink-0" />
                <Text size="md"><strong className="font-semibold">Medication (MAR):</strong> 08:00 MAR &ndash; Levothyroxine 50mcg before breakfast</Text>
              </div>
              <ul className="space-y-1 pl-1">
                <Text as="li" size="md" variant="subdued" className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-700" /> Prompt morning routine &amp; hydration log</Text>
                <Text as="li" size="md" variant="subdued" className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-700" /> 12:15 Assisted lunchtime meal preparation</Text>
              </ul>
            </Card>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-4 text-md">
            Close
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              onOpenChange(false);
              onEditShift(shift);
            }}
            className="rounded-xl px-5"
          >
            <Edit2 className="size-4" />
            Edit shift block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
