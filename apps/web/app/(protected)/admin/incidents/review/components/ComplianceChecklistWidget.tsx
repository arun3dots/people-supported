"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Badge } from "@repo/ui/components/ui/Badge";
import { Text } from "@repo/ui/components/ui/Text";

export interface ComplianceItem {
  id: string;
  title: string;
  timestamp?: string;
  status: "Completed" | "Pending";
}

interface ComplianceChecklistWidgetProps {
  items?: ComplianceItem[];
}

const DEFAULT_CHECKLIST: ComplianceItem[] = [
  {
    id: "c-1",
    title: "Family Notified",
    timestamp: "12 May, 10:45 AM",
    status: "Completed",
  },
  {
    id: "c-4",
    title: "RCA Completed",
    timestamp: "12 May, 11:30 AM",
    status: "Completed",
  },
  {
    id: "c-5",
    title: "Action Plan Created",
    timestamp: "12 May, 12:00 PM",
    status: "Completed",
  },
];

export function ComplianceChecklistWidget({
  items = DEFAULT_CHECKLIST,
}: ComplianceChecklistWidgetProps) {
  return (
    <Card variant="surface">
      <Text size={'lg'} weight={'bold'} className="text-slate-900">
        Compliance Checklist
      </Text>

      <div className="space-y-2.5">
        {items.map((item) => {
          const isDone = item.status === "Completed";
          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-1 text-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isDone ? (
                  <CheckCircle2 className="size-4 text-emerald-600 fill-emerald-100 shrink-0" />
                ) : (
                  <Circle className="size-4 text-amber-500 shrink-0 stroke-[2]" />
                )}
                <Text size={'md'} weight={'medium'} className="text-slate-800 truncate">
                  {item.title}
                </Text>
              </div>

              {isDone ? (
                <Text size={'md'} weight={'regular'} className="text-slate-400 shrink-0 pl-2">
                  {item.timestamp}
                </Text>
              ) : (
                <Badge
                  variant="secondary"
                  state="warning"
                >
                  Pending
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
