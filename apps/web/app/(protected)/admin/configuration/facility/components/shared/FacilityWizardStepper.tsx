"use client";

import { Check } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

export interface WizardStep {
  id: number;
  label: string;
}

interface FacilityWizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
}

export function FacilityWizardStepper({
  steps,
  currentStep,
}: FacilityWizardStepperProps) {
  return (
    <div className="bg-[#4A706A] rounded-2xl py-4 px-3 sm:px-6 my-3 w-full">
      <div className="flex items-start justify-between relative w-full">
        {steps.map((s, idx) => {
          const isCompleted = currentStep > s.id;
          const isActive = currentStep === s.id;

          return (
            <div
              key={s.id}
              className="flex flex-col items-center justify-start relative flex-1 px-0.5"
            >
              {/* Connecting line to next step */}
              {idx < steps.length - 1 && (
                <div className="absolute top-4 sm:top-5 left-[calc(50%+16px)] sm:left-[calc(50%+20px)] w-[calc(100%-32px)] sm:w-[calc(100%-40px)] h-[1.5px] bg-[#F5F8F7] z-0" />
              )}

              {/* Step Circle */}
              <div
                className={cn(
                  "size-8 sm:size-10 rounded-full flex items-center justify-center text-md sm:text-base font-medium font-outfit transition-all shrink-0 border z-10 relative",
                  isActive
                    ? "bg-white text-[#4A706A] border-[#F5F8F7] shadow-sm font-semibold"
                    : isCompleted
                      ? "bg-white text-[#4A706A] border-[#F5F8F7]"
                      : "bg-[#4A706A] border-[#F5F8F7] text-white"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4 text-[#4A706A] stroke-[2.5]" />
                ) : (
                  s.id
                )}
              </div>

              {/* Label text below circle */}
              <span
                className={cn(
                  "mt-2 text-md text-center font-medium font-outfit leading-tight text-white transition-colors tracking-tight whitespace-nowrap"
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
