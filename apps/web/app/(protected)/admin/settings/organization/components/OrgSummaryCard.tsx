"use client";

import React from "react";
import { Contact, Layers, Calendar, Disc } from "lucide-react";
import { Card, Text, Badge } from "@repo/ui/components/ui";

interface OrgSummaryCardProps {
  id?: string;
  createdAt?: string;
  status?: string | null;
  packageName?: string | null;
}

export function OrgSummaryCard({
  id,
  createdAt,
  status,
  packageName,
}: OrgSummaryCardProps) {
  const formattedId = id
    ? `ORG-${id.slice(0, 8).toUpperCase()}`
    : "-";

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "-";

  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none w-full font-sans">
      {/* ==================== HEADER ==================== */}
      <div>
        <Text size={'base'} weight={'bold'} className="text-slate-900">
          Organisation Summary
        </Text>
        <Text size={'md'} weight={'regular'} className="text-slate-500">
          Account status and subscription details
        </Text>
      </div>

      {/* ==================== SUMMARY DETAILS ==================== */}
      <div className="flex flex-col divide-y divide-slate-100 text-md mt-1">
        {/* Organisation ID */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Contact className="size-4 text-emerald-800 shrink-0 stroke-[1.5]" />
            <Text size="md" weight="medium" className="text-slate-600">
              Organisation ID
            </Text>
          </div>
          <Text size="md" weight="semibold" className="text-slate-900 font-mono">
            {formattedId}
          </Text>
        </div>

        {/* Subscription Plan */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-emerald-800 shrink-0 stroke-[1.5]" />
            <Text size="md" weight="medium" className="text-slate-600">
              Subscription Plan
            </Text>
          </div>
          <Text size="md" weight="medium" className="text-slate-900">
            {packageName || "-"}
          </Text>
        </div>

        {/* Member Since */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-emerald-800 shrink-0 stroke-[1.5]" />
            <Text size="md" weight="medium" className="text-slate-600">
              Member Since
            </Text>
          </div>
          <Text size="md" weight="medium" className="text-slate-900">
            {formattedDate}
          </Text>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Disc className="size-4 text-emerald-800 shrink-0 stroke-[1.5]" />
            <Text size="md" weight="medium" className="text-slate-600">
              Status
            </Text>
          </div>
          {status ? (
            <Badge
              variant="secondary"
              state={
                status === "Suspended" || status === "Inactive"
                  ? "inactive"
                  : "success"
              }
              className="text-md"
            >
              {status}
            </Badge>
          ) : (
            <Text size="md" weight="medium" className="text-slate-900">
              -
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
}
