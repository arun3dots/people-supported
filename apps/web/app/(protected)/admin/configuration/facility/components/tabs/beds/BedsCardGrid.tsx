"use client";

import React from "react";
import { BedDouble, LogOut, UserPlus, Calendar, Layers } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@repo/ui/components/ui";
import type { Bed } from "../../../../../../../../lib/types/facility";
import { RowActions, EntityCard } from "../../../../../../../../lib/components/shared";

interface BedsCardGridProps {
  data?: Bed[];
  isLoading?: boolean;
  onEdit: (bed: Bed) => void;
  onDelete: (id: string) => void;
  onAssignResident: (bed: Bed) => void;
  onDischargeResident: (resident: { id: string; fullName: string }) => void;
}

function formatDateLabel(d: unknown): string {
  if (!d) return "—";
  const date = new Date(d as string);
  return isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy");
}

export interface BedCardProps {
  bed: Bed;
  showRightDivider?: boolean;
  onEdit: (bed: Bed) => void;
  onDelete: (id: string) => void;
  onAssignResident: (bed: Bed) => void;
  onDischargeResident: (resident: { id: string; fullName: string }) => void;
}

export function BedCard({
  bed: b,
  showRightDivider = false,
  onEdit,
  onDelete,
  onAssignResident,
  onDischargeResident,
}: BedCardProps) {
  const isOccupied = !!(b.residentId || b.residentName);
  const displayStatus = isOccupied ? "Occupied" : b.status || "Available";

  const initials = b.residentName
    ? b.residentName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
    : "—";

  const statusState =
    displayStatus === "Occupied"
      ? "info"
      : displayStatus === "Available"
        ? "success"
        : displayStatus === "Maintenance"
          ? "warning"
          : "inactive";

  return (
    <EntityCard
      avatar={
        <div className="size-11 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-icon-primary text-md shrink-0 overflow-hidden">
          {isOccupied ? initials : <BedDouble className="size-5 text-icon-primary" />}
        </div>
      }
      title={b.residentName || "Unassigned"}
      subtitle={isOccupied ? "Resident assigned" : "Available for assignment"}
      showRightDivider={showRightDivider}
      meta={[
        {
          icon: <BedDouble className="size-4 text-emerald-800" />,
          label: "Bed",
          value: b.number || b.code || "—",
        },
        {
          icon: <Layers className="size-4 text-emerald-800" />,
          label: "Location",
          value: `Room ${b.roomNumber || "—"} • ${b.wingName || "—"}`,
        },
        {
          icon: <Calendar className="size-4 text-emerald-800" />,
          label: "Admitted",
          value: formatDateLabel(b.residentAdmissionDate),
        },
      ]}
      statusText={displayStatus}
      statusState={statusState}
      actions={
        <div className="flex items-center gap-1.5">
          {isOccupied ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onDischargeResident({
                  id: b.residentId || "",
                  fullName: b.residentName || "Resident",
                })
              }
              className="h-8 text-md text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl gap-1.5 cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Discharge
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAssignResident(b)}
              className="h-8 text-md text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 rounded-xl gap-1.5 cursor-pointer"
            >
              <UserPlus className="size-3.5" />
              Assign
            </Button>
          )}

          <RowActions
            onEdit={() => onEdit(b)}
            editLabel={`Edit Bed ${b.number || b.code || ""}`.trim()}
            onDelete={() => onDelete(b.id)}
            deleteLabel={`Delete Bed ${b.number || b.code || ""}`.trim()}
          />
        </div>
      }
    />
  );
}

export function BedsCardGrid({
  data,
  onEdit,
  onDelete,
  onAssignResident,
  onDischargeResident,
}: BedsCardGridProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {data.map((b, idx) => (
        <BedCard
          key={b.id}
          bed={b}
          showRightDivider={idx % 3 !== 2 && idx !== data.length - 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onAssignResident={onAssignResident}
          onDischargeResident={onDischargeResident}
        />
      ))}
    </div>
  );
}
