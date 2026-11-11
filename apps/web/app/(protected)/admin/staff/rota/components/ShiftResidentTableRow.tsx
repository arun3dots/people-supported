"use client";

import {
  TableCell,
  TableRow,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Text,
} from "@repo/ui/components/ui";

export interface ResidentRotaItem {
  id: string;
  name: string;
  roomBed?: string;
  avatar?: string;
  dependency?: "High" | "Medium" | "Low" | string;
  conditions: string[];
  status?: string;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  unitId?: string;
  wingId?: string;
  roomId?: string;
  bedId?: string;
}

interface ShiftResidentTableRowProps {
  resident: ResidentRotaItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export function ShiftResidentTableRow({
  resident,
  isSelected,
  onToggle,
}: ShiftResidentTableRowProps) {
  const isAssigned = Boolean(resident.assignedStaffId);
  const hasBedAssignment = Boolean(resident.roomId && resident.bedId);

  const getDependencyBadgeState = (dep?: string) => {
    switch (dep) {
      case "High":
        return "danger";
      case "Medium":
        return "warning";
      default:
        return "success";
    }
  };

  return (
    <TableRow
      className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${isSelected ? "bg-primary/10" : ""
        }`}
      onClick={() => {
        if (hasBedAssignment) onToggle(resident.id);
      }}
    >
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={!hasBedAssignment}
          onChange={() => onToggle(resident.id)}
          className="rounded border-slate-300 text-primary focus:ring-primary size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        />
      </TableCell>
      <TableCell className="py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size="sm" className="size-10 border border-slate-200 shrink-0">
            {resident.avatar && (
              <AvatarImage src={resident.avatar} alt={resident.name} />
            )}
            <AvatarFallback className="bg-slate-200 text-slate-700 font-bold">
              {resident.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 gap-0.5   max-w-56">
            <Text size="sm" weight="medium" className="text-slate-900 truncate">
              {resident.name}
            </Text>
            <Text size="sm" weight="regular" className="text-slate-500 truncate">
            {resident.roomBed || "No room or bed assigned"}
            </Text>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3.5">
        <Badge
          variant="secondary"
          state={getDependencyBadgeState(resident.dependency)}
          className="px-2.5 py-0.5 shadow-none"
        >
          {resident.dependency || "Standard"}
        </Badge>
      </TableCell>
      <TableCell className="py-3.5">
        <div className="flex flex-wrap gap-1 max-w-52">
          {resident.conditions.map((cond, i) => (
            <Badge
              key={i}
              variant="secondary"
              state="inactive"
              className="px-2 py-0.5 shadow-none"
            >
              {cond}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="py-3.5">
        {isAssigned ? (
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="size-1.5 rounded-full bg-slate-400" />
            <Text size="sm" weight="medium" className="text-slate-500">
              Assigned to {resident.assignedStaffName || "another staff member"}
            </Text>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-700">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <Text size="sm" weight="medium" className="text-amber-700">
              {resident.status || "Unknown"}
            </Text>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

