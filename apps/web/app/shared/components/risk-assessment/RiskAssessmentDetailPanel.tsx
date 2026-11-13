"use client";

import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@repo/ui/components/ui";
import {
  type RiskAssessmentResponse,
  useTransitionRiskAssessmentMutation,
} from "../../../../lib/queries/risk";
import { useAuth } from "../../../../lib/context/AuthContext";
import { RiskMatrixGrid } from "./RiskMatrixGrid";
import { RiskWorkflowBadge } from "./RiskWorkflowBadge";
import { RiskControlsList } from "./RiskControlsList";
import { formatReviewDate } from "./risk-utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment?: RiskAssessmentResponse | null;
}

export function RiskAssessmentDetailPanel({ open, onOpenChange, assessment }: Props) {
  const { user } = useAuth();
  const transition = useTransitionRiskAssessmentMutation();
  const canApprove = !!user?.permissions?.riskAssessments?.approve;

  if (!assessment) return null;

  const factors = Array.isArray(assessment.factors) ? (assessment.factors as string[]) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="p-5 sm:p-7 max-h-[90vh] overflow-y-auto font-sans rounded-2xl">
        <DialogHeader className="pb-4 border-b border-gray-100 shrink-0 space-y-1">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#141F1E]">
                <ShieldAlert className="w-5 h-5 text-[#4A706A]" />
                {assessment.title}
              </DialogTitle>
              <DialogDescription className="text-md text-[#5D5D5D] mt-1">
                Category: {assessment.category} · Tool:{" "}
                {assessment.tool ?? "No tool specified"}
              </DialogDescription>
            </div>
          </div>
          <div className="pt-1.5">
            <RiskWorkflowBadge
              status={assessment.status}
              level={assessment.residualLevel}
              inherentLevel={assessment.inherentLevel}
            />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <section className="space-y-1.5">
            <h4 className="text-md font-semibold text-[#141F1E]">Hazard description</h4>
            <p className="text-md text-[#141F1E] whitespace-pre-wrap bg-slate-50 p-3.5 rounded-xl border border-[#BCD3CD]">
              {assessment.hazardDescription}
            </p>
          </section>

          {factors.length > 0 && (
            <section className="space-y-1.5">
              <h4 className="text-md font-semibold text-[#141F1E]">Who could be harmed / Factors</h4>
              <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-[#BCD3CD]">
                {factors.map((f, i) => (
                  <p key={i} className="text-md text-[#141F1E]">
                    {f}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Risk Matrix Section - No horizontal scroll, removed empty residual box */}
          <section className="w-full space-y-4">
            <RiskMatrixGrid
              likelihood={assessment.likelihood}
              severity={assessment.severity}
              readOnly
              caption={`Inherent — ${assessment.inherentScore} (${assessment.inherentLevel})`}
            />
            {assessment.residualLikelihood && assessment.residualSeverity && (
              <RiskMatrixGrid
                likelihood={assessment.residualLikelihood}
                severity={assessment.residualSeverity}
                readOnly
                caption={`Residual — ${assessment.residualScore} (${assessment.residualLevel})`}
              />
            )}
          </section>

          <section>
            <RiskControlsList
              assessmentId={assessment.id}
              controls={assessment.controls}
              canEdit={false}
            />
          </section>

          <section className="text-md text-[#5D5D5D] space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-[#BCD3CD]">
            <p>
              Next review date:{" "}
              <strong className="text-[#141F1E] font-semibold">
                {formatReviewDate(assessment.nextReviewDate)}
              </strong>
            </p>
            {assessment.approver && assessment.approvedAt && (
              <p>
                Approved by {assessment.approver.fullName} on{" "}
                {new Date(assessment.approvedAt).toLocaleDateString()}
              </p>
            )}
            {assessment.reviewer && assessment.reviewedAt && (
              <p>
                Submitted for review by {assessment.reviewer.fullName} on{" "}
                {new Date(assessment.reviewedAt).toLocaleDateString()}
              </p>
            )}
          </section>
        </div>

        <DialogFooter className="pt-4 border-t border-gray-100 shrink-0 flex flex-row items-center justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-[#BCD3CD] text-[#141F1E] hover:bg-slate-50 text-md font-medium px-5"
          >
            Close
          </Button>
          {canApprove && assessment.status === "PendingReview" && (
            <Button
              onClick={() => {
                transition.mutate(
                  { id: assessment.id, dto: { status: "Active" } },
                  { onSuccess: () => onOpenChange(false) }
                );
              }}
              disabled={transition.isPending}
              className="bg-[#4A706A] hover:bg-[#3D5C57] text-white rounded-xl shadow-xs text-md font-medium px-5"
            >
              {transition.isPending ? "Approving…" : "Approve & Verify"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
