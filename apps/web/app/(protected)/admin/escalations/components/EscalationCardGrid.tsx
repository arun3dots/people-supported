"use client";

import React from "react";
import { FileCheck } from "lucide-react";
import { Button, Badge, Card, Text } from "@repo/ui/components/ui";
import { ClinicalEscalationItemDTO } from "@repo/schema";
import { cn } from "@repo/ui/lib/utils";

export interface EscalationCardProps {
  item: ClinicalEscalationItemDTO;
  onSignOff: (item: ClinicalEscalationItemDTO) => void;
}

export function EscalationCard({ item, onSignOff }: EscalationCardProps) {
  const residentName = item.resident?.fullName || "Resident";
  const roomNumber = item.resident?.bed?.room?.roomNumber;
  const createdDate = new Date(item.createdAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getSeverityBadge = (sev?: string) => {
    switch ((sev || "Medium").toLowerCase()) {
      case "critical":
        return <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800 font-bold">Critical</Badge>;
      case "high":
        return <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800 font-bold">High</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 font-bold">Medium</Badge>;
    }
  };

  return (
    <Card className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/30 hover:bg-white transition-all space-y-3 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {getSeverityBadge(item.severity)}
            <Badge variant="outline" className="text-md font-bold text-slate-700 border-slate-200 bg-white">
              {item.reason}
            </Badge>
            <Text size="md" weight="semibold" className="text-slate-900 ml-1">{residentName}</Text>
            {roomNumber && (
              <Text size="md" className="text-slate-500">(Room {roomNumber})</Text>
            )}
            <Text size="md" className="text-slate-400 ml-auto sm:ml-2">{createdDate}</Text>
          </div>

          <Text size="md" weight="medium" className="text-slate-700">
            {item.initialNotes}
          </Text>

          {item.sbarAssessment && (
            <div className="text-md text-slate-600 bg-slate-100/70 p-2.5 rounded-lg mt-2">
              <span className="font-bold text-slate-800 mr-1">Nurse SBAR Assessment:</span>
              {item.sbarAssessment}
            </div>
          )}

          {item.managerNotes && (
            <div className="text-md text-purple-900 bg-purple-50 p-2.5 rounded-lg border border-purple-200 mt-2">
              <span className="font-bold mr-1">Manager Review:</span>
              {item.managerNotes}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSignOff(item);
            }}
            className="h-10 px-4 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-semibold text-md gap-1.5 shadow-none cursor-pointer"
          >
            <FileCheck className="size-4" />
            {item.managerSignedAt ? "Update Sign-off" : "Manager Sign-off"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export interface EscalationCardGridProps {
  paginatedItems: ClinicalEscalationItemDTO[];
  onSignOff: (item: ClinicalEscalationItemDTO) => void;
}

export function EscalationCardGrid({
  paginatedItems,
  onSignOff,
}: EscalationCardGridProps) {
  if (!paginatedItems || paginatedItems.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {paginatedItems.map((item) => (
        <EscalationCard
          key={item.id}
          item={item}
          onSignOff={onSignOff}
        />
      ))}
    </div>
  );
}
