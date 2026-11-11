"use client";

import React from "react";
import { Card, Text, Badge } from "@repo/ui/components/ui";

export function OrgComplianceCard() {
  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none w-full">
      {/* ==================== HEADER ==================== */}
      <div>
        <Text as="h3" size="md" weight="semibold" className="text-slate-900">
          Compliance & Registration
        </Text>
        <Text size="md" variant="muted" className="text-slate-500">
          Regulatory and compliance details
        </Text>
      </div>

      {/* ==================== CONTENT LIST ==================== */}
      <div className="flex flex-col divide-y divide-slate-100 text-md mt-1">
        {/* CQC Rating */}
        <div className="flex items-center justify-between py-2.5">
          <Text size="md" variant="muted" className="text-slate-600 font-medium">
            CQC Rating
          </Text>
          <div className="flex items-center gap-2">
            <Badge state="success">Good</Badge>
            <button
              type="button"
              className="text-md text-emerald-800 font-medium hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              View Report
            </button>
          </div>
        </div>

        {/* Registration Date */}
        <div className="flex items-center justify-between py-2.5">
          <Text size="md" variant="muted" className="text-slate-600 font-medium">
            Registration Date
          </Text>
          <Text size="md" weight="medium" className="text-slate-900">
            10 Nov 2018
          </Text>
        </div>

        {/* Next Inspection Date */}
        <div className="flex items-center justify-between py-2.5">
          <Text size="md" variant="muted" className="text-slate-600 font-medium">
            Next Inspection Date
          </Text>
          <Text size="md" weight="medium" className="text-slate-900">
            15 Jan 2027
          </Text>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-2.5">
          <Text size="md" variant="muted" className="text-slate-600 font-medium">
            Inspection Window
          </Text>
          <div className="flex flex-col items-end">
            <Text size="md" weight="medium" className="text-slate-900">
              12 Nov 2026
            </Text>
            <Text size="md" variant="muted" className="text-slate-500">
              300 days remaining
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
}