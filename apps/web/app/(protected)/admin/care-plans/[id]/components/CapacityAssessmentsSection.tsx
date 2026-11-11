"use client";

import { Card, CardContent, Button, Badge, Text } from "@repo/ui/components/ui";
import { Brain, CheckCircle2, XCircle, Calendar, Users } from "lucide-react";
import { MentalCapacityAssessmentDTO } from "@repo/schema";

interface CapacityAssessmentsSectionProps {
  assessments: MentalCapacityAssessmentDTO[];
  isLoading: boolean;
  onOpenCreateModal: () => void;
}

export function CapacityAssessmentsSection({
  assessments,
  isLoading,
  onOpenCreateModal,
}: CapacityAssessmentsSectionProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-md text-slate-500 font-['Outfit',sans-serif]">
        Loading MCA assessments...
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl space-y-2 font-['Outfit',sans-serif]">
        <Brain className="w-8 h-8 text-slate-300 mx-auto" />
        <Text size="sm" weight="semibold" className="text-slate-700">
          No Mental Capacity Assessments on Record
        </Text>
        <Text size="sm" variant="muted" className="max-w-md mx-auto">
          Under CQC Regulation 11, restrictive interventions (e.g. bed rails, sensor mats,
          covert medication) require a decision-specific statutory assessment.
        </Text>
        <Button
          size="sm"
          onClick={onOpenCreateModal}
          className="mt-2 text-md bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl"
        >
          + Record First Assessment
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-['Outfit',sans-serif]">
      {assessments.map((a) => (
        <Card key={a.id} className="border border-slate-200/80 bg-white rounded-2xl shadow-none">
          <CardContent className="p-4 sm:p-5 space-y-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" state="inactive" className="text-sm font-semibold">
                    {a.decisionType}
                  </Badge>
                  <span className="text-md font-semibold text-slate-900">
                    {a.specificDecision}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <Calendar className="size-3" />
                  <span>Assessed: {new Date(a.assessedAt).toLocaleDateString("en-GB")}</span>
                  <span>•</span>
                  <span>Assessor: {a.assessorName || "Registered Nurse / Manager"}</span>
                </div>
              </div>

              <div>
                {a.hasCapacity ? (
                  <Badge variant="secondary" state="success" className="gap-1 text-sm font-semibold">
                    <CheckCircle2 className="size-3" /> Has Capacity
                  </Badge>
                ) : (
                  <Badge variant="secondary" state="warning" className="gap-1 text-sm font-semibold">
                    <XCircle className="size-3" /> Lacks Capacity (Best Interests)
                  </Badge>
                )}
              </div>
            </div>

            {/* 4 Functional Stages */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Understand:</span>
                <span className={a.canUnderstandInfo ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                  {a.canUnderstandInfo ? "Yes" : "No"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Retain:</span>
                <span className={a.canRetainInfo ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                  {a.canRetainInfo ? "Yes" : "No"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Weigh/Use:</span>
                <span className={a.canWeighOrUseInfo ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                  {a.canWeighOrUseInfo ? "Yes" : "No"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Communicate:</span>
                <span className={a.canCommunicateDecision ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                  {a.canCommunicateDecision ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {/* Impairment Details */}
            {a.impairmentDetails && (
              <div className="text-md text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <strong className="text-slate-800">Stage 1 Impairment:</strong> {a.impairmentDetails}
              </div>
            )}

            {/* Consulted Persons if Best Interests */}
            {a.consultedPersons && Array.isArray(a.consultedPersons) && a.consultedPersons.length > 0 && (
              <div className="text-sm text-slate-600 space-y-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                <div className="flex items-center gap-1 font-semibold text-amber-900">
                  <Users className="size-3 text-amber-700" />
                  <span>Best Interests Consultations (Section 4):</span>
                </div>
                <div className="space-y-0.5 pl-4">
                  {(a.consultedPersons as Array<{ name: string; relationship: string; viewsExpressed: string }>).map((c, i) => (
                    <div key={i}>
                      <strong>{c.name}</strong> ({c.relationship}): &quot;{c.viewsExpressed}&quot;
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
