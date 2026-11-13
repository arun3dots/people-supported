"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, Text, Button, Checkbox } from "@repo/ui/components/ui";
import { Wing } from "../../../../../lib/types/facility";
import { DailyTaskItem, TaskStatusFilter } from "./types";

interface TaskAllocationToolbarProps {
  unallocatedTasks: DailyTaskItem[];
  wings: Wing[];
  selectedUnitId: string;
  onSelectUnit: (unitId: string) => void;
  statusFilter: TaskStatusFilter;
  onStatusFilterChange: (status: TaskStatusFilter) => void;
  wholeUnit: boolean;
  onWholeUnitChange: (whole: boolean) => void;
  canAllocate?: boolean;
}

export function TaskAllocationToolbar({
  unallocatedTasks,
  wings,
  selectedUnitId,
  onSelectUnit,
  statusFilter,
  onStatusFilterChange,
  wholeUnit,
  onWholeUnitChange,
  canAllocate = false,
}: TaskAllocationToolbarProps) {
  return (
    <div className="space-y-4">
      {/* Warning Banner when tasks cannot be allocated */}
      {unallocatedTasks.length > 0 && (
        <Card
          variant="surface"
          border="primary"
          className="p-4 flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-500/5"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <Text size="md" className="text-text-heading">
              <strong>{unallocatedTasks.length} task(s) unallocated.</strong>{" "}
              {unallocatedTasks.slice(0, 3).map((t) => t.title).join("; ")}
              {unallocatedTasks.length > 3 ? "..." : ""}.
              {canAllocate ? " Fill the open shift or reassign." : " Allocated staff or senior will assign."}
            </Text>
          </div>
          {canAllocate && (
            <Link href="/carer/shifts">
              <Button variant="outline" size="sm" className="h-8 text-md font-semibold px-3 shrink-0">
                Open shifts on the Rota ↗
              </Button>
            </Link>
          )}
        </Card>
      )}

      {/* Toolbar: Unit Segmented selector + Status filters + Whole unit toggle */}
      <Card
        variant="surface"
        border="secondary"
        className="p-3.5 flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Text size="md" weight="semibold" className="text-text-description uppercase tracking-wider">
              Status:
            </Text>
            <div className="flex items-center gap-1 bg-surface-primary-light/60 p-1 rounded-xl border border-border-secondary/40">
              {(
                [
                  ["all", "All"],
                  ["open", "Due now"],
                  ["done", "Done"],
                  ["missed", "Missed"],
                ] as const
              ).map(([key, label]) => {
                const isSelected = statusFilter === key;
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={isSelected ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => onStatusFilterChange(key)}
                    className="h-7 px-3 rounded-lg text-md font-semibold cursor-pointer"
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Unit Filter */}
          <div className="flex items-center gap-2">
            <Text size="md" weight="semibold" className="text-text-description uppercase tracking-wider">
              Unit:
            </Text>
            <div className="flex items-center gap-1 bg-surface-primary-light/60 p-1 rounded-xl border border-border-secondary/40">
              <Button
                type="button"
                variant={selectedUnitId === "all" ? "primary" : "ghost"}
                size="sm"
                onClick={() => onSelectUnit("all")}
                className="h-7 px-3 rounded-lg text-md font-semibold cursor-pointer"
              >
                All units
              </Button>
              {wings.map((w) => {
                const isSelected = selectedUnitId === w.id;
                return (
                  <Button
                    key={w.id}
                    type="button"
                    variant={isSelected ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => onSelectUnit(w.id)}
                    className="h-7 px-3 rounded-lg text-md font-semibold cursor-pointer"
                  >
                    {w.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Whole Unit Toggle for Carers */}
        <label className="flex items-center gap-2 text-md font-medium text-text-body cursor-pointer select-none shrink-0">
          <Checkbox
            checked={wholeUnit}
            onCheckedChange={(checked) => onWholeUnitChange(Boolean(checked))}
          />
          <Text as="span" size="md">
            Whole unit, not just my allocation
          </Text>
        </label>
      </Card>
    </div>
  );
}
