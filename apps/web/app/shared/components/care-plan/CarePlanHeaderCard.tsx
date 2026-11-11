"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import {
  Calendar,
  UserCheck,
  Stethoscope,
  Building2,
  Edit,
  Send,
  CheckSquare,
  History,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { CarePlanStatusBadge } from "./CarePlanStatusBadge";
import { AssignClinicalSignoffModal } from "./AssignClinicalSignoffModal";
import { useGetStaffQuery } from "../../../../lib/queries/staff";

interface ApprovalItem {
  id: string;
  role: string;
  decision: string;
  comments?: string | null;
  approver?: { id: string; fullName: string; email?: string } | null;
}

interface CarePlanHeaderCardProps {
  carePlan: {
    id: string;
    versionNumber: number;
    status: string;
    validFrom: string | Date;
    validTo?: string | Date | null;
    description?: string | null;
    primaryDoctorId?: string | null;
    secondaryDoctorId?: string | null;
    departments?: string[];
    doctorsInvolved?: string[];
    approvals?: ApprovalItem[];
    parentVersion?: { id: string; versionNumber: number } | null;
  };
  onEdit?: () => void;
  onSubmitForApproval?: () => void;
  onOpenApprovalModal?: (approval: ApprovalItem) => void;
  onCompareVersions?: () => void;
  currentUserId?: string;
  isSubmitting?: boolean;
}

export function CarePlanHeaderCard({
  carePlan,
  onEdit,
  onSubmitForApproval,
  onOpenApprovalModal,
  onCompareVersions,
  isSubmitting = false,
}: CarePlanHeaderCardProps): React.JSX.Element {
  const [isAssignSignoffOpen, setIsAssignSignoffOpen] = useState(false);

  const { data: rawStaff = [] } = useGetStaffQuery();
  const staffList = Array.isArray(rawStaff)
    ? (rawStaff as Array<{ id: string; fullName: string; role?: { name: string } }>)
    : [];

  const versionPill = `v${String(carePlan.versionNumber).padStart(4, "0")}`;
  const isEditable =
    carePlan.status === "Draft" ||
    carePlan.status === "ChangesRequested" ||
    carePlan.status === "draft" ||
    carePlan.status === "changes_requested";

  const isPendingApproval =
    carePlan.status === "PendingPrimaryApproval" ||
    carePlan.status === "PendingSecondaryApproval" ||
    carePlan.status === "pending_primary_approval" ||
    carePlan.status === "pending_secondary_approval";

  const formatDateLabel = (d?: string | Date | null) => {
    if (!d) return "Not Set";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "Not Set" : format(date, "MMM do, yyyy");
  };

  const primaryApproval = carePlan.approvals?.find((a) => a.role === "Primary");
  const secondaryApproval = carePlan.approvals?.find((a) => a.role === "Secondary");

  const primaryApproverName =
    primaryApproval?.approver?.fullName ||
    staffList.find((s) => s.id === carePlan.primaryDoctorId)?.fullName ||
    (carePlan.primaryDoctorId ? "Assigned Doctor" : null);

  const secondaryApproverName =
    secondaryApproval?.approver?.fullName ||
    staffList.find((s) => s.id === carePlan.secondaryDoctorId)?.fullName ||
    (carePlan.secondaryDoctorId ? "Secondary Doctor" : null);

  return (
    <Card
      variant="surface"
      className="p-5 lg:p-6 bg-surface-card-grey border-none rounded-2xl shadow-none font-sans space-y-6"
    >
      {/* Header Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-start gap-3.5">
          <div className="size-11 lg:size-12 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="size-5 lg:size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Text as="h2" size="xl" weight="semibold" className="text-slate-900 tracking-tight">
                Master Care Plan
              </Text>
              <Badge
                state="info"
                className="font-mono text-md px-2.5 py-0.5 shadow-none"
              >
                {versionPill}
              </Badge>
              <CarePlanStatusBadge status={carePlan.status} />
            </div>
            <Text size="sm" weight="regular" variant="muted" className="mt-1 max-w-2xl leading-relaxed">
              {carePlan.description ||
                "Clinical rationale, overarching goals, and scheduled routine interventions."}
            </Text>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onCompareVersions && carePlan.parentVersion && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCompareVersions}
              className="gap-1.5 rounded-xl text-md font-semibold h-9 px-3.5 shadow-none"
            >
              <History className="size-4" /> Compare with v
              {String(carePlan.parentVersion.versionNumber).padStart(4, "0")}
            </Button>
          )}

          {isEditable && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="size-4" /> Edit Draft
            </Button>
          )}

          {isEditable && onSubmitForApproval && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSubmitForApproval}
              disabled={isSubmitting}
            >
              <Send className="size-4" /> Submit for Sign-Off
            </Button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Validity Period */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-md font-bold text-slate-500 uppercase tracking-wider">
            <Calendar className="size-3.5 text-emerald-800" />
            <Text size="sm" weight="bold" variant="muted">Validity Period</Text>
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-md">
              <Text size="sm" variant="muted">From:</Text>
              <Text size="sm" weight="semibold">{formatDateLabel(carePlan.validFrom)}</Text>
            </div>
            <div className="flex justify-between items-center text-md">
              <Text size="sm" variant="muted">Valid To:</Text>
              <Text size="sm" weight="semibold">{formatDateLabel(carePlan.validTo)}</Text>
            </div>
          </div>
        </div>

        {/* Clinical Approvals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-md font-bold text-slate-500 uppercase tracking-wider">
            <UserCheck className="size-3.5 text-emerald-800" />
            <Text size="sm" weight="bold" variant="muted">Clinical Sign-Off</Text>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-md">
              <Text size="sm" variant="muted">Primary:</Text>
              <div className="flex items-center gap-1.5">
                {primaryApproverName ? (
                  <>
                    <Text size="sm" weight="medium" className="truncate max-w-[90px]">
                      {primaryApproverName}
                    </Text>
                    <Badge
                      state={
                        primaryApproval?.decision === "Approved"
                          ? "success"
                          : primaryApproval?.decision === "Rejected"
                            ? "danger"
                            : "warning"
                      }
                      className="text-md px-1.5 py-0 shadow-none"
                    >
                      {primaryApproval?.decision || "Pending"}
                    </Badge>
                  </>
                ) : (
                  <Button
                    variant={'ghost'}
                    type="button"
                    onClick={() => setIsAssignSignoffOpen(true)}
                    className="text-md text-emerald-800 h-6 px-1.5"
                  >
                    + Assign Doctor
                  </Button>
                )}
              </div>
            </div>

            {(secondaryApproval || secondaryApproverName) && (
              <div className="flex justify-between items-center text-md">
                <Text size="sm" variant="muted">Secondary:</Text>
                <div className="flex items-center gap-1.5">
                  <Text size="sm" weight="medium" className="truncate max-w-[90px]">
                    {secondaryApproverName || "Reviewer"}
                  </Text>
                  <Badge
                    state={
                      secondaryApproval?.decision === "Approved"
                        ? "success"
                        : secondaryApproval?.decision === "Rejected"
                          ? "danger"
                          : "warning"
                    }
                    className="text-md px-1.5 py-0 shadow-none"
                  >
                    {secondaryApproval?.decision || "Pending"}
                  </Badge>
                </div>
              </div>
            )}

            {isPendingApproval && onOpenApprovalModal && primaryApproval && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenApprovalModal(primaryApproval)}
                className="w-full mt-2 h-7 text-md font-semibold gap-1 rounded-lg border-slate-200 hover:bg-slate-50 shadow-none"
              >
                <CheckSquare className="size-3" /> Sign-Off Action
              </Button>
            )}
          </div>
        </div>

        {/* Involved Doctors */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-md font-bold text-slate-500 uppercase tracking-wider">
            <Stethoscope className="size-3.5 text-emerald-800" />
            <Text size="sm" weight="bold" variant="muted">Medical Team</Text>
          </div>
          <div className="min-h-[50px] flex flex-wrap gap-1.5 content-start pt-1">
            {carePlan.doctorsInvolved && carePlan.doctorsInvolved.length > 0 ? (
              carePlan.doctorsInvolved.map((doc, idx) => (
                <Badge
                  key={idx}
                  state="inactive"
                  className="text-md px-2 py-0.5 shadow-none"
                >
                  {doc}
                </Badge>
              ))
            ) : (
              <Text size="sm" variant="muted" className="italic">
                Assigned per shift
              </Text>
            )}
          </div>
        </div>

        {/* Departments Involved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-md font-bold text-slate-500 uppercase tracking-wider">
            <Building2 className="size-3.5 text-emerald-800" />
            <Text size="sm" weight="bold" variant="muted">Departments</Text>
          </div>
          <div className="min-h-[50px] flex flex-wrap gap-1.5 content-start pt-1">
            {carePlan.departments && carePlan.departments.length > 0 ? (
              carePlan.departments.map((dept, idx) => (
                <Badge
                  key={idx}
                  state="inactive"
                  className="text-md px-2 py-0.5 shadow-none"
                >
                  {dept}
                </Badge>
              ))
            ) : (
              <Text size="sm" variant="muted" className="italic">
                General Nursing
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* Assign Clinical Sign-Off Modal */}
      {isAssignSignoffOpen ? (
        <AssignClinicalSignoffModal
          isOpen={isAssignSignoffOpen}
          onClose={() => setIsAssignSignoffOpen(false)}
          carePlanId={carePlan.id}
          currentPrimaryDoctorId={carePlan.primaryDoctorId || primaryApproval?.approver?.id}
          currentSecondaryDoctorId={carePlan.secondaryDoctorId || secondaryApproval?.approver?.id}
        />
      ) : null}
    </Card>
  );
}
