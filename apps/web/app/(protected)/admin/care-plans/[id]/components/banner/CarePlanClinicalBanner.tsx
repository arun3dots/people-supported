"use client";

import { Card } from "@repo/ui/components/ui";
import { format } from "date-fns";
import { Calendar, Building2 } from "lucide-react";
import {
  CarePlanResidentProfileBadge,
  ResidentProfileData,
} from "./CarePlanResidentProfileBadge";
import { CarePlanGovernancePills } from "./CarePlanGovernancePills";
import {
  CarePlanShiftRoutineProgress,
  TaskOccurrenceItem,
} from "./CarePlanShiftRoutineProgress";
import {
  CarePlanClinicalActions,
  ApprovalActionData,
} from "./CarePlanClinicalActions";

export interface CarePlanBannerData {
  id: string;
  versionNumber: number;
  status: string;
  validFrom: string | Date;
  validTo?: string | Date | null;
  nextReviewDate?: string | Date | null;
  description?: string | null;
  primaryDoctorId?: string | null;
  authorRole?: string | null;
  departments?: string[];
  doctorsInvolved?: string[];
  resident?: ResidentProfileData | null;
  parentVersion?: { id: string; versionNumber: number } | null;
  approvals?: ApprovalActionData[];
}

interface CarePlanClinicalBannerProps {
  plan: CarePlanBannerData;
  primaryDoctorName?: string | null;
  dailyTasks?: TaskOccurrenceItem[];
  activeDols?: {
    status: string;
    expiryDate?: string | Date | null;
    supervisoryBody?: string;
  } | null;
  assessments?: Array<{
    id: string;
    decisionType: string;
    hasCapacity: boolean;
  }>;
  isSubmitting?: boolean;
  onSubmitForApproval?: () => void;
  onOpenApprovalModal?: (approval: ApprovalActionData) => void;
  onOpenReviewTab?: () => void;
  onOpenDolsTab?: () => void;
  onOpenDailyTasksTab?: () => void;
  onOpenRenew?: () => void;
  onOpenDiff?: () => void;
  onOpenTransferPack?: () => void;
  onOpenCalculators?: () => void;
  restrictiveTasksWithoutMca?: boolean;
}

export function CarePlanClinicalBanner({
  plan,
  primaryDoctorName,
  dailyTasks = [],
  activeDols,
  assessments = [],
  isSubmitting = false,
  onSubmitForApproval,
  onOpenApprovalModal,
  onOpenReviewTab,
  onOpenDolsTab,
  onOpenDailyTasksTab,
  onOpenRenew,
  onOpenDiff,
  onOpenTransferPack,
  onOpenCalculators,
  restrictiveTasksWithoutMca = false,
}: CarePlanClinicalBannerProps) {
  const isEditable =
    plan.status === "Draft" ||
    plan.status === "ChangesRequested" ||
    plan.status === "draft" ||
    plan.status === "changes_requested";

  const isPendingApproval =
    plan.status === "PendingPrimaryApproval" ||
    plan.status === "PendingSecondaryApproval" ||
    plan.status === "pending_primary_approval" ||
    plan.status === "pending_secondary_approval";

  const pendingApproval = plan.approvals?.find((a) => a.decision === "Pending") || null;

  const formatDateLabel = (d?: string | Date | null) => {
    if (!d) return "Not Set";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "Not Set" : format(date, "dd MMM yyyy");
  };

  return (
    <Card className="border border-slate-200/80 bg-white rounded-2xl p-5 lg:p-6 shadow-none font-['Outfit',sans-serif] space-y-4">
      {/* Top Row: Resident Identification & Real-Time Shift Routine Progress */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <CarePlanResidentProfileBadge
          resident={plan.resident}
          primaryDoctorName={primaryDoctorName}
          authorRole={plan.authorRole}
        />

        <div className="flex items-center gap-3 shrink-0">
          <CarePlanShiftRoutineProgress
            dailyTasks={dailyTasks}
            onViewTodayTasks={onOpenDailyTasksTab}
          />
        </div>
      </div>

      {/* Middle Row: Governance, Safeguard Pills & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Governance & Statutory Safeguards */}
        <div className="space-y-1.5">
          <CarePlanGovernancePills
            versionNumber={plan.versionNumber}
            status={plan.status}
            validFrom={plan.validFrom}
            validTo={plan.validTo}
            nextReviewDate={plan.nextReviewDate}
            activeDols={activeDols}
            assessments={assessments}
            onOpenDolsTab={onOpenDolsTab}
            onOpenReviewTab={onOpenReviewTab}
          />

          {/* Dates & Clinical Scope Info */}
          <div className="flex items-center gap-3 text-md text-slate-500 pt-0.5 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-slate-400" />
              <span>
                Effective: <strong className="text-slate-700 font-medium">{formatDateLabel(plan.validFrom)}</strong>
                {" - "}
                <strong className="text-slate-700 font-medium">{formatDateLabel(plan.validTo)}</strong>
              </span>
            </span>

            {Array.isArray(plan.departments) && plan.departments.length > 0 && (
              <span className="flex items-center gap-1 border-l border-slate-200 pl-3">
                <Building2 className="size-3.5 text-slate-400" />
                <span>{plan.departments.join(", ")}</span>
              </span>
            )}
          </div>
        </div>

        {/* Clinical Action Buttons */}
        <div className="shrink-0">
          <CarePlanClinicalActions
            planId={plan.id}
            residentName={plan.resident?.fullName || "Resident"}
            status={plan.status}
            isEditable={isEditable}
            isPendingApproval={isPendingApproval}
            isSubmitting={isSubmitting}
            onSubmitForApproval={onSubmitForApproval}
            onOpenApprovalModal={onOpenApprovalModal}
            pendingApproval={pendingApproval}
            onOpenReview={onOpenReviewTab}
            onOpenRenew={onOpenRenew}
            onOpenDiff={onOpenDiff}
            onOpenTransferPack={onOpenTransferPack}
            onOpenCalculators={onOpenCalculators}
            hasPreviousVersion={Boolean(plan.parentVersion)}
            restrictiveTasksWithoutMca={restrictiveTasksWithoutMca}
          />
        </div>
      </div>
    </Card>
  );
}
