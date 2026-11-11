"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@repo/ui/components/ui";
import { Check, AlertCircle, ArrowRight, Lock } from "lucide-react";
import { Resident } from "../../../../../../lib/types/resident";
import { useGetPreAdmissionQuery } from "../../../../../../lib/queries/pre-admission";
import { useGetRiskAssessmentsQuery } from "../../../../../../lib/queries/risk";
import {
  useGetAssessmentQuery,
  useListNeedCarePlansQuery,
} from "../../../../../../lib/queries/care-journey";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import { cn } from "@repo/ui/lib/utils";

interface AdmissionProgressCardProps {
  resident: Resident;
}

interface StepItem {
  step: number;
  title: string;
  isComplete: boolean;
  statusText: string;
  variant: "complete" | "warning" | "error" | "locked";
}

export function AdmissionProgressCard({ resident }: AdmissionProgressCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const roleBase = user?.roleName?.toLowerCase() === "carer" ? "carer" : "admin";

  const { data: preAdmission } = useGetPreAdmissionQuery(resident.id);
  const { data: riskAssessments = [] } = useGetRiskAssessmentsQuery(
    { residentId: resident.id },
    { enabled: !!resident.id },
  );
  const { data: assessment } = useGetAssessmentQuery(resident.id);
  const { data: needCarePlans = [] } = useListNeedCarePlansQuery(resident.id);

  const steps: StepItem[] = useMemo(() => {
    // 1. Admission and personal details (Part A)
    const partA = preAdmission?.partA;
    const step1Complete = Boolean(
      (partA?.firstName && partA?.lastName && partA?.dob && partA?.gender) ||
      (resident.fullName && resident.dob && resident.profile?.gender)
    );

    // 2. About me (Part G)
    const partG = preAdmission?.partG;
    const step2Complete = Boolean(
      partG?.loves ||
      partG?.dislikes ||
      partG?.routine?.wakeTime ||
      partG?.routine?.bedTime ||
      partG?.whatHelps ||
      partG?.worries ||
      partG?.personalCareNotes
    );

    // 3. Contacts and legal authority (Part B)
    const partB = preAdmission?.partB;
    const step3Complete = Boolean(
      (partB?.nextOfKin && partB.nextOfKin.length > 0) ||
      (partB?.lpa && partB.lpa.length > 0) ||
      (partB?.gp?.name && partB.gp.name.trim().length > 0)
    );

    // 4. Health and medicines (Part C)
    const partC = preAdmission?.partC;
    const step4Complete = Boolean(
      ((partC?.diagnoses && partC.diagnoses.length > 0) || partC?.primaryDiagnosis) &&
      ((partC?.allergies && partC.allergies.length > 0) || partC?.noKnownAllergies) ||
      resident.careProfile?.primaryCareNeed ||
      (resident.careProfile?.chronicConditions && resident.careProfile.chronicConditions.length > 0)
    );

    // 5. Risk assessment
    const riskCount = riskAssessments.length;
    const step5Complete = riskCount > 0;

    // 6. Care needs assessment
    const assessmentNeeds = Array.isArray(assessment?.needs) ? assessment.needs : [];
    const hasRecordedNeeds = assessmentNeeds.some(
      (n: { found?: string | null; supportLevel?: string | null }) =>
        Boolean(n.found?.trim() || n.supportLevel),
    );
    const step6Complete = Boolean(hasRecordedNeeds || needCarePlans.length > 0);

    // 7. Activities of Daily Living (ADLs) (Part D)
    const partD = preAdmission?.partD;
    const step7Complete = Boolean(
      (partD && Object.keys(partD.areas || {}).length > 0) ||
      resident.careProfile?.mobility
    );

    // 8. Capacity, consent, DoLS (Part E)
    const partE = preAdmission?.partE;
    const step8Complete = Boolean(
      partE?.moveDecision && typeof partE.moveDecision.hasCapacity === "boolean"
    );

    // 9. Advance care planning (Part F)
    const partF = preAdmission?.partF;
    const step9Complete = Boolean(
      (partF?.dnacpr && partF.dnacpr.status !== "NotDiscussed") ||
      partF?.respect?.inPlace ||
      partF?.livingWill ||
      partF?.plan ||
      resident.dnarStatus
    );

    // 10. Room and belongings (roomAllocation)
    const roomAlloc = preAdmission?.roomAllocation;
    const step10Complete = Boolean(
      roomAlloc?.bedId ||
      resident.bed?.id
    );

    const list: StepItem[] = [
      {
        step: 1,
        title: "Admission and personal details",
        isComplete: step1Complete,
        statusText: step1Complete ? "Complete" : "Incomplete details",
        variant: step1Complete ? "complete" : "warning",
      },
      {
        step: 2,
        title: "About me",
        isComplete: step2Complete,
        statusText: step2Complete ? "Complete" : "Details pending",
        variant: step2Complete ? "complete" : "warning",
      },
      {
        step: 3,
        title: "Contacts and legal authority",
        isComplete: step3Complete,
        statusText: step3Complete ? "Complete" : "Contacts pending",
        variant: step3Complete ? "complete" : "warning",
      },
      {
        step: 4,
        title: "Health and medicines",
        isComplete: step4Complete,
        statusText: step4Complete ? "Complete" : "Medical details pending",
        variant: step4Complete ? "complete" : "warning",
      },
      {
        step: 5,
        title: "Risk assessment",
        isComplete: step5Complete,
        statusText: step5Complete
          ? `${riskCount} assessment${riskCount > 1 ? "s" : ""} recorded`
          : "Risk assessment pending",
        variant: step5Complete ? "complete" : "warning",
      },
      {
        step: 6,
        title: "Care needs assessment",
        isComplete: step6Complete,
        statusText: step6Complete ? "Complete" : "Assessment pending",
        variant: step6Complete ? "complete" : "warning",
      },
      {
        step: 7,
        title: "Activities of Daily Living (ADLs)",
        isComplete: step7Complete,
        statusText: step7Complete ? "Complete" : "ADL assessment pending",
        variant: step7Complete ? "complete" : "warning",
      },
      {
        step: 8,
        title: "Capacity, consent, DoLS",
        isComplete: step8Complete,
        statusText: step8Complete ? "Complete" : "Consents pending",
        variant: step8Complete ? "complete" : "warning",
      },
      {
        step: 9,
        title: "Advance care planning",
        isComplete: step9Complete,
        statusText: step9Complete ? "Complete" : "Advance care pending",
        variant: step9Complete ? "complete" : "warning",
      },
      {
        step: 10,
        title: "Room and belongings",
        isComplete: step10Complete,
        statusText: step10Complete ? "Complete" : "Not started — room/bed unassigned",
        variant: step10Complete ? "complete" : "warning",
      },
    ];

    // 11. Review and decision
    const allPriorComplete = list.every((s) => s.isComplete);
    const isAccepted = preAdmission?.status === "Accepted" || (!resident.isDraft && resident.status === "Active");
    list.push({
      step: 11,
      title: "Review and decision",
      isComplete: isAccepted,
      statusText: isAccepted
        ? "Accepted & admitted"
        : allPriorComplete
          ? "Ready for manager review"
          : "Locked until above complete",
      variant: isAccepted ? "complete" : allPriorComplete ? "warning" : "locked",
    });

    return list;
  }, [preAdmission, resident, riskAssessments, assessment, needCarePlans]);

  const completedCount = steps.filter((s) => s.isComplete).length;
  const progressPercent = Math.round((completedCount / 11) * 100);

  const firstIncompleteStep = useMemo(() => {
    const found = steps.find((s) => !s.isComplete);
    return found ? found.step : 11;
  }, [steps]);

  const handleGoToStep = (stepNumber: number) => {
    router.push(`/${roleBase}/residents/admit?id=${resident.id}&step=${stepNumber}`);
  };

  return (
    <Card
      variant="surface"
      border="secondary"
      className="p-5 sm:p-6 space-y-4 rounded-2xl bg-white shadow-xs font-sans"
    >
      {/* Header Row: Title + Resume Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-md sm:text-base font-bold text-text-primary tracking-tight">
            Admission Progress — {completedCount} of 11 sections complete
          </h3>
          <p className="text-md text-text-description mt-0.5">
            Complete all onboarding sections to finalise resident admission
          </p>
        </div>

        <Button
          type="button"
          onClick={() => handleGoToStep(firstIncompleteStep)}
          className="bg-primary hover:bg-primary-dark text-white font-medium rounded-lg text-md sm:text-md px-4 py-2 flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <span>Resume Admission Wizard</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 11 Step Items Grid/List */}
      <div className="space-y-2 pt-1">
        {steps.map((item) => {
          const isComplete = item.variant === "complete";
          const isWarning = item.variant === "warning";
          const isError = item.variant === "error";
          const isLocked = item.variant === "locked";

          return (
            <div
              key={item.step}
              onClick={() => handleGoToStep(item.step)}
              className={cn(
                "p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer",
                isComplete && "bg-white border-border-secondary/50 hover:bg-slate-50/70",
                isWarning && !isComplete && "bg-amber-50/20 border-amber-400 hover:bg-amber-50/40",
                isError && "bg-rose-50/20 border-rose-400 hover:bg-rose-50/40",
                isLocked && "bg-slate-50/40 border-slate-200 hover:bg-slate-50"
              )}
            >
              {/* Left: Step Icon + Step Name */}
              <div className="flex items-center gap-3 min-w-0">
                {isComplete ? (
                  <div className="size-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-md font-bold shrink-0">
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                ) : isError ? (
                  <div className="size-6 rounded-full bg-rose-700 text-white flex items-center justify-center text-md font-bold shrink-0">
                    <AlertCircle className="size-3.5 stroke-[2.5]" />
                  </div>
                ) : isLocked ? (
                  <div className="size-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-md font-bold shrink-0">
                    <Lock className="size-3" />
                  </div>
                ) : (
                  <div className="size-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-md font-bold shrink-0">
                    {item.step}
                  </div>
                )}

                <span
                  className={cn(
                    "text-md sm:text-md font-medium truncate",
                    isLocked ? "text-text-description" : "text-text-primary"
                  )}
                >
                  {item.title}
                </span>
              </div>

              {/* Right: Status Pill / Badge */}
              <div className="shrink-0">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-semibold border inline-flex items-center gap-1",
                    isComplete && "border-emerald-600/40 text-emerald-700 bg-emerald-50/40",
                    isWarning && !isComplete && "border-amber-600/50 text-amber-800 bg-amber-50/60",
                    isError && "border-rose-600/50 text-rose-800 bg-rose-50/60",
                    isLocked && "border-slate-300 text-slate-500 bg-slate-100/60"
                  )}
                >
                  {item.statusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-2 text-center">
        <p className="text-md text-text-description italic">
          Finalise Admission is blocked until Room/Bed is assigned and all sections are complete.
        </p>
      </div>
    </Card>
  );
}
