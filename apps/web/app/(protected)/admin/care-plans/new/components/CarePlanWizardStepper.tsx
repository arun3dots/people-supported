"use client";


import { Check, LucideIcon } from "lucide-react";
import { Text } from "@repo/ui/components/ui";
import { Fragment } from "react";

interface Step {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface CarePlanWizardStepperProps {
  steps: Step[];
  currentStep: number;
}

export function CarePlanWizardStepper({
  steps,
  currentStep,
}: CarePlanWizardStepperProps) {
  return (
    <div className="bg-surface-card-grey rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-sans shadow-none border-none">
      {steps.map((step, idx) => {
        const isDone = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const StepIcon = step.icon;

        return (
          <Fragment key={step.id}>
            <div
              className={`flex-1 w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${isCurrent
                ? "bg-white shadow-sm border border-slate-200/80"
                : "bg-transparent"
                }`}
            >
              <div
                className={`size-8 rounded-full flex items-center justify-center font-bold text-md shrink-0 transition-colors ${isCurrent
                  ? "bg-emerald-800 text-white"
                  : isDone
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                    : "bg-slate-100 text-slate-400"
                  }`}
              >
                {isDone ? (
                  <Check className="size-4 stroke-[2.5]" />
                ) : (
                  <StepIcon className="size-4" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span
                  className={`text-2sm font-semibold  tracking-wider ${isCurrent
                    ? "text-emerald-800"
                    : isDone
                      ? "text-slate-700"
                      : "text-slate-400"
                    }`}
                >
                  Step {step.id}
                </span>
                <Text
                  size="md"
                  weight={isCurrent ? "semibold" : "medium"}
                  className={`truncate ${isCurrent
                    ? "text-slate-900 font-bold"
                    : isDone
                      ? "text-slate-700"
                      : "text-slate-400"
                    }`}
                >
                  {step.label}
                </Text>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden sm:block w-4 h-0.5 bg-slate-200 shrink-0" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
