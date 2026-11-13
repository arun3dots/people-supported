"use client";

import React from "react";
import { Card, Text } from "@repo/ui/components/ui";
import { TaskFilterType } from "./types";

interface TaskKpiCardsProps {
  myTasksCount: number;
  doneCount: number;
  dueNowCount: number;
  missedCount: number;
  refusedCount: number;
  activeFilter: TaskFilterType;
  onSelectFilter: (filter: TaskFilterType) => void;
}

export function TaskKpiCards({
  myTasksCount,
  doneCount,
  dueNowCount,
  missedCount,
  refusedCount,
  activeFilter,
  onSelectFilter,
}: TaskKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {/* 1. My tasks */}
      <Card
        variant="surface"
        className={`p-4 shadow-xs justify-between gap-1 cursor-pointer transition-all border ${
          activeFilter === "all" ? "border-primary" : "border-transparent hover:border-border-primary/40"
        }`}
        onClick={() => onSelectFilter("all")}
      >
        <Text size="md" weight="medium" variant="muted">
          Assigned patient tasks
        </Text>
        <Text as="span" size="2xl" weight="bold" className="text-text-heading">
          {myTasksCount}
        </Text>
        <Text size="md" variant="muted">
          for your assigned residents
        </Text>
      </Card>

      {/* 2. Done */}
      <Card
        variant="surface"
        className={`p-4 shadow-xs justify-between gap-1 cursor-pointer transition-all border ${
          activeFilter === "done" ? "border-primary" : "border-transparent hover:border-border-primary/40"
        }`}
        onClick={() => onSelectFilter("done")}
      >
        <Text size="md" weight="medium" variant="muted">
          Done
        </Text>
        <Text as="span" size="2xl" weight="bold" variant="success">
          {doneCount}
        </Text>
        <Text size="md" variant="muted">
          logged this shift
        </Text>
      </Card>

      {/* 3. Due now / overdue */}
      <Card
        variant="surface"
        className={`p-4 shadow-xs justify-between gap-1 cursor-pointer transition-all border ${
          activeFilter === "open" ? "border-primary" : "border-transparent hover:border-border-primary/40"
        }`}
        onClick={() => onSelectFilter("open")}
      >
        <Text size="md" weight="medium" variant="muted">
          Due now / overdue
        </Text>
        <Text
          as="span"
          size="2xl"
          weight="bold"
          variant={dueNowCount > 0 ? "warning" : "default"}
        >
          {dueNowCount}
        </Text>
        <Text size="md" variant="muted">
          needs attention
        </Text>
      </Card>

      {/* 4. Missed */}
      <Card
        variant="surface"
        className={`p-4 shadow-xs justify-between gap-1 cursor-pointer transition-all border ${
          activeFilter === "missed" ? "border-primary" : "border-transparent hover:border-border-primary/40"
        }`}
        onClick={() => onSelectFilter("missed")}
      >
        <Text size="md" weight="medium" variant="muted">
          Missed
        </Text>
        <Text
          as="span"
          size="2xl"
          weight="bold"
          variant={missedCount > 0 ? "destructive" : "default"}
        >
          {missedCount}
        </Text>
        <Text size="md" variant="muted">
          past grace period
        </Text>
      </Card>

      {/* 5. Refused */}
      <Card
        variant="surface"
        className={`p-4 shadow-xs justify-between gap-1 cursor-pointer transition-all border ${
          activeFilter === "refused" ? "border-primary" : "border-transparent hover:border-border-primary/40"
        }`}
        onClick={() => onSelectFilter("refused")}
      >
        <Text size="md" weight="medium" variant="muted">
          Refused
        </Text>
        <Text
          as="span"
          size="2xl"
          weight="bold"
          variant={refusedCount > 0 ? "warning" : "default"}
        >
          {refusedCount}
        </Text>
        <Text size="md" variant="muted">
          offer again, tell nurse
        </Text>
      </Card>
    </div>
  );
}
