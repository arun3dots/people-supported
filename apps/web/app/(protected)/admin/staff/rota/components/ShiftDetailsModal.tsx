"use client";

import React from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Home,
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
import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../../lib/types/facility";
import type { Resident } from "../../../../../../lib/types/resident";
import type { Shift } from "../../../../../../lib/types/shifts";
import {
  getShiftAssignedResidentIds,
  getShiftPlannedHours,
  resolveShiftLocation,
} from "./rotaDataUtils";

interface ShiftDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  staffName?: string;
  staffRole?: string;
  dayLabel?: string;
  residents?: Resident[];
  schemes?: SchemeItem[];
  properties?: PropertyItem[];
  onEditShift: (shift: Shift) => void;
}

export function ShiftDetailsModal({
  open,
  onOpenChange,
  shift,
  staffName = "Staff Member",
  staffRole,
  dayLabel = "Scheduled Shift",
  residents = [],
  schemes = [],
  properties = [],
  onEditShift,
}: ShiftDetailsModalProps): React.JSX.Element {
  if (!shift) return <></>;

  const careType = shift.careType || "Shared Care (Core Support)";
  const windowLabel =
    shift.shiftWindow || shift.timingFormatted || "Not specified";
  const hours = getShiftPlannedHours(shift);
  const { propertyName, schemeName } = resolveShiftLocation(
    shift,
    properties,
    schemes,
    residents,
  );

  const assignedResidentIds = getShiftAssignedResidentIds(shift);
  const assignedResidents = assignedResidentIds
    .map((id) => residents.find((r) => r.id === id))
    .filter((r): r is Resident => Boolean(r));

  const is1to1 = careType.includes("1:1");
  const is2to1 = careType.includes("2:1");
  const isSleepIn = careType.includes("Sleep-in");
  const isWakingNight = careType.includes("Waking Night");

  const careState: "success" | "warning" | "danger" | "info" | "inactive" =
    is2to1
      ? "info"
      : is1to1
        ? "success"
        : isSleepIn
          ? "warning"
          : isWakingNight
            ? "danger"
            : "inactive";

  const shortCareLabel = is2to1
    ? "2:1"
    : is1to1
      ? "1:1"
      : isSleepIn
        ? "Sleep-in"
        : isWakingNight
          ? "Night"
          : "Shared";

  const locationSummary = [propertyName || "Unassigned Property", schemeName]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Home className="size-4 text-primary" />
              <Text as="span" size="md" weight="medium" variant="muted">
                {locationSummary}
              </Text>
            </div>
            <Badge variant="secondary" state={careState}>
              {hours}h {shortCareLabel}
            </Badge>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="size-10 rounded-full bg-surface-primary-light text-primary flex items-center justify-center font-medium text-md shrink-0">
              {staffName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {staffName}
              </DialogTitle>
              <Text as="span" size="md" variant="muted" className="block">
                {[staffRole, dayLabel].filter(Boolean).join(" · ")}
              </Text>
            </div>
          </div>
        </DialogHeader>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <Card variant="surface" border="default" className="p-3 gap-0 shadow-none">
            <InfoField
              icon={<Clock className="size-4 text-slate-500" />}
              label="Shift Window"
              value={windowLabel}
              valueClassName="font-medium text-slate-900"
            />
          </Card>
          <Card variant="surface" border="default" className="p-3 gap-0 shadow-none">
            <InfoField
              icon={<Calendar className="size-4 text-slate-500" />}
              label="Allocated Hours"
              value={`${hours} hrs (${shortCareLabel})`}
              valueClassName="font-medium text-slate-900"
            />
          </Card>
          <Card variant="surface" border="default" className="p-3 gap-0 shadow-none">
            <InfoField
              icon={<User className="size-4 text-slate-500" />}
              label="Shift Status"
              value={shift.status || "Scheduled"}
              valueClassName="font-medium text-slate-900"
            />
          </Card>
        </div>

        {/* Shift Brief & Handover Context */}
        <Card variant="surface" border="default" className="p-4 gap-2 shadow-none">
          <Text as="h3" size="md" weight="semibold" className="text-slate-900">
            Shift Brief &amp; Handover Context
          </Text>
          <Text size="md" className="text-slate-700 leading-relaxed">
            {shift.notes?.trim()
              ? shift.notes
              : "No handover notes recorded for this shift."}
          </Text>
        </Card>

        {/* People Supported on this Shift */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                People Supported on this Shift
              </Text>
              <Text size="md" variant="muted">
                Assigned people supported and recorded care outcomes
              </Text>
            </div>
            <Badge variant="secondary" state="inactive">
              {assignedResidents.length}{" "}
              {assignedResidents.length === 1 ? "person" : "people"}
            </Badge>
          </div>

          {assignedResidents.length === 0 ? (
            <Card
              variant="surface"
              border="default"
              className="p-4 text-center shadow-none"
            >
              <Text size="md" variant="muted">
                No people supported are assigned to this shift yet.
              </Text>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {assignedResidents.map((person) => {
                const initials = person.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const roomNum = person.bed?.room?.roomNumber?.trim();
                const formattedLocation = roomNum
                  ? (roomNum.toLowerCase().includes("flat") || roomNum.toLowerCase().includes("room")
                      ? roomNum
                      : `Flat / Room ${roomNum}`)
                  : null;
                const refCode = person.supportedLivingDetails?.referenceCode;
                const metaParts = [
                  formattedLocation,
                  refCode || null,
                  person.nhsNumber ? `NHS ${person.nhsNumber}` : null,
                ].filter(Boolean);
                const outcomes = person.supportedLivingDetails?.outcomes ?? [];
                const weeklyHours =
                  person.supportedLivingDetails?.supportHoursPerWeek;

                return (
                  <Card
                    key={person.id}
                    variant="surface"
                    border="default"
                    className="p-4 gap-2.5 shadow-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-md text-primary shrink-0">
                          {initials}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2">
                          <Text as="span" size="md" weight="medium" className="text-slate-900">
                            {person.fullName}
                          </Text>
                          {metaParts.length > 0 && (
                            <Text as="span" size="md" variant="muted">
                              {metaParts.join(" · ")}
                            </Text>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" state="inactive">
                        {weeklyHours ? `${weeklyHours}h / wk` : person.fundingType || careType}
                      </Badge>
                    </div>

                    {outcomes.length > 0 && (
                      <ul className="space-y-1 pl-1">
                        {outcomes.slice(0, 3).map((outcome) => (
                          <Text
                            key={outcome.id}
                            as="li"
                            size="md"
                            variant="muted"
                            className="flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                            {outcome.title}
                          </Text>
                        ))}
                      </ul>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
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
