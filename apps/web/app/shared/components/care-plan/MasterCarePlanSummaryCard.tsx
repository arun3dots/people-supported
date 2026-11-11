"use client";

import React from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  Button,
  Badge,
} from "@repo/ui/components/ui";
import {
  Heart,
  Calendar,
  UserCheck,
  Stethoscope,
  Building2,
  Edit,
} from "lucide-react";

interface MasterCarePlanSummaryCardProps {
  activeCarePlan: any;
  staffList: any[];
  canManagePlan: boolean;
  onEditMasterClick: () => void;
}

export function MasterCarePlanSummaryCard({
  activeCarePlan,
  staffList,
  canManagePlan,
  onEditMasterClick,
}: MasterCarePlanSummaryCardProps) {
  const formatDateString = (dateInput?: string | Date) => {
    if (!dateInput) return "Not Set";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Not Set";
    return format(d, "MMM do, yyyy");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      case "Draft":
        return "bg-amber-500 hover:bg-amber-600 text-white";
      case "Expired":
        return "bg-rose-500 hover:bg-rose-600 text-white";
      default:
        return "bg-slate-500 hover:bg-slate-600 text-white";
    }
  };

  const primaryApprover = activeCarePlan?.approvedById
    ? staffList.find((s) => s.id === activeCarePlan.approvedById)?.fullName || "Approved"
    : "Pending Approval";

  const secondaryApprover = activeCarePlan?.secondaryApprovedById
    ? staffList.find((s) => s.id === activeCarePlan.secondaryApprovedById)?.fullName || "Approved"
    : "Pending Approval";

  return (
    <Card className="overflow-hidden border border-slate-200/80 shadow-xs bg-white rounded-2xl">
      <div className="h-1.5 w-full bg-linear-to-r from-[#3D5C57] to-emerald-600" />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#3D5C57]/10 rounded-2xl text-[#3D5C57]">
              <Heart className="size-6 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Master Care Plan Details
                </h3>
                {activeCarePlan && (
                  <Badge className={getStatusBadgeVariant(activeCarePlan.status)}>
                    {activeCarePlan.status}
                  </Badge>
                )}
              </div>
              <p className="text-md text-slate-500 font-medium mt-0.5">
                Overarching care rules, validity controls, and medical involvement.
              </p>
            </div>
          </div>

          {canManagePlan && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditMasterClick}
              className="gap-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Edit className="size-4" />{" "}
              {activeCarePlan ? "Edit Master Details" : "Create Master Record"}
            </Button>
          )}
        </div>

        {activeCarePlan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            {/* Validity Dates */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-md font-semibold text-slate-500 uppercase tracking-wider">
                <Calendar className="size-4 text-slate-400" />
                Validity Period
              </div>
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between text-md sm:text-md">
                  <span className="text-slate-500">From:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateString(activeCarePlan.validFrom)}
                  </span>
                </div>
                <div className="flex justify-between text-md sm:text-md">
                  <span className="text-slate-500">Expires:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateString(activeCarePlan.nextReviewDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Approvals */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-md font-semibold text-slate-500 uppercase tracking-wider">
                <UserCheck className="size-4 text-slate-400" />
                Approval Workflow
              </div>
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between text-md sm:text-md items-center">
                  <span className="text-slate-500">Primary:</span>
                  <span className="font-semibold text-slate-900 text-right truncate max-w-[120px]" title={primaryApprover}>
                    {primaryApprover}
                  </span>
                </div>
                <div className="flex justify-between text-md sm:text-md items-center">
                  <span className="text-slate-500">Secondary:</span>
                  <span className="font-semibold text-slate-900 text-right truncate max-w-[120px]" title={secondaryApprover}>
                    {secondaryApprover}
                  </span>
                </div>
              </div>
            </div>

            {/* Doctors Involved */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-md font-semibold text-slate-500 uppercase tracking-wider">
                <Stethoscope className="size-4 text-slate-400" />
                Doctors Involved
              </div>
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-wrap gap-1.5 min-h-[66px] content-start">
                {activeCarePlan.doctorsInvolved && activeCarePlan.doctorsInvolved.length > 0 ? (
                  activeCarePlan.doctorsInvolved.map((doc: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-md bg-white text-slate-700 border-slate-200">
                      {doc}
                    </Badge>
                  ))
                ) : (
                  <span className="text-md text-slate-400 italic my-auto">
                    No doctors assigned
                  </span>
                )}
              </div>
            </div>

            {/* Departments */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-md font-semibold text-slate-500 uppercase tracking-wider">
                <Building2 className="size-4 text-slate-400" />
                Involved Departments
              </div>
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-wrap gap-1.5 min-h-[66px] content-start">
                {activeCarePlan.departments && activeCarePlan.departments.length > 0 ? (
                  activeCarePlan.departments.map((dept: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-md bg-emerald-50 text-[#3D5C57] border border-emerald-100">
                      {dept}
                    </Badge>
                  ))
                ) : (
                  <span className="text-md text-slate-400 italic my-auto">
                    No departments assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/50 border border-dashed border-amber-200 rounded-2xl p-6 mt-6 text-center">
            <p className="text-md font-bold text-amber-900">
              No Care Plan Master created yet
            </p>
            <p className="text-md text-amber-700/80 mt-1 max-w-md mx-auto">
              In order to schedule daily tasks and track observations, a master care plan must be initialised.
            </p>
            {canManagePlan && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditMasterClick}
                className="mt-3 gap-2 bg-white border-amber-200 text-amber-900 hover:bg-amber-50 cursor-pointer"
              >
                Create Master Record
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
