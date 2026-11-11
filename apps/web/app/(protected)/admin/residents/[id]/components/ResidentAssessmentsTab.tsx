"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Plus } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import { useGetRiskAssessmentsQuery } from "../../../../../../lib/queries/risk";
import type { Resident } from "../../../../../../lib/types/resident";
import { RiskAssessmentTab } from "../../../../../shared/components/risk-assessment";
import { ObservationTab } from "../../../../../shared/components/ObservationTab";
import { BodyMapTab } from "../../../../../shared/components/body-map";
import { FluidIntakeTab } from "../../../../../shared/components/FluidIntakeTab";

interface UnifiedAssessmentRow {
  id: string;
  title: string;
  category: "Risk" | "Health" | "Functional" | "Capacity" | "Nutrition";
  result: string;
  completedDate: string;
  assessor: string;
  nextDueDate: string;
  status: "In date" | "Due soon" | "Overdue";
}

const DEFAULT_ASSESSMENT_ROWS: UnifiedAssessmentRow[] = [
  {
    id: "def-1",
    title: "Falls risk assessment",
    category: "Risk",
    result: "Low risk",
    completedDate: "12/08/2026",
    assessor: "Tom Reilly",
    nextDueDate: "12/02/2027",
    status: "In date",
  },
  {
    id: "def-2",
    title: "MUST nutrition screening",
    category: "Nutrition",
    result: "Score 0 — low risk",
    completedDate: "03/10/2026",
    assessor: "Sarah Jane (Nurse)",
    nextDueDate: "03/01/2027",
    status: "In date",
  },
  {
    id: "def-3",
    title: "Mental Capacity Assessment — finances",
    category: "Capacity",
    result: "Lacks capacity — best interests decision recorded",
    completedDate: "18/05/2026",
    assessor: "Ben Cannon",
    nextDueDate: "18/05/2027",
    status: "In date",
  },
  {
    id: "def-4",
    title: "Waterlow pressure area assessment",
    category: "Health",
    result: "Score 8 — not at risk",
    completedDate: "15/09/2026",
    assessor: "Sarah Jane (Nurse)",
    nextDueDate: "15/11/2026",
    status: "Due soon",
  },
  {
    id: "def-5",
    title: "Independent living skills (functional)",
    category: "Functional",
    result: "12 of 20 skills independent",
    completedDate: "01/07/2026",
    assessor: "Tom Reilly",
    nextDueDate: "01/01/2027",
    status: "In date",
  },
  {
    id: "def-6",
    title: "Behaviour & environmental risk",
    category: "Risk",
    result: "Medium — strategies in place",
    completedDate: "21/10/2026",
    assessor: "Hannah Clarke",
    nextDueDate: "21/01/2027",
    status: "In date",
  },
];

const CATEGORY_BADGE_MAP: Record<UnifiedAssessmentRow["category"], string> = {
  Risk: "bg-amber-50 text-amber-800 border-amber-200",
  Nutrition: "bg-orange-50 text-orange-800 border-orange-200",
  Capacity: "bg-slate-100 text-slate-700 border-slate-200",
  Health: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Functional: "bg-teal-50 text-teal-800 border-teal-200",
};

interface ResidentAssessmentsTabProps {
  resident: Resident;
  initialSubView?: "register" | "risk-matrix" | "observations" | "bodymap" | "fluid-intake";
}

export function ResidentAssessmentsTab({
  resident,
  initialSubView = "register",
}: ResidentAssessmentsTabProps): React.JSX.Element {
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [subView, setSubView] = useState<
    "register" | "risk-matrix" | "observations" | "bodymap" | "fluid-intake"
  >(initialSubView);

  const { data: liveRisks } = useGetRiskAssessmentsQuery({ residentId: resident.id });

  const rows: UnifiedAssessmentRow[] = useMemo(() => {
    const mappedLive: UnifiedAssessmentRow[] = (liveRisks ?? [])
      .filter((r) => r.status !== "Archived")
      .map((r) => {
        const titleLower = r.title.toLowerCase();
        const cat: UnifiedAssessmentRow["category"] = titleLower.includes("nutrition") ||
          titleLower.includes("must")
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
          assessor: r.reviewer?.fullName ?? r.approver?.fullName ?? "Care Team",
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

  const filteredRows = useMemo(() => {
    if (categoryFilter === "All") return rows;
    return rows.filter((r) => r.category === categoryFilter);
  }, [rows, categoryFilter]);

  const categories = ["All", "Risk", "Health", "Functional", "Capacity", "Nutrition"];

  return (
    <div className="space-y-6 font-sans">
      {/* 3 Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 space-y-1">
          <span className="text-md font-bold text-emerald-900">In date</span>
          <div className="text-2xl font-extrabold text-emerald-800">{counts.inDate}</div>
        </div>
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-1">
          <span className="text-md font-bold text-amber-900">Due within 30 days</span>
          <div className="text-2xl font-extrabold text-amber-800">{counts.dueSoon}</div>
        </div>
        <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-5 space-y-1">
          <span className="text-md font-bold text-red-900">Overdue</span>
          <div className="text-2xl font-extrabold text-red-700">{counts.overdue}</div>
        </div>
      </div>

      {/* Main Surface Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
        {/* Filter Pills + Clinical Sub-tools + New Assessment CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => {
              const active = subView === "register" && categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSubView("register");
                    setCategoryFilter(cat);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-md font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {cat}
                </button>
              );
            })}

            <span className="h-4 w-px bg-slate-200 mx-1" />

            {(
              [
                { id: "risk-matrix", label: "Interactive Risk Matrix" },
                { id: "observations", label: "Observations" },
                { id: "bodymap", label: "Body Map" },
                { id: "fluid-intake", label: "Fluid Intake" },
              ] as const
            ).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setSubView(tool.id)}
                className={`px-3.5 py-1.5 rounded-full text-md font-semibold transition-all cursor-pointer ${
                  subView === tool.id
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={() => setSubView("risk-matrix")}
            className="font-semibold text-md rounded-xl h-10 px-4 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" />
            New assessment
          </Button>
        </div>

        {/* Sub-view Display */}
        {subView === "register" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-md font-semibold text-slate-500">
                  <th className="py-3 px-3">Assessment</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Result</th>
                  <th className="py-3 px-3">Completed</th>
                  <th className="py-3 px-3">Next due</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-md">
                {filteredRows.map((row) => {
                  const isDueOrOverdue = row.status !== "In date";
                  const statusBadgeCls =
                    row.status === "Overdue"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : row.status === "Due soon"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200";

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <ClipboardList className="size-4 text-slate-500 shrink-0" />
                          <span>{row.title}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-semibold border ${CATEGORY_BADGE_MAP[row.category]}`}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td className="py-4 px-3 font-medium text-slate-700">{row.result}</td>
                      <td className="py-4 px-3">
                        <div className="font-semibold text-slate-800">{row.completedDate}</div>
                        <div className="text-slate-400">{row.assessor}</div>
                      </td>
                      <td
                        className={`py-4 px-3 font-bold ${
                          isDueOrOverdue ? "text-amber-700" : "text-slate-800"
                        }`}
                      >
                        {row.nextDueDate}
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-semibold border ${statusBadgeCls}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right">
                        {isDueOrOverdue ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSubView("risk-matrix")}
                            className="rounded-xl h-8 px-3 text-md font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Complete
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSubView("risk-matrix")}
                            className="border-slate-200 text-slate-700 rounded-xl h-8 px-3 text-md font-semibold cursor-pointer"
                          >
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
      </div>
    </div>
  );
}
