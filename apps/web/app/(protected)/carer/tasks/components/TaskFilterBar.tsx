"use client";

import React from "react";
import { Card, Text, Button } from "@repo/ui/components/ui";
import { TaskFilterType } from "./types";
import { Resident } from "../../../../../lib/types/resident";

interface TaskFilterBarProps {
  activeFilter: TaskFilterType;
  onFilterChange: (filter: TaskFilterType) => void;
  selectedResidentId: string;
  onResidentChange: (residentId: string) => void;
  residents: Resident[];
}

export function TaskFilterBar({
  activeFilter,
  onFilterChange,
  selectedResidentId,
  onResidentChange,
  residents,
}: TaskFilterBarProps) {
  const FILTER_OPTIONS: Array<[TaskFilterType, string]> = [
    ["all", "All"],
    ["open", "Due now"],
    ["upcoming", "Upcoming"],
    ["done", "Done"],
    ["missed", "Missed"],
    ["refused", "Refused"],
  ];

  return (
    <Card
      variant="surface"
      border="secondary"
      className="p-3 flex-col lg:flex-row lg:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 flex-wrap">
        {/* 1. Show Filter */}
        <div className="flex items-center gap-2">
          <Text size="md" weight="semibold" className="text-text-description uppercase tracking-wider">
            Show
          </Text>
          <div className="flex items-center gap-1 bg-surface-primary-light/60 p-1 rounded-xl border border-border-secondary/40">
            {FILTER_OPTIONS.map(([key, label]) => {
              const isSelected = activeFilter === key;
              return (
                <Button
                  key={key}
                  type="button"
                  variant={isSelected ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => onFilterChange(key)}
                  className="h-7 px-2.5 cursor-pointer"
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 2. Resident Filter */}
        <div className="flex items-center gap-2">
          <Text size="md" weight="semibold" className="text-text-description uppercase tracking-wider">
            Resident
          </Text>
          <div className="flex items-center gap-1 bg-surface-primary-light/60 p-1 rounded-xl border border-border-secondary/40">
            <Button
              type="button"
              variant={selectedResidentId === "all" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onResidentChange("all")}
              className="h-7 px-2.5 rounded-lg cursor-pointer"
            >
              All
            </Button>
            {residents.slice(0, 5).map((r) => {
              const isSelected = selectedResidentId === r.id;
              const firstName = r.fullName.split(" ")[0] || r.fullName;
              return (
                <Button
                  key={r.id}
                  type="button"
                  variant={isSelected ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => onResidentChange(r.id)}
                  className="h-7 px-2.5 rounded-lg cursor-pointer"
                >
                  {firstName}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

    </Card>
  );
}
