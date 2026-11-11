"use client";

import Link from "next/link";
import { Text } from "@repo/ui/components/ui";
import { useAuth } from "../../../../lib/context/AuthContext";
import { useGetResidentQuery } from "../../../../lib/queries/residents/useGetResidentQuery";
import { AdmissionStepper } from "../admit/components/AdmissionStepper";
import type { AdmissionStepMeta } from "../admit/types";
import { AssessmentStep } from "./assessment/AssessmentStep";
import { CarePlansStep } from "./care-plans/CarePlansStep";
import { TasksStep } from "./tasks/TasksStep";

export const JOURNEY_VIEWS = [
  "assessment",
  "care-plans",
  "tasks",
] as const;
export type JourneyView = (typeof JOURNEY_VIEWS)[number];

export const isJourneyView = (value: string | null): value is JourneyView =>
  JOURNEY_VIEWS.some((v) => v === value);

const JOURNEY_STEPS: AdmissionStepMeta[] = [
  { number: 1, title: "Assessment", shortTitle: "Assessment", description: "Risk tools and the ten care areas" },
  { number: 2, title: "Care plans", shortTitle: "Care plans", description: "One plan for each need" },
  { number: 3, title: "Carer tasks", shortTitle: "Carer tasks", description: "What carers do each shift" },
];

const JOURNEY_LABELS: Record<number, { line1: string; line2?: string }> = {
  1: { line1: "Assessment" },
  2: { line1: "Care plans" },
  3: { line1: "Carer tasks" },
};

const VIEW_STEP: Record<JourneyView, 1 | 2 | 3> = {
  assessment: 1,
  "care-plans": 2,
  tasks: 3,
};
const STEP_VIEW: Record<number, JourneyView> = {
  1: "assessment",
  2: "care-plans",
  3: "tasks",
};

interface CareJourneyViewProps {
  residentId: string;
  view: JourneyView;
  onViewChange: (view: JourneyView) => void;
  /** Show the link back to the full resident profile. */
  showProfileLink?: boolean;
  /** Hide the resident name, e.g. when the profile page already shows it. */
  showName?: boolean;
}

interface ResidentSummary {
  fullName?: string;
  status?: string;
}

export function CareJourneyView({
  residentId,
  view,
  onViewChange,
  showProfileLink = true,
  showName = true,
}: CareJourneyViewProps) {
  const { user } = useAuth();
  const roleBase = user?.roleName?.toLowerCase() === "admin" ? "admin" : "carer";

  const { data } = useGetResidentQuery(residentId);
  const resident = data as ResidentSummary | undefined;

  const step = VIEW_STEP[view] ?? 1;
  const completed = new Set<number>();
  for (let s = 1; s < step; s += 1) completed.add(s);

  return (
    <div className="w-full space-y-6 font-sans">
      {(showName || showProfileLink) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {showName && resident?.fullName && (
            <Text size="lg" weight="bold" className="text-slate-900">
              {resident.fullName}
            </Text>
          )}
          {showProfileLink && (
            <Link
              href={`/${roleBase}/residents/${residentId}`}
              className="text-md font-semibold text-slate-600 hover:text-emerald-800"
            >
              Resident profile →
            </Link>
          )}
        </div>
      )}

      <AdmissionStepper
        currentStep={step}
        completedSteps={completed}
        onStepClick={(s) => onViewChange(STEP_VIEW[s] ?? "assessment")}
        isEditMode
        steps={JOURNEY_STEPS}
        labels={JOURNEY_LABELS}
      />

      <div className="pt-2">
        {view === "assessment" && (
          <AssessmentStep
            residentId={residentId}
            onNext={() => onViewChange("care-plans")}
          />
        )}
        {view === "care-plans" && (
          <CarePlansStep
            residentId={residentId}
            onBack={() => onViewChange("assessment")}
            onNext={() => onViewChange("tasks")}
          />
        )}
        {view === "tasks" && (
          <TasksStep
            residentId={residentId}
            onBack={() => onViewChange("care-plans")}
          />
        )}
      </div>
    </div>
  );
}
