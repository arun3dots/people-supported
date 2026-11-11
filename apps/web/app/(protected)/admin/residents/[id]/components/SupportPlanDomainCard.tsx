"use client";

import React from "react";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button, Card, Text } from "@repo/ui/components/ui";
import type { SupportedLivingDomainItemDTO } from "@repo/schema";

interface SupportPlanDomainCardProps {
  domain: SupportedLivingDomainItemDTO;
  isExpanded: boolean;
  canEdit: boolean;
  onToggle: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

export function SupportPlanDomainCard({
  domain,
  isExpanded,
  canEdit,
  onToggle,
  onEdit,
}: SupportPlanDomainCardProps) {
  return (
    <Card variant="surface" className="overflow-hidden transition-all">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-100/60 transition-colors cursor-pointer"
      >
        <div className="space-y-0.5 min-w-0">
          <Text as="h3" size="md" weight="semibold" className="text-slate-900">
            {domain.domain}
          </Text>
          <Text size="sm" variant="muted" className="truncate">
            Outcome: {domain.outcomeSummary ?? "Maintain independence"} · Updated{" "}
            {domain.updatedAt ?? "21/10/2026"}
          </Text>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 px-2.5 text-slate-600 hover:text-slate-900"
            >
              <Pencil className="size-3.5 mr-1" />
              Edit
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="size-4 text-slate-400" />
          ) : (
            <ChevronDown className="size-4 text-slate-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-200/70 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <Card variant="white" border="secondary" className="p-4 space-y-1.5">
            <Text
              size="xs"
              weight="medium"
              variant="muted"
              className="uppercase tracking-wider"
            >
              What I Need
            </Text>
            <Text size="md" weight="normal" className="text-slate-800 leading-relaxed">
              {domain.whatINeed ?? "Consistent daily support tailored to preferences."}
            </Text>
          </Card>

          <Card variant="white" border="secondary" className="p-4 space-y-1.5">
            <Text
              size="xs"
              weight="medium"
              variant="muted"
              className="uppercase tracking-wider"
            >
              How to Support Me
            </Text>
            <Text size="md" weight="normal" className="text-slate-800 leading-relaxed">
              {domain.howToSupportMe ??
                "Follow person-centred guidance and encourage independence."}
            </Text>
          </Card>

          <Card variant="secondary" border="secondary" className="p-4 space-y-1.5">
            <Text
              size="xs"
              weight="medium"
              variant="primary"
              className="uppercase tracking-wider"
            >
              Staffing
            </Text>
            <Text size="md" weight="medium" className="text-slate-900 leading-relaxed">
              {domain.staffing ?? "Key worker, 1h weekly"}
            </Text>
          </Card>
        </div>
      )}
    </Card>
  );
}
