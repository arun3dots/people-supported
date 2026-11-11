"use client";

import React from "react";
import { SquarePen } from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Button } from "@repo/ui/components/ui/Button";
import { Text } from "@repo/ui/components/ui/Text";
import { InvestigationStep } from "./InvestigationModal";

interface InvestigationDetailsCardProps {
  steps: InvestigationStep[];
  onOpenInvestigationModal: () => void;
  readOnly?: boolean;
}

export function InvestigationDetailsCard({
  steps,
  onOpenInvestigationModal,
  readOnly = false,
}: InvestigationDetailsCardProps) {
  return (
    <Card variant="surface">
      {/* Header with Title and Edit Icon Button */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Text size={'lg'} weight={'bold'}>
            Investigation Details
          </Text>
          <Text size={'md'} weight={'regular'} className="text-slate-500">
            Review and document the investigation findings for this incident.
          </Text>
        </div>

        {!readOnly && <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenInvestigationModal}
          className="size-9 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors shadow-none cursor-pointer"
        >
          <SquarePen className="size-4" />
        </Button>}
      </div>

      {/* Accordion Steps List */}
      <div className="space-y-2.5 pt-1">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-all"
            >
              <div className="w-full flex items-center p-3.5 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-800 shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <Text size={'md'} weight={'semibold'} className="text-slate-900 truncate">
                      {step.title}
                    </Text>
                    <Text size={'md'} weight={'regular'} className="text-slate-600 leading-relaxed">
                      {step.notes || "No investigation notes recorded for this step yet."}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
