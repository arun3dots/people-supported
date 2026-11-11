"use client";

import React from "react";
import { Pencil, Trash2, MoreVertical, type LucideIcon } from "lucide-react";
import { Badge, Button } from "@repo/ui/components/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/Tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/DropdownMenu";
import { cn } from "@repo/ui/lib/utils";

export interface RowActionItem {
  label: string;
  icon?: LucideIcon;
  destructive?: boolean;
  onClick: () => void;
}

export interface RowActionsProps {
  /** Visible "Edit" pencil button */
  onEdit?: () => void;
  editLabel?: string;
  /** Visible "Delete" trash button (red on hover) */
  onDelete?: () => void;
  deleteLabel?: string;
  /** Optional status toggle rendered as a clickable badge (StaffDirectory style) */
  statusToggle?: {
    isActive: boolean;
    onToggle: () => void;
    activeLabel?: string;
    inactiveLabel?: string;
  };
  /** Extra actions rendered inside an overflow "…" dropdown menu */
  extra?: RowActionItem[];
  className?: string;
}

/**
 * Shared row/card actions used by both table rows and card grids.
 * Mirrors the StaffDirectory affordances: Edit + Delete are always visible,
 * optional status badge toggles inline, anything else lives in the overflow menu.
 */
export function RowActions({
  onEdit,
  editLabel = "Edit",
  onDelete,
  deleteLabel = "Delete",
  statusToggle,
  extra = [],
  className,
}: RowActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {statusToggle && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={statusToggle.onToggle}
              aria-label={
                statusToggle.isActive
                  ? statusToggle.activeLabel || "Deactivate"
                  : statusToggle.inactiveLabel || "Activate"
              }
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-800 rounded-md"
            >
              <Badge
                variant="secondary"
                state={statusToggle.isActive ? "success" : "inactive"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {statusToggle.isActive
                  ? statusToggle.activeLabel || "Active"
                  : statusToggle.inactiveLabel || "Inactive"}
              </Badge>
            </button>
          </TooltipTrigger>
          <TooltipContent
            sideOffset={6}
            className="bg-white border border-slate-200/80 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-medium shadow-lg"
          >
            {statusToggle.isActive
              ? statusToggle.activeLabel || "Deactivate"
              : statusToggle.inactiveLabel || "Activate"}
          </TooltipContent>
        </Tooltip>
      )}

      {onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={editLabel}
              onClick={onEdit}
              className="size-8 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
            >
              <Pencil className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            sideOffset={6}
            className="bg-white border border-slate-200/80 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-medium shadow-lg"
          >
            {editLabel}
          </TooltipContent>
        </Tooltip>
      )}

      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={deleteLabel}
              onClick={onDelete}
              className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            sideOffset={6}
            className="bg-white border border-slate-200/80 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-medium shadow-lg"
          >
            {deleteLabel}
          </TooltipContent>
        </Tooltip>
      )}

      {extra.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="More actions"
              aria-label="More actions"
              className="size-8 text-slate-400 rounded-lg"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-white rounded-xl shadow-lg border-slate-200/80"
          >
            {extra.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.label}
                  variant={item.destructive ? "destructive" : "default"}
                  onClick={item.onClick}
                >
                  {Icon && <Icon className="size-3.5 mr-2" />}
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default RowActions;
