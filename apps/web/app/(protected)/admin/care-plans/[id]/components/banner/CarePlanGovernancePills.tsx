"use client";

import { format, differenceInDays, isPast } from "date-fns";
import { ShieldCheck, Brain, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Badge, Text } from "@repo/ui/components/ui";

interface DolsSummary {
  status: string;
  expiryDate?: string | Date | null;
  supervisoryBody?: string;
}

interface CapacitySummary {
  id: string;
  decisionType: string;
  hasCapacity: boolean;
}

interface CarePlanGovernancePillsProps {
  versionNumber: number;
  status: string;
  validFrom: string | Date;
  validTo?: string | Date | null;
  nextReviewDate?: string | Date | null;
  activeDols?: DolsSummary | null;
  assessments?: CapacitySummary[];
  onOpenDolsTab?: () => void;
  onOpenReviewTab?: () => void;
}

export function CarePlanGovernancePills({
  versionNumber,
  status,
  validFrom,
  validTo,
  nextReviewDate,
  activeDols,
  assessments = [],
  onOpenDolsTab,
  onOpenReviewTab,
}: CarePlanGovernancePillsProps) {
  const versionPill = `v${String(versionNumber).padStart(4, "0")}`;

  // 1. Status badge state
  const getStatusBadgeState = (st: string) => {
    switch (st.toLowerCase()) {
      case "active":
        return "success";
      case "pendingprimaryapproval":
      case "pendingsecondaryapproval":
      case "pending_primary_approval":
      case "pending_secondary_approval":
      case "changesrequested":
      case "changes_requested":
        return "warning";
      case "expired":
      case "rejected":
        return "danger";
      default:
        return "inactive";
    }
  };

  // 2. DoLS Safeguard calculations
  let dolsBadge = null;
  if (activeDols) {
    const isAuthorized = activeDols.status === "Authorized";
    const isUrgent = activeDols.status === "UrgentApplied";
    let daysRemaining: number | null = null;
    let isExpiringSoon = false;
    let isExpired = false;

    if (activeDols.expiryDate) {
      const exp = new Date(activeDols.expiryDate);
      daysRemaining = differenceInDays(exp, new Date());
      isExpired = isPast(exp);
      isExpiringSoon = !isExpired && daysRemaining <= 30;
    }

    dolsBadge = (
      <button
        type="button"
        onClick={onOpenDolsTab}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-md font-semibold border transition-colors cursor-pointer ${isExpired
            ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
            : isExpiringSoon
              ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
              : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          }`}
        title="View Statutory DoLS Safeguard Details"
      >
        <ShieldCheck className="size-3.5 shrink-0" />
        <span>
          DoLS: {isAuthorized ? "Authorized" : isUrgent ? "Urgent Auth" : activeDols.status}
          {daysRemaining !== null && !isExpired && ` (${daysRemaining}d left)`}
          {isExpired && " (Expired)"}
        </span>
      </button>
    );
  } else {
    dolsBadge = (
      <button
        type="button"
        onClick={onOpenDolsTab}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-md font-medium border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
        title="No active DoLS safeguard found. Click to review capacity."
      >
        <ShieldCheck className="size-3.5 text-slate-400" />
        <span>DoLS: None</span>
      </button>
    );
  }

  // 3. MCA Capacity status
  const lacksCapacityAssessment = assessments.find((a) => !a.hasCapacity);
  const mcaBadge = (
    <button
      type="button"
      onClick={onOpenDolsTab}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-md font-semibold border transition-colors cursor-pointer ${lacksCapacityAssessment
          ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          : assessments.length > 0
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
        }`}
      title="View Statutory Mental Capacity Assessments"
    >
      <Brain className="size-3.5 shrink-0" />
      <span>
        {lacksCapacityAssessment
          ? "MCA: Best Interests Decision"
          : assessments.length > 0
            ? "MCA: Has Capacity"
            : "MCA: Not Assessed"}
      </span>
    </button>
  );

  // 4. Next Review Cadence
  let reviewPill = null;
  if (nextReviewDate) {
    const revDate = new Date(nextReviewDate);
    if (!isNaN(revDate.getTime())) {
      const daysUntilReview = differenceInDays(revDate, new Date());
      const isOverdue = isPast(revDate);

      reviewPill = (
        <button
          type="button"
          onClick={onOpenReviewTab}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-md font-semibold border transition-colors cursor-pointer ${isOverdue
              ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
              : daysUntilReview <= 7
                ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          title="Monthly Statutory Review Cadence"
        >
          {isOverdue ? (
            <AlertTriangle className="size-3.5 text-rose-600 shrink-0" />
          ) : (
            <Calendar className="size-3.5 text-slate-500 shrink-0" />
          )}
          <span>
            {isOverdue
              ? `Review Overdue (${Math.abs(daysUntilReview)}d)`
              : `Review Due in ${daysUntilReview}d`}
          </span>
        </button>
      );
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap font-['Outfit',sans-serif]">
      {/* Version Pill */}
      <Badge variant="secondary" state="inactive" className="font-mono text-md px-2.5 py-1 shadow-none">
        {versionPill}
      </Badge>

      {/* Lifecycle Status */}
      <Badge
        variant="secondary"
        state={getStatusBadgeState(status)}
        className="px-2.5 py-1 text-md font-semibold shadow-none"
      >
        {status}
      </Badge>

      {/* Live DoLS Pill */}
      {dolsBadge}

      {/* Live MCA Pill */}
      {mcaBadge}

      {/* Review Cadence */}
      {reviewPill}
    </div>
  );
}
