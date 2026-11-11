"use client";

import React from "react";
import { Badge, Button, Text } from "@repo/ui/components/ui";
import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useGetRiskAssessmentsQuery } from "../../../../../../lib/queries/risk/useRiskAssessments";
import type { RiskAssessmentResponse } from "../../../../../../lib/queries/risk/types";

interface CarePlanRiskSummaryCardProps {
  residentId: string;
}

export function CarePlanRiskSummaryCard({
  residentId,
}: CarePlanRiskSummaryCardProps) {
  const { data: riskAssessments, isLoading } = useGetRiskAssessmentsQuery(
    { residentId },
    { enabled: !!residentId },
  );

  const getRiskBadge = (level?: string | null) => {
    const l = (level || "medium").toLowerCase();
    if (l === "high" || l === "critical") {
      return (
        <Badge variant="destructive" className="text-sm font-bold px-2 py-0.5">
          HIGH
        </Badge>
      );
    }
    if (l === "low") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-semibold bg-emerald-100 text-emerald-800">
          LOW
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-semibold bg-amber-100 text-amber-800">
        MEDIUM
      </span>
    );
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return "Not Scheduled";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isOverdue = (dateStr?: string | Date | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs font-['Outfit',sans-serif]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-800 border border-amber-200/60">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <Text size="sm" weight="bold" className="text-slate-900">
              Live Clinical Risk Matrix (CQC Safe &amp; Responsive)
            </Text>
            <Text size="sm" variant="muted">
              Active risk assessments and review schedules for this resident
            </Text>
          </div>
        </div>

        <Link href={`/admin/residents/${residentId}?tab=riskassessment`}>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-md font-semibold rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Manage Assessments <ExternalLink className="size-3" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-md text-slate-500">
          Loading risk assessments...
        </div>
      ) : !riskAssessments || riskAssessments.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
          <ShieldCheck className="size-6 text-slate-400 mx-auto mb-1.5" />
          <Text size="sm" weight="medium" className="text-slate-600">
            No active risk assessments on record.
          </Text>
          <Text size="sm" variant="muted">
            Assessments logged in the Risk module automatically populate this table and the exported Care Plan.
          </Text>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/70">
          <table className="w-full text-left text-md">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200/70">
              <tr>
                <th className="py-2.5 px-3">Risk Assessment Area</th>
                <th className="py-2.5 px-3">Current Level</th>
                <th className="py-2.5 px-3">Score / Findings</th>
                <th className="py-2.5 px-3">Last Assessed</th>
                <th className="py-2.5 px-3">Next Review Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskAssessments.map((ra: RiskAssessmentResponse) => {
                const overdue = isOverdue(ra.nextReviewDate);
                const currentLevel = ra.residualLevel || ra.inherentLevel;
                return (
                  <tr key={ra.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {ra.title || ra.category || "Clinical Risk"}
                    </td>
                    <td className="py-2.5 px-3">{getRiskBadge(currentLevel)}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {ra.hazardDescription || (ra.tool ? `Tool: ${ra.tool}` : "Standard Protocol")}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {formatDate(ra.createdAt)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          overdue
                            ? "text-rose-600 font-semibold flex items-center gap-1"
                            : "text-slate-600"
                        }
                      >
                        {formatDate(ra.nextReviewDate)}
                        {overdue && (
                          <span className="text-sm bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-sm">
                            Overdue
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
