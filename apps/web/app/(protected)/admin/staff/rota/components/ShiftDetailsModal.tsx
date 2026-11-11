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
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InfoField,
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

const DEFAULT_SUPPORTED_PEOPLE = [
  {
    id: "mw",
    initials: "MW",
    name: "Marcus Webb",
    meta: "Flat 1 · NHS 485 777 3456",
    supportBadge: "Shared Core Support (4h)",
    medication: "08:00 & 20:00 MAR – Amlodipine 5mg (Observed)",
    outcomes: [
      "Morning personal care & breakfast",
      "10:30 GP annual health check accompaniment",
    ],
  },
  {
    id: "eb",
    initials: "EB",
    name: "Evelyn Barker",
    meta: "Flat 2 · NHS 519 402 7781",
    supportBadge: "Shared Core Support (4h)",
    medication: "08:00 MAR – Levothyroxine 50mcg before breakfast",
    outcomes: [
      "Prompt morning routine & hydration log",
      "12:15 Assisted lunchtime meal preparation",
    ],
  },
];

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

  const careState = is1to1
    ? "success"
    : isSleepIn
      ? "warning"
      : isWakingNight
        ? "danger"
        : "inactive";

  const shortCareLabel = is1to1
    ? "1:1"
    : isSleepIn
      ? "Sleep-in"
      : isWakingNight
        ? "Night"
        : "Shared";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Home className="size-4 text-primary" />
              <Text as="span" size="sm" weight="medium" variant="muted">
                {propertyName} &middot; {schemeName}
              </Text>
            </div>
            <Badge variant="secondary" state={careState} className="border">
              {hours}h {shortCareLabel}
            </Badge>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="size-10 rounded-full bg-surface-primary-light text-primary flex items-center justify-center font-medium text-sm shrink-0">
              {staffName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {staffName}
              </DialogTitle>
              <Text as="span" size="sm" variant="muted" className="block">
                Support Worker &middot; {dayLabel}
              </Text>
            </div>
          </div>
        </DialogHeader>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <Card variant="surface" border="secondary" className="p-3 gap-0">
            <InfoField
              icon={<Clock className="size-4 text-slate-500" />}
              label="Shift Window"
              value={windowLabel}
              valueClassName="font-medium text-slate-900"
            />
          </Card>
          <Card variant="surface" border="secondary" className="p-3 gap-0">
            <InfoField
              icon={<Calendar className="size-4 text-slate-500" />}
              label="Allocated Hours"
              value={`${hours} hrs (${is1to1 ? "1:1" : "Shared"})`}
              valueClassName="font-medium text-slate-900"
            />
          </Card>
          <Card variant="surface" border="secondary" className="p-3 gap-0">
            <InfoField
              icon={<User className="size-4 text-slate-500" />}
              label="Handover Lead"
              value="Tom Reilly"
              valueClassName="font-medium text-slate-900"
            />
          </Card>
        </div>

        {/* Shift Brief & Handover Context */}
        <Card variant="surface" border="secondary" className="p-4 gap-2">
          <div className="flex items-center justify-between gap-2">
            <Text as="h3" size="sm" weight="semibold" className="text-slate-900">
              Shift Brief &amp; Handover Context
            </Text>
            <Badge variant="secondary" state="success" className="border gap-1">
              <CheckCircle2 className="size-3.5" />
              Evidence complete
            </Badge>
          </div>
          <Text size="sm" className="text-slate-700 leading-relaxed">
            {shift.notes ||
              "Includes 10:30 GP accompaniment and mid-week medication stock check."}
          </Text>
          <div className="flex items-center gap-1.5 pt-1">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <Text size="xs" variant="muted">
              Medication administration observation &amp; induction verified.
            </Text>
          </div>
        </Card>

        {/* People Supported on this Shift */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                People Supported on this Shift
              </Text>
              <Text size="sm" variant="muted">
                Individual support ratios, MAR rounds and scheduled care outcomes
              </Text>
            </div>
            <Badge variant="secondary" state="inactive" className="border">
              {DEFAULT_SUPPORTED_PEOPLE.length} people
            </Badge>
          </div>

          <div className="space-y-2.5">
            {DEFAULT_SUPPORTED_PEOPLE.map((person) => (
              <Card
                key={person.id}
                variant="white"
                border="secondary"
                className="p-4 gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-xs text-primary shrink-0">
                      {person.initials}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2">
                      <Text as="span" size="sm" weight="medium" className="text-slate-900">
                        {person.name}
                      </Text>
                      <Text as="span" size="xs" variant="muted">
                        {person.meta}
                      </Text>
                    </div>
                  </div>
                  <Badge variant="secondary" state="inactive" className="border">
                    {person.supportBadge}
                  </Badge>
                </div>

                <Card variant="surface" className="flex-row items-center gap-2 p-2.5 rounded-lg">
                  <Pill className="size-4 text-primary shrink-0" />
                  <Text size="xs" className="text-slate-700">
                    <span className="font-medium text-slate-900">
                      Medication (MAR):
                    </span>{" "}
                    {person.medication}
                  </Text>
                </Card>

                <ul className="space-y-1 pl-1">
                  {person.outcomes.map((outcome) => (
                    <Text
                      key={outcome}
                      as="li"
                      size="sm"
                      variant="muted"
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                      {outcome}
                    </Text>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              onOpenChange(false);
              onEditShift(shift);
            }}
          >
            <Edit2 className="size-4" />
            Edit shift block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
