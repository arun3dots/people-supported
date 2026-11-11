"use client";

import Link from "next/link";
import { useGetCarePlanReviewsQuery } from "../../../../../../lib/queries/care-plan";
import { CarePlanReviewDTO } from "@repo/schema";
import { Text, Badge, Button } from "@repo/ui/components/ui";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  MessageSquare,
  ClipboardList,
} from "lucide-react";

interface CarePlanReviewTimelineProps {
  carePlanId: string;
}

export function CarePlanReviewTimeline({ carePlanId }: CarePlanReviewTimelineProps) {
  const { data: rawReviews = [], isLoading } = useGetCarePlanReviewsQuery(carePlanId);
  const reviews = (rawReviews || []) as CarePlanReviewDTO[];

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 font-['Outfit',sans-serif]">
        <div className="animate-spin size-6 border-2 border-emerald-800 border-t-transparent rounded-full mx-auto mb-2" />
        <Text size="md" variant="muted">Loading statutory reviews...</Text>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 font-['Outfit',sans-serif] space-y-2">
        <ClipboardList className="size-8 text-slate-300 mx-auto" />
        <Text size="md" weight="semibold" className="text-slate-800">
          No Monthly Reviews Recorded Yet
        </Text>
        <Text size="md" variant="muted" className="max-w-md mx-auto">
          Under CQC Regulation 17, active care plans should undergo regular monthly evaluations to review progress against goals and record resident wishes.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-['Outfit',sans-serif]">
      <div className="flex items-center justify-between">
        <Text size="md" weight="bold" className="text-slate-900">
          Statutory Evaluation History ({reviews.length})
        </Text>
      </div>

      <div className="space-y-3">
        {reviews.map((rev: CarePlanReviewDTO) => {
          const isMaintained = rev.decision === "MaintainedNoChanges";
          const isMinor = rev.decision === "MinorAdjustments";
          const isMajorRenewal = rev.decision === "MajorChangeTriggersRenewal";

          return (
            <div
              key={rev.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3 shadow-none"
            >
              {/* Header: Date, Reviewer, and Decision Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isMaintained ? (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  ) : isMinor ? (
                    <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  ) : (
                    <RefreshCw className="size-4 text-rose-600 shrink-0" />
                  )}
                  <Text size="md" weight="semibold" className="text-slate-900">
                    {format(new Date(rev.reviewedAt), "dd MMMM yyyy, HH:mm")}
                  </Text>
                  <Badge
                    variant="secondary"
                    state={isMaintained ? "success" : isMinor ? "warning" : "danger"}
                    className="text-md font-semibold px-2 py-0.5"
                  >
                    {isMaintained
                      ? "Maintained - Stable"
                      : isMinor
                        ? "Minor Adjustments"
                        : "Triggers Renewal"}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 text-md">
                  <UserCheck className="size-3.5" />
                  <span>
                    Reviewed by <strong className="text-slate-800">{rev.reviewerName || "Staff"}</strong>
                  </span>
                </div>
              </div>

              {/* Summary Notes */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-md text-slate-800 leading-relaxed">
                {rev.summaryNotes}
              </div>

              {/* Major Change Handoff Callout */}
              {isMajorRenewal && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-2 text-md text-rose-900">
                    <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                    <span>This review outcome requires a full statutory care plan renewal (CQC Reg 17).</span>
                  </div>
                  <Link href={`/admin/care-plans/${carePlanId}/renew`} className="shrink-0">
                    <Button
                      size="sm"
                      className="h-7 text-md bg-rose-700 hover:bg-rose-800 text-white rounded-xl gap-1 cursor-pointer font-semibold"
                    >
                      <RefreshCw className="size-3" /> Launch Renewal Wizard
                    </Button>
                  </Link>
                </div>
              )}

              {/* Domains Evaluated */}
              {rev.domainsEvaluated && rev.domainsEvaluated.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-md text-slate-400 font-medium">Domains:</span>
                  {(rev.domainsEvaluated || []).map((d: string) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-md font-medium"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {/* Resident & Family Feedback */}
              {(rev.residentFeedback || rev.familyFeedback) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-md">
                  {rev.residentFeedback && (
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <MessageSquare className="size-3.5 text-emerald-800 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-700">Resident: </strong>
                        {rev.residentFeedback}
                      </span>
                    </div>
                  )}
                  {rev.familyFeedback && (
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <MessageSquare className="size-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-700">Family: </strong>
                        {rev.familyFeedback}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Next Scheduled Review */}
              {rev.nextScheduledReview && (
                <div className="flex items-center gap-1.5 text-md text-slate-400 pt-1">
                  <Calendar className="size-3" />
                  <span>
                    Next review due on {format(new Date(rev.nextScheduledReview), "dd MMM yyyy")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
