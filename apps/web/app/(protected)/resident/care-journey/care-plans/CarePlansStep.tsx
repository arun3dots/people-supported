"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { AssessmentAreaKey } from "@repo/schema";
import { Button, Spinner, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  useListCareTaskDefinitionsQuery,
  useListNeedCarePlansQuery,
} from "../../../../../lib/queries/care-journey";
import { PartCard } from "../../admit/pre-admission/shared/PartCard";
import { RatingPill } from "../shared";
import { PlanEditor } from "./PlanEditor";

interface CarePlansStepProps {
  residentId: string;
  onBack: () => void;
  onNext: () => void;
  /** Hidden when embedded in the resident record, which has no stepper. */
  showNav?: boolean;
}

export function CarePlansStep({
  residentId,
  onBack,
  onNext,
  showNav = true,
}: CarePlansStepProps) {
  const plansQuery = useListNeedCarePlansQuery(residentId);
  const tasksQuery = useListCareTaskDefinitionsQuery(residentId);
  const [selected, setSelected] = useState<AssessmentAreaKey | null>(null);

  const plans = plansQuery.data ?? [];

  useEffect(() => {
    if (!selected && plans.length > 0) setSelected(plans[0]!.areaKey);
  }, [plans, selected]);

  if (plansQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <PartCard
        title="CARE PLANS"
        description="Care plans are created when the assessment is completed."
      >
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onBack}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          Go to the assessment
        </Button>
      </PartCard>
    );
  }

  const plan = plans.find((p) => p.areaKey === selected) ?? plans[0]!;
  const agreedCount = plans.filter((p) => p.agreedAt != null).length;

  return (
    <div className="space-y-6">
      <Text size="sm" className="text-slate-600">
        {plans.length} care plans · {agreedCount} agreed
      </Text>

      <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6 items-start">
        <ul className="bg-surface-card-grey rounded-2xl p-2 space-y-1 lg:sticky lg:top-4">
          {plans.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={p.areaKey === plan.areaKey}
                onClick={() => setSelected(p.areaKey)}
                className={cn(
                  "w-full text-left rounded-xl px-3 py-2.5 flex items-center justify-between gap-2",
                  p.areaKey === plan.areaKey
                    ? "bg-white shadow-xs"
                    : "hover:bg-white/60",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-md font-bold text-slate-800">
                    {p.area}
                  </span>
                  <span className="block text-sm text-slate-600">
                    {p.taskCount} task{p.taskCount === 1 ? "" : "s"}
                  </span>
                </span>
                {p.status === "Agreed" ? (
                  <RatingPill rating="low">Agreed</RatingPill>
                ) : (
                  <RatingPill rating="med">Draft</RatingPill>
                )}
              </button>
            </li>
          ))}
        </ul>

        <PlanEditor
          key={plan.areaKey}
          residentId={residentId}
          plan={plan}
          tasks={(tasksQuery.data ?? []).filter((t) => t.areaKey === plan.areaKey)}
        />
      </div>

      {showNav && (
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            Back to assessment
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onNext}
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            Next: carer tasks
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
