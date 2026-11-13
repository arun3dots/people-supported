"use client";

import React from "react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Text,
} from "@repo/ui/components/ui";
import {
  Heart,
  Edit,
  Calendar,
  UserCheck,
  Stethoscope,
  Building2,
  Plus,
} from "lucide-react";

interface ActiveCarePlanCardProps {
  activeCarePlan?: any;
  latestCarePlan?: any;
  primaryApprover: string;
  secondaryApprover: string;
  formatDateString: (dateInput?: string | Date) => string;
  getStatusBadgeVariant: (status: string) => string;
  onEditActive: () => void;
  onCreateNew: () => void;
  onReactivate: () => void;
}

export function ActiveCarePlanCard({
  activeCarePlan,
  latestCarePlan,
  primaryApprover,
  secondaryApprover,
  formatDateString,
  getStatusBadgeVariant,
  onEditActive,
  onCreateNew,
  onReactivate,
}: ActiveCarePlanCardProps) {
  return (
    <Card className="overflow-hidden border border-border shadow-sm bg-gradient-to-br from-white to-slate-50">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-indigo-500" />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Heart className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-foreground">
                  Active Care Plan
                </h3>
                {(activeCarePlan || latestCarePlan) && (
                  <Badge className={getStatusBadgeVariant(activeCarePlan?.status || latestCarePlan?.status)}>
                    {activeCarePlan?.status || latestCarePlan?.status}
                  </Badge>
                )}
              </div>
              <p className="text-md text-muted-foreground mt-0.5">
                Overarching care rules, validity controls, and medical involvement for active care.
              </p>
            </div>
          </div>
          {activeCarePlan && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditActive}
              className="gap-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Edit className="w-4 h-4" /> Edit Active Details
            </Button>
          )}
        </div>

        {activeCarePlan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            {/* Validity Dates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-md font-semibold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-slate-400" />
                Validity Period
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between text-md">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-semibold text-foreground">
                    {formatDateString(activeCarePlan.validFrom)}
                  </span>
                </div>
                <div className="flex justify-between text-md">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-semibold text-foreground">
                    {formatDateString(activeCarePlan.nextReviewDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Approvals */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-md font-semibold text-slate-400 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-slate-400" />
                Approval Workflow
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between text-md items-center">
                  <span className="text-muted-foreground">Primary:</span>
                  <Text size="md" weight="semibold" title={primaryApprover}>
                    {primaryApprover}
                  </Text>
                </div>
                <div className="flex justify-between text-md items-center">
                  <span className="text-muted-foreground">Secondary:</span>
                  <Text size="md" weight="semibold" title={secondaryApprover}>
                    {secondaryApprover}
                  </Text>
                </div>
              </div>
            </div>

            {/* Doctors Involved */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-md font-semibold text-slate-400 uppercase tracking-wider">
                <Stethoscope className="w-4 h-4 text-slate-400" />
                Doctors Involved
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-wrap gap-1.5 min-h-[66px] content-start">
                {activeCarePlan.doctorsInvolved && activeCarePlan.doctorsInvolved.length > 0 ? (
                  activeCarePlan.doctorsInvolved.map((doc: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-md bg-slate-100 text-slate-700">
                      {doc}
                    </Badge>
                  ))
                ) : (
                  <span className="text-md text-muted-foreground italic my-auto">
                    No doctors assigned
                  </span>
                )}
              </div>
            </div>

            {/* Departments */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-md font-semibold text-slate-400 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-slate-400" />
                Involved Departments
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-wrap gap-1.5 min-h-[66px] content-start">
                {activeCarePlan.departments && activeCarePlan.departments.length > 0 ? (
                  activeCarePlan.departments.map((dept: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {dept}
                    </Badge>
                  ))
                ) : (
                  <span className="text-md text-muted-foreground italic my-auto">
                    No departments assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/50 border border-dashed border-amber-200 rounded-2xl p-6 mt-6 text-center">
            <p className="text-md font-medium text-amber-800">
              {latestCarePlan ? "No Active Care Plan Found" : "No Care Plan Master created yet"}
            </p>
            <p className="text-md text-amber-600/80 mt-1 max-w-md mx-auto">
              {latestCarePlan
                ? "All previous care plans are currently expired or inactive. You can activate one of the historical versions below or create a new care plan version."
                : "In order to schedule daily tasks and track observations, you need to initialise a master care plan for this resident first."}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateNew}
                className="gap-2 bg-white border-amber-200 text-amber-800 hover:bg-amber-50"
              >
                <Plus className="w-4 h-4" /> Create New Care Plan
              </Button>
              {latestCarePlan && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReactivate}
                  className="gap-2 bg-white border-amber-200 text-amber-800 hover:bg-amber-50"
                >
                  <Edit className="w-4 h-4" /> Edit / Activate Previous Version
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
