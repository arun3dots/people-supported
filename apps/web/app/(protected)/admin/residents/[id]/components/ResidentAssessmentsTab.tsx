"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button, Card, SummaryCardsGrid } from "@repo/ui/components/ui";
import { useGetRiskAssessmentsQuery } from "../../../../../../lib/queries/risk";
import type { Resident } from "../../../../../../lib/types/resident";
import { RiskAssessmentTab } from "../../../../../shared/components/risk-assessment";
import { ObservationTab } from "../../../../../shared/components/ObservationTab";
import { BodyMapTab } from "../../../../../shared/components/body-map";
import { FluidIntakeTab } from "../../../../../shared/components/FluidIntakeTab";
import { PreAdmissionAssessmentStep } from "../../../../resident/admit/pre-admission/parts/PreAdmissionAssessmentStep";
import {
  AssessmentRegisterSection,
  DEFAULT_ASSESSMENT_ROWS,
  type UnifiedAssessmentRow,
} from "./AssessmentRegisterSection";

type AssessmentSubView =
  | "register"
  | "care-needs"
  | "risk-matrix"
  | "observations"
  | "bodymap"
  | "fluid-intake";

interface ResidentAssessmentsTabProps {
  resident: Resident;
  initialSubView?: AssessmentSubView;
}

const CLINICAL_TOOLS = [
  { id: "care-needs", label: "Care Needs" },
  { id: "risk-matrix", label: "Interactive Risk Matrix" },
  // { id: "observations", label: "Observations" },
  // { id: "bodymap", label: "Body Map" },
  // { id: "fluid-intake", label: "Fluid Intake" },
] as const;

export function ResidentAssessmentsTab({
  resident,
  initialSubView = "register",
}: ResidentAssessmentsTabProps): React.JSX.Element {
  const [subView, setSubView] = useState<AssessmentSubView>(initialSubView);

  const { data: liveRisks } = useGetRiskAssessmentsQuery({ residentId: resident.id });

  const rows: UnifiedAssessmentRow[] = useMemo(() => {
    const mappedLive: UnifiedAssessmentRow[] = (liveRisks ?? [])
      .filter((r) => r.status !== "Archived")
      .map((r) => {
        const titleLower = r.title.toLowerCase();
        const cat: UnifiedAssessmentRow["category"] =
          titleLower.includes("nutrition") || titleLower.includes("must")
            ? "Nutrition"
            : titleLower.includes("capacity")
              ? "Capacity"
              : titleLower.includes("waterlow") || titleLower.includes("clinical")
                ? "Health"
                : titleLower.includes("functional") || titleLower.includes("mobility")
                  ? "Functional"
                  : "Risk";

        const reviewDateObj = r.nextReviewDate ? new Date(r.nextReviewDate) : null;
        const now = new Date();
        const daysUntil = reviewDateObj
          ? Math.ceil((reviewDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 60;

        const status: UnifiedAssessmentRow["status"] =
          daysUntil < 0 ? "Overdue" : daysUntil <= 30 ? "Due soon" : "In date";

        const level = r.residualLevel ?? r.inherentLevel;
        const score = r.residualScore ?? r.inherentScore;

        return {
          id: r.id,
          title: r.title,
          category: cat,
          result: `${level} risk${score != null ? ` (Score ${score})` : ""}`,
          completedDate: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("en-GB")
            : "12/08/2026",
          assessor: r.reviewer?.fullName ?? r.approver?.fullName ?? "Supported Worker",
          nextDueDate: reviewDateObj
            ? reviewDateObj.toLocaleDateString("en-GB")
            : "12/02/2027",
          status,
        };
      });

    return mappedLive.length > 0 ? mappedLive : DEFAULT_ASSESSMENT_ROWS;
  }, [liveRisks]);

  const counts = useMemo(() => {
    const inDate = rows.filter((r) => r.status === "In date").length;
    const dueSoon = rows.filter((r) => r.status === "Due soon").length;
    const overdue = rows.filter((r) => r.status === "Overdue").length;
    return { inDate, dueSoon, overdue };
  }, [rows]);

  const summaryCards = useMemo(
    () => [
      {
        title: "In date",
        value: counts.inDate,
        subtitle: "Current assessments",
        icon: <CheckCircle2 className="size-5 text-emerald-700" />,
        iconClassName: "bg-emerald-50",
      },
      {
        title: "Due within 30 days",
        value: counts.dueSoon,
        subtitle: "Reviews scheduled",
        subtitleColor: counts.dueSoon > 0 ? "text-amber-700" : undefined,
        icon: <Clock className="size-5 text-amber-700" />,
        iconClassName: "bg-amber-50",
      },
      {
        title: "Overdue",
        value: counts.overdue,
        subtitle: counts.overdue > 0 ? "Requires action" : "All up to date",
        subtitleColor: counts.overdue > 0 ? "text-text-error" : undefined,
        icon: <AlertCircle className="size-5 text-red-700" />,
        iconClassName: "bg-red-50",
      },
    ],
    [counts],
  );

  return (
    <div className="space-y-6 font-sans">
      {/* 3 Top Summary KPI Cards */}
      <SummaryCardsGrid
        cards={summaryCards}
        className="grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
      />

      {/* Main Surface Card */}
      <Card variant="surface" className="p-5 sm:p-6 space-y-5">
        {/* Clinical Sub-tools */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {CLINICAL_TOOLS.map((tool) => {
              const active = subView === tool.id;
              return (
                <Button
                  key={tool.id}
                  type="button"
                  size="sm"
                  variant={active ? "primary" : "outline"}
                  onClick={() => setSubView(tool.id)}
                  className={active ? "rounded-full" : "rounded-full bg-white"}
                >
                  {tool.label}
                </Button>
              );
            })}
          </div>

        </div>

        {/* Sub-view Display */}
        {subView === "register" && (
          <AssessmentRegisterSection
            rows={rows}
            onOpenRiskMatrix={() => setSubView("risk-matrix")}
          />
        )}

        {subView === "care-needs" && (
          <PreAdmissionAssessmentStep
            residentId={resident.id}
            embedded
            onGoToStepOne={() => setSubView("register")}
            onGoToRiskStep={() => setSubView("risk-matrix")}
          />
        )}

        {subView === "risk-matrix" && (
          <RiskAssessmentTab
            residentId={resident.id}
            residentStatus={resident.status}
            isDraft={resident.isDraft}
          />
        )}

        {subView === "observations" && (
          <ObservationTab
            residentId={resident.id}
            residentStatus={resident.status}
            isDraft={resident.isDraft}
          />
        )}

        {subView === "bodymap" && (
          <BodyMapTab residentId={resident.id} resident={resident} />
        )}

        {subView === "fluid-intake" && (
          <FluidIntakeTab
            residentId={resident.id}
            residentStatus={resident.status}
            isDraft={resident.isDraft}
          />
        )}
      </Card>
    </div>
  );
}
