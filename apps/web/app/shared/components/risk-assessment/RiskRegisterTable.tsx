"use client";

import { ChevronRight, ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Badge,
} from "@repo/ui/components/ui";
import {
  type RiskAssessmentResponse,
  useTransitionRiskAssessmentMutation,
} from "../../../../lib/queries/risk";
import type { RiskStatus } from "@repo/schema";
import { useAuth } from "../../../../lib/context/AuthContext";
import { formatReviewDate, getRiskLevelStyle, getStatusStyle } from "./risk-utils";

interface Props {
  assessments: RiskAssessmentResponse[];
  onSelect: (a: RiskAssessmentResponse) => void;
}

export function RiskRegisterTable({ assessments, onSelect }: Props) {
  const transition = useTransitionRiskAssessmentMutation();
  const { user } = useAuth();
  const canApprove = !!user?.permissions?.riskAssessments?.approve;

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-md text-muted-foreground mt-3">
            No risk assessments recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const next = (status: RiskStatus): RiskStatus | null => {
    if (status === "Draft") return "PendingReview";
    if (status === "PendingReview" && canApprove) return "Active";
    return null;
  };

  return (
    <div className="space-y-3">
      {assessments.map((a) => {
        const effectiveLevel = a.residualLevel ?? a.inherentLevel ?? "Low";
        const ls = getRiskLevelStyle(effectiveLevel);
        const ss = getStatusStyle(a.status);
        const target = next(a.status);
        return (
          <Card
            key={a.id}
            className="cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <CardContent className="py-4 flex items-center gap-4">
              <button
                type="button"
                onClick={() => onSelect(a)}
                className="flex-1 text-left flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${ls?.bg || 'bg-emerald-50'}`}>
                  <span className={`text-lg font-bold ${ls?.text || 'text-emerald-600'}`}>
                    {a.residualScore ?? a.inherentScore ?? "—"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{a.title}</h3>
                    <Badge variant="outline">{a.category}</Badge>
                    <Badge className={ss?.className || "bg-slate-200 text-slate-700"}>{ss?.label || a.status || "Draft"}</Badge>
                    <Badge className={ls?.badge || "bg-emerald-500 text-white"}>{effectiveLevel}</Badge>
                  </div>
                  <p className="text-md text-muted-foreground mt-0.5 truncate">
                    Tool: {a.tool ?? "—"} · Next review:{" "}
                    {formatReviewDate(a.nextReviewDate)}
                  </p>
                </div>
              </button>
              {target && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    transition.mutate({
                      id: a.id,
                      dto: { status: target },
                    });
                  }}
                  disabled={transition.isPending}
                >
                  {target === "PendingReview" ? "Submit for review" : "Approve"}
                </Button>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
