"use client";

import React from "react";
import { Card, Text } from "@repo/ui/components/ui";

interface CarerIncidentKPICardsProps {
  openCount: number;
  candourCount: number;
  cqcCount: number;
  fallsCount: number;
}

export function CarerIncidentKPICards({
  openCount,
  candourCount,
  cqcCount,
  fallsCount,
}: CarerIncidentKPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Open */}
      <Card variant="surface" className="p-5 shadow-xs justify-between gap-2">
        <Text size="md" weight="medium" variant="muted">
          Open
        </Text>
        <div>
          <Text as="span" size="3xl" weight="bold" variant="warning">
            {openCount}
          </Text>
        </div>
        <Text size="md" variant="muted">
          awaiting RM review
        </Text>
      </Card>

      {/* Candour clocks */}
      <Card variant="surface" className="p-5 shadow-xs justify-between gap-2">
        <Text size="md" weight="medium" variant="muted">
          Candour clocks
        </Text>
        <div>
          <Text
            as="span"
            size="3xl"
            weight="bold"
            variant={candourCount > 0 ? "destructive" : "success"}
          >
            {candourCount}
          </Text>
        </div>
        <Text size="md" variant="muted">
          written notification due
        </Text>
      </Card>

      {/* CQC notifications */}
      <Card variant="surface" className="p-5 shadow-xs justify-between gap-2">
        <Text size="md" weight="medium" variant="muted">
          CQC notifications
        </Text>
        <div>
          <Text
            as="span"
            size="3xl"
            weight="bold"
            variant={cqcCount > 0 ? "warning" : "default"}
          >
            {cqcCount}
          </Text>
        </div>
        <Text size="md" variant="muted">
          Reg 18 not yet sent
        </Text>
      </Card>

      {/* Falls (30 days) */}
      <Card variant="surface" className="p-5 shadow-xs justify-between gap-2">
        <Text size="md" weight="medium" variant="muted">
          Falls (30 days)
        </Text>
        <div>
          <Text as="span" size="3xl" weight="bold">
            {fallsCount}
          </Text>
        </div>
        <Text size="md" variant="muted">
          trend input
        </Text>
      </Card>
    </div>
  );
}
