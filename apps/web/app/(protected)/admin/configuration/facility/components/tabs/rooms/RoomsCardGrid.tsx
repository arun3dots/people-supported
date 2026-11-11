"use client";

import React from "react";
import { Eye, Layers, BedDouble, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Room } from "../../../../../../../../lib/types/facility";
import { RowActions, EntityCard } from "../../../../../../../../lib/components/shared";

interface RoomsCardGridProps {
  data?: Room[];
  isLoading?: boolean;
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
  onViewBeds: (room: Room) => void;
}

function formatDateLabel(d: unknown): string {
  if (!d) return "—";
  const date = new Date(d as string);
  return isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy");
}

function formatRoomLabel(roomNumber: string): string {
  const trimmed = roomNumber.trim();
  return /^room\b/i.test(trimmed) ? trimmed : `Room ${trimmed}`;
}

function formatRoomTypeValue(type?: string): string {
  const clean = (type || "Single").replace(/_/g, " ").trim();
  return /\broom\b/i.test(clean) ? clean : `${clean} Room`;
}

export interface RoomCardProps {
  room: Room;
  showRightDivider?: boolean;
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
  onViewBeds: (room: Room) => void;
}

export function RoomCard({
  room: r,
  showRightDivider = false,
  onEdit,
  onDelete,
  onViewBeds,
}: RoomCardProps) {
  const label = formatRoomLabel(r.roomNumber);
  return (
    <EntityCard
      avatar={
        <div className="size-11 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-icon-primary text-md shrink-0 overflow-hidden">
          {r.roomNumber.replace(/[^0-9]/g, "").slice(0, 3) || r.roomNumber.slice(0, 3)}
        </div>
      }
      title={label}
      subtitle={`${r.wing?.name || r.wingName || "Wing"}${r.branchName ? ` · ${r.branchName}` : ""}`}
      showRightDivider={showRightDivider}
      meta={[
        {
          icon: <Layers className="size-4 text-emerald-800" />,
          label: "Type",
          value: formatRoomTypeValue(r.type),
        },
        {
          icon: <BedDouble className="size-4 text-emerald-800" />,
          label: "Beds",
          value: `${r.totalBeds ?? 0} beds`,
        },
        {
          icon: <Calendar className="size-4 text-emerald-800" />,
          label: "Created",
          value: formatDateLabel(r.createdAt),
        },
      ]}
      statusText={r.status || "Active"}
      statusState={r.status === "Active" ? "success" : "inactive"}
      actions={
        <RowActions
          onEdit={() => onEdit(r)}
          editLabel={`Edit ${label}`}
          onDelete={() => onDelete(r.id)}
          deleteLabel={`Delete ${label}`}
          extra={[
            {
              label: "View Beds",
              icon: Eye,
              onClick: () => onViewBeds(r),
            },
          ]}
        />
      }
    />
  );
}

export function RoomsCardGrid({
  data,
  onEdit,
  onDelete,
  onViewBeds,
}: RoomsCardGridProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {data.map((r, idx) => (
        <RoomCard
          key={r.id}
          room={r}
          showRightDivider={idx % 3 !== 2 && idx !== data.length - 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewBeds={onViewBeds}
        />
      ))}
    </div>
  );
}
