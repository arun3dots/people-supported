"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import {
  Calendar,
  UserCheck,
  Stethoscope,
  Building2,
  RefreshCw,
  AlertTriangle,
  Plus,
  Edit,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { CarePlanStatusBadge } from "../../../../../../shared/components/care-plan/CarePlanStatusBadge";

interface MasterCarePlanCardProps {
  residentId: string;
  activeCarePlan: Record<string, unknown> | null;
  staffList: Array<Record<string, unknown>>;
  onEditMaster?: () => void;
}

export function MasterCarePlanCard({
  residentId,
  activeCarePlan,
  staffList,
  onEditMaster,
}: MasterCarePlanCardProps) {
  const router = useRouter();

  if (!activeCarePlan) {
    return (
      <Card variant="surface" border="secondary" className="p-6 text-center space-y-3">
        <h3 className="text-base font-bold text-text-primary">No Care Plan Found</h3>
        <p className="text-md text-text-description max-w-md mx-auto">
          This resident does not have a Master Care Plan yet. Create a personalised clinical care plan with goals and daily task schedules.
        </p>
        <Button
          type="button"
          onClick={() => router.push(`/admin/care-plans/new?residentId=${residentId}`)}
          className="gap-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-md"
        >
          <Plus className="size-4" /> Create First Care Plan
        </Button>
      </Card>
    );
  }

  const resolveStaffName = (staffId: unknown): string => {
    if (!staffId || typeof staffId !== "string") return "Pending / Unassigned";
    const staff = staffList.find((s) => s.id === staffId);
    return (staff?.fullName as string) ?? "Assigned Staff";
  };

  const status = (activeCarePlan.status as string) || "Draft";
  const isExpired = status === "Expired" || status === "expired";
  const isSuperseded = status === "Superseded" || status === "superseded";
  const isDraft = status === "Draft" || status === "draft" || status === "ChangesRequested";

  const validFrom = activeCarePlan.validFrom ? new Date(activeCarePlan.validFrom as string) : null;
  const validTo = activeCarePlan.validTo ? new Date(activeCarePlan.validTo as string) : null;
  const nextReview = activeCarePlan.nextReviewDate ? new Date(activeCarePlan.nextReviewDate as string) : null;

  const formatDate = (d: Date | null) => (d && !isNaN(d.getTime()) ? format(d, "MMM do, yyyy") : "Not Set");

  const isReviewDueSoon =
    nextReview && nextReview.getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000 && !isExpired && !isSuperseded;

  const versionPill = `v${String(activeCarePlan.versionNumber || 1).padStart(4, "0")}`;
  const primaryDoctor = resolveStaffName(activeCarePlan.primaryDoctorId || activeCarePlan.approvedById);
  const secondaryDoctor = resolveStaffName(activeCarePlan.secondaryDoctorId || activeCarePlan.secondaryApprovedById);
  const departments = (activeCarePlan.departments as string[]) || [];

  return (
    <Card variant="surface" border="secondary" className="p-5 sm:p-6 space-y-5 rounded-2xl bg-white shadow-xs font-sans">
      {/* 1. Renewal CTA Alert if Expired */}
      {isExpired && (
        <div className="p-4 bg-amber-50 border border-amber-300/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-md sm:text-md font-bold">This Master Care Plan has expired ({formatDate(validTo)})</p>
              <p className="text-md text-amber-700">Renew this plan to carry forward existing clinical goals and update daily task schedules.</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => router.push(`/admin/care-plans/${activeCarePlan.id}/renew`)}
            className="bg-amber-700 hover:bg-amber-800 text-white font-semibold text-md px-4 py-2 rounded-lg shrink-0 gap-1.5"
          >
            <RefreshCw className="size-3.5" /> Renew Care Plan
          </Button>
        </div>
      )}

      {/* 2. Review Due Alert Banner */}
      {isReviewDueSoon && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-blue-900 text-md">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-blue-600" />
            <span>Scheduled clinical review is due on <strong>{formatDate(nextReview)}</strong>.</span>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/admin/care-plans/${activeCarePlan.id}/renew`)}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            Start Review
          </button>
        </div>
      )}

      {/* 3. Card Header: Title, Version, Status, Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-secondary/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-md">
            {versionPill}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">Master Care Plan</h3>
              <CarePlanStatusBadge status={status} />
            </div>
            <p className="text-md text-text-description mt-0.5">
              Validity: {formatDate(validFrom)} — {formatDate(validTo)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDraft && onEditMaster && (
            <Button variant="outline" size="sm" onClick={onEditMaster} className="gap-1.5 rounded-xl cursor-pointer">
              <Edit className="size-3.5" /> Edit Draft
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/care-plans/${activeCarePlan.id}/renew`)}
            className="gap-1.5 text-md"
          >
            <RefreshCw className="size-3.5" /> Renew Plan
          </Button>
        </div>
      </div>

      {/* 4. Metadata Grid (Doctors, Approvers, Departments) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-md">
        <div className="space-y-1">
          <span className="text-text-description font-medium flex items-center gap-1.5">
            <Stethoscope className="size-3.5" /> Primary Doctor / Approver
          </span>
          <p className="text-text-primary font-semibold">{primaryDoctor}</p>
        </div>

        <div className="space-y-1">
          <span className="text-text-description font-medium flex items-center gap-1.5">
            <UserCheck className="size-3.5" /> Secondary Doctor / Approver
          </span>
          <p className="text-text-primary font-semibold">{secondaryDoctor}</p>
        </div>

        <div className="space-y-1">
          <span className="text-text-description font-medium flex items-center gap-1.5">
            <Building2 className="size-3.5" /> Involved Departments
          </span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {departments.length > 0 ? (
              departments.map((dept, idx) => (
                <Badge key={idx} variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none">
                  {dept}
                </Badge>
              ))
            ) : (
              <span className="text-text-muted">General Nursing</span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Clinical Rationale */}
      {activeCarePlan.description ? (
        <div className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-1">
          <span className="text-sm font-bold text-text-description tracking-wider">
            Clinical Rationale & Notes
          </span>
          <p className="text-md text-text-primary leading-relaxed">{activeCarePlan.description as string}</p>
        </div>
      ) : null}
    </Card>
  );
}
