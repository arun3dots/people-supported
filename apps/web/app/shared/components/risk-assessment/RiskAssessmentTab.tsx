"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button, Spinner, Card, Badge, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { format } from "date-fns";
import {
  useGetRiskAssessmentsQuery,
  useDeleteRiskAssessmentMutation,
  type RiskAssessmentResponse,
} from "../../../../lib/queries/risk";
import { useAuth } from "../../../../lib/context/AuthContext";
import { RiskAssessmentDialog } from "./RiskAssessmentDialog";
import { RiskAssessmentDetailPanel } from "./RiskAssessmentDetailPanel";
import { getRiskLevelStyle, getStatusStyle } from "./risk-utils";
import { RISK_CATEGORIES_CONFIG, type RiskCategoryConfigItem } from "./risk-categories.config";
import { canCreateRiskAssessment } from "./risk-access";
import type { RiskCategory } from "@repo/schema";

interface Props {
  residentId: string;
  residentStatus?: string;
  isDraft?: boolean;
}

export function RiskAssessmentTab({ residentId, residentStatus, isDraft = false }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<{ title: string; templateName: string; tool?: string; category?: RiskCategory } | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const { data: assessments, isLoading, isError, refetch } = useGetRiskAssessmentsQuery({ residentId });
  const remove = useDeleteRiskAssessmentMutation();
  const { user } = useAuth();
  const permissions = user?.permissions?.riskAssessments;
  const isDischarged = residentStatus === "Discharged";
  const canCreate = canCreateRiskAssessment(
    user?.roleName,
    permissions?.write,
    isDischarged,
  );

  const assessmentMap = useMemo(() => {
    const map = new Map<string, RiskAssessmentResponse>();
    (assessments || []).forEach((a) => {
      if (a.status !== "Archived") {
        map.set(a.title.toLowerCase(), a);
        if (a.template?.name) {
          map.set(a.template.name.toLowerCase(), a);
        }
      }
    });
    return map;
  }, [assessments]);

  const handleOpenAssessment = (item: RiskCategoryConfigItem) => {
    const category: RiskCategory = item.title.includes("Behaviour")
      ? "Behavioral"
      : item.title.includes("Safety") || item.title.includes("Bed Rails")
        ? "Environmental"
        : "Clinical";
    setSelectedRiskCategory({
      title: item.title,
      templateName: item.templateName,
      tool: item.tool,
      category,
    });
    setEditingAssessment(null);
    setDialogOpen(true);
  };

  const handleEditAssessment = (assessment: RiskAssessmentResponse) => {
    setEditingAssessment(assessment);
    setSelectedRiskCategory({
      title: assessment.title,
      templateName: assessment.template?.name || assessment.title,
    });
    setDialogOpen(true);
  };

  const handleCardClick = (item: RiskCategoryConfigItem, matching?: RiskAssessmentResponse | null) => {
    if (matching) {
      setSelectedAssessment(matching);
      setViewModalOpen(true);
    } else if (canCreate) {
      handleOpenAssessment(item);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-red-600 font-semibold text-md">Failed to load risk assessments.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RISK_CATEGORIES_CONFIG.map((item) => {
          const matching =
            assessmentMap.get(item.title.toLowerCase()) ||
            assessmentMap.get(item.templateName.toLowerCase()) ||
            (assessments || []).find((a) => {
              if (a.status === "Archived") return false;
              const aTitle = a.title.toLowerCase();
              const tName = item.templateName.toLowerCase();
              const iTitle = item.title.toLowerCase();
              return (
                aTitle === iTitle ||
                (a.template?.name && a.template.name.toLowerCase() === tName) ||
                aTitle.includes(tName) ||
                tName.includes(aTitle)
              );
            });

          const effectiveLevel = matching
            ? (matching.residualLevel ?? matching.inherentLevel)
            : null;
          const ls = effectiveLevel ? getRiskLevelStyle(effectiveLevel) : null;
          const ss = matching ? getStatusStyle(matching.status) : null;
          const score = matching ? (matching.residualScore ?? matching.inherentScore) : null;
          const nextReview = matching?.nextReviewDate
            ? new Date(matching.nextReviewDate).toLocaleDateString()
            : null;
          const createdTime = matching?.createdAt
            ? (() => {
                try {
                  return format(new Date(matching.createdAt), "HH:mm");
                } catch {
                  return null;
                }
              })()
            : null;

          return (
            <Card
              key={item.title}
              border="secondary"
              style={{ border: "1px solid #cbd5e1" }}
              onClick={() => handleCardClick(item, matching)}
              className="p-4 flex flex-col justify-between gap-3 border border-slate-300 bg-white rounded-2xl shadow-xs cursor-pointer hover:border-slate-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                {matching && score !== null ? (
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/80 font-bold text-base shadow-xs",
                      ls?.bg || "bg-slate-100",
                      ls?.text || "text-slate-800"
                    )}
                  >
                    {score}
                  </div>
                ) : (
                  <div className="size-10 rounded-xl flex items-center justify-center shrink-0 border border-dashed border-slate-300 text-slate-400 font-semibold text-base bg-slate-50/60">
                    -
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <Text size="md" weight="medium" className="text-slate-900 truncate">
                      {item.title}
                    </Text>
                    {matching && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ss && (
                          <Badge className={cn(ss.className, "text-md")}>
                            {ss.label}
                          </Badge>
                        )}
                        {effectiveLevel && ls && (
                          <Badge
                            variant="secondary"
                            className={cn(ls.badge, "text-md")}
                          >
                            {effectiveLevel}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Line 1: Tool, Line 2: Next review and time */}
                  <div className="space-y-0.5 text-md">
                    <p className={cn(matching ? "text-slate-600" : "text-slate-500", "truncate")}>
                      Tool: {matching?.tool || item.tool}
                    </p>
                    <p className={cn(matching ? "text-slate-600" : "text-slate-400 italic", "truncate")}>
                      {matching ? (
                        <>
                          Next review: {nextReview || item.review}
                          {createdTime && <span className="text-slate-400"> · {createdTime}</span>}
                        </>
                      ) : (
                        "Not assessed yet"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5 flex-wrap">
                {matching && matching.status === "Draft" ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAssessment(matching);
                      }}
                      className="h-8 px-3 text-md text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                      title="Edit draft"
                    >
                      <Edit2 className="size-3.5" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this draft assessment?")) {
                          remove.mutate(matching.id);
                        }
                      }}
                      disabled={remove.isPending}
                      className="h-8 px-3 text-md text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg font-medium"
                      title="Delete draft"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </Button>
                  </>
                ) : matching ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAssessment(matching);
                      }}
                      className="h-8 px-3 text-md text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                      title="Edit assessment"
                    >
                      <Edit2 className="size-3.5" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAssessment(matching);
                        setViewModalOpen(true);
                      }}
                      className="h-8 px-3.5 text-md rounded-xl cursor-pointer font-medium"
                    >
                      View record
                    </Button>
                  </>
                ) : canCreate ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAssessment(item);
                    }}
                    className="h-8 px-3.5 text-md rounded-xl gap-1.5 cursor-pointer font-medium bg-emerald-800 hover:bg-emerald-900 text-white"
                  >
                    <Plus className="size-3.5" />
                    <span>{item.buttonLabel}</span>
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {/* View Modal */}
      <RiskAssessmentDetailPanel
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        assessment={selectedAssessment}
      />

      {/* Create / Edit Modal */}
      <RiskAssessmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedRiskCategory(null);
            setEditingAssessment(null);
          }
        }}
        residentId={residentId}
        initialTitle={selectedRiskCategory?.title}
        initialTemplateName={selectedRiskCategory?.templateName}
        initialCategory={selectedRiskCategory?.category}
        initialTool={selectedRiskCategory?.tool}
        editingAssessment={editingAssessment}
      />
    </div>
  );
}
