"use client";

import React from "react";
import { Eye, DoorOpen, BedDouble, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Wing } from "../../../../../../../../lib/types/facility";
import { RowActions, EntityCard } from "../../../../../../../../lib/components/shared";

interface WingsCardGridProps {
  data?: Wing[];
  isLoading?: boolean;
  onEdit: (wing: Wing) => void;
  onDelete: (id: string) => void;
  onViewRooms: (wing: Wing) => void;
}

function formatDateLabel(d: unknown): string {
  if (!d) return "—";
  const date = new Date(d as string);
  return isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy");
}

export interface WingCardProps {
  wing: Wing;
  showRightDivider?: boolean;
  onEdit: (wing: Wing) => void;
  onDelete: (id: string) => void;
  onViewRooms: (wing: Wing) => void;
}

export function WingCard({
  wing: w,
  showRightDivider = false,
  onEdit,
  onDelete,
  onViewRooms,
}: WingCardProps) {
  return (
    <EntityCard
      avatar={
        <div className="size-11 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-icon-primary text-md shrink-0 overflow-hidden">
          {w.name.slice(0, 2).toUpperCase()}
        </div>
      }
      title={w.name}
      subtitle={`${w.branch?.name || "Care Branch"}${w.code ? ` · Code: ${w.code}` : ""}`}
      showRightDivider={showRightDivider}
      meta={[
        {
          icon: <DoorOpen className="size-4 text-emerald-800" />,
          label: "Rooms",
          value: `${w.totalRooms ?? 0} total`,
        },
        {
          icon: <BedDouble className="size-4 text-emerald-800" />,
          label: "Beds",
          value: `${w.totalBeds ?? 0} beds`,
        },
        {
          icon: <Calendar className="size-4 text-emerald-800" />,
          label: "Created",
          value: formatDateLabel(w.createdAt),
        },
      ]}
      statusText={w.status || "Active"}
      statusState={w.status === "Active" ? "success" : "inactive"}
      actions={
        <RowActions
          onEdit={() => onEdit(w)}
          editLabel={`Edit ${w.name}`}
          onDelete={() => onDelete(w.id)}
          deleteLabel={`Delete ${w.name}`}
          extra={[
            {
              label: "View Rooms",
              icon: Eye,
              onClick: () => onViewRooms(w),
            },
          ]}
        />
      }
    />
  );
}

export function WingsCardGrid({
  data,
  onEdit,
  onDelete,
  onViewRooms,
}: WingsCardGridProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {data.map((w, idx) => (
        <WingCard
          key={w.id}
          wing={w}
          showRightDivider={idx % 3 !== 2 && idx !== data.length - 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewRooms={onViewRooms}
        />
      ))}
    </div>
  );
}
