"use client";

import React, { useState } from "react";
import { Badge, Button, Card, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

interface CarePlanRecordSidebarProps {
  resident: any;
  plan: any;
}

export function CarePlanRecordSidebar({ resident, plan }: CarePlanRecordSidebarProps) {
  const [selectedInterval, setSelectedInterval] = useState("30d");
  const intervals = ["7d", "30d", "60d", "90d", "180d"];

  const planId = plan?.versionNumber
    ? `CP-${String(plan.versionNumber).padStart(4, "0")}`
    : plan?.id
      ? `CP-${plan.id.slice(0, 4).toUpperCase()}`
      : "Not registered";
  const createdDate = plan?.createdAt
    ? new Date(plan.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Not established";
  const authorName = plan?.primaryDoctor?.fullName || resident?.keyworker?.fullName || "Unassigned staff";

  const allAllergies = [
    ...(resident?.careProfile?.allergies || []),
    ...(resident?.careProfile?.medicationAllergies || []),
    ...(resident?.careProfile?.foodAllergies || []),
  ];

  const riskFactors = resident?.riskAssessments?.length
    ? resident.riskAssessments.map((r: any) => `${r.type || r.title || "Risk"}: ${r.overallRisk || r.score || "Monitored"}`)
    : resident?.careProfile?.chronicConditions?.length
      ? resident.careProfile.chronicConditions
      : [];

  const residentIdentifier = resident?.nhsNumber || resident?.profile?.nationalId || resident?.id?.slice(0, 8) || "N/A";

  return (
    <Card
      variant="surface"
      className="w-full lg:w-72 xl:w-80 shrink-0 p-4 sm:p-5 gap-4 self-start font-sans text-md"
    >
      {/* Top Header */}
      <div>
        <Text as="h3" size="md" weight="bold" className="text-slate-900 tracking-tight">
          From the resident record
        </Text>
        <Text size="md" variant="muted" className="mt-0.5 leading-snug">
          Read-only references to {residentIdentifier}. Edit these in the profile; they are never copied into the plan.
        </Text>
      </div>

      {/* Allergies Box */}
      <div className="space-y-1">
        <Text size="md" weight="bold" className="text-slate-700">
          Allergies
        </Text>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-md text-slate-800">
          ALLERGIES: {allAllergies.length > 0 ? allAllergies.join(", ") : "NKDA"}
        </div>
      </div>

      {/* DNACPR Box */}
      <div className="space-y-1">
        <Text size="md" weight="bold" className="text-slate-700">
          DNACPR
        </Text>
        <div className={cn(
          "p-2 rounded-xl border text-md font-mono",
          resident?.dnarStatus
            ? "border-amber-400 bg-amber-50 text-amber-900"
            : "border-dashed border-rose-300 bg-rose-50/50 text-rose-800"
        )}>
          {resident?.dnarStatus ? "DNACPR RECORDED" : "DNACPR not recorded"}
        </div>
      </div>

      {/* Legal Status */}
      <div className="space-y-1">
        <Text size="md" weight="bold" className="text-slate-700">
          Legal status
        </Text>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-md">
          {resident?.admission?.legalStatus || resident?.profile?.legalStatus || "— None recorded"}
        </div>
      </div>

      {/* Risk Flags */}
      <div className="space-y-1">
        <Text size="md" weight="bold" className="text-slate-700">
          Risk flags
        </Text>
        {riskFactors.length > 0 ? (
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-md font-semibold space-y-1">
            {riskFactors.slice(0, 3).map((rf: string, idx: number) => (
              <div key={idx}>
                <span className="font-bold">RISK:</span> {rf}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-md">
            — None recorded
          </div>
        )}
      </div>

      {/* Medication Alerts */}
      <div className="space-y-1">
        <Text size="md" weight="bold" className="text-slate-700">
          Medication alerts
        </Text>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-md">
          {resident?.careProfile?.medicationAllergies?.length
            ? `Allergy: ${resident.careProfile.medicationAllergies.join(", ")}`
            : "— None recorded"}
        </div>
      </div>

      {/* Plan Details Group */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <Text as="h4" size="md" weight="bold" className="text-slate-900">
          Plan details
        </Text>

        <div className="space-y-1.5 text-md">
          <div className="flex justify-between items-baseline">
            <span className="text-slate-500">Plan ID</span>
            <span className="font-mono font-medium text-slate-800">{planId}</span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-slate-500">Created</span>
            <span className="text-slate-800 text-right">
              {createdDate} <br />
              <span className="text-slate-500">by {authorName}</span>
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-slate-500">Last approved</span>
            <span className="text-slate-500">—</span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-slate-500">Next review</span>
            <span className="text-slate-800">Set on approval</span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-slate-500">Interval</span>
            <span className="text-slate-800">30 days</span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-slate-500">Responsible</span>
            <span className="text-slate-800 text-right">
              {authorName} <br />
              <span className="text-slate-500">(RN)</span>
            </span>
          </div>
        </div>

        {/* Responsible Person Field */}
        <div className="pt-1 space-y-1">
          <Text size="md" weight="medium" className="text-slate-700 text-md">
            Responsible person
          </Text>
          <div className="p-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-md">
            {authorName} (RN)
          </div>
        </div>

        {/* Review Interval Toggle Group */}
        <div className="space-y-1.5 pt-1">
          <Text size="md" weight="medium" className="text-slate-700 text-md">
            Review interval
          </Text>
          <div className="grid grid-cols-5 gap-1 bg-slate-100/80 p-1 rounded-xl">
            {intervals.map((intv) => (
              <Button
                key={intv}
                type="button"
                variant={selectedInterval === intv ? "primary" : "ghost"}
                size="sm"
                onClick={() => setSelectedInterval(intv)}
                className={cn(
                  "h-7 py-1 px-1 text-md font-semibold rounded-lg cursor-pointer text-center",
                  selectedInterval === intv
                    ? "shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                {intv}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
