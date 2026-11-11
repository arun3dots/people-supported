"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface SignUpStepperProps {
  currentStep: number;
}

const STEPS = [
  { step: 1, label: "Organisation" },
  { step: 2, label: "Admin Account" },
  { step: 3, label: "Choose Plan" },
];

export function SignUpStepper({ currentStep }: SignUpStepperProps) {
  return (
    <div className="w-full bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100">
      <div className="flex items-center justify-between w-full max-w-xl mx-auto">
        {STEPS.map((item, idx) => {
          const isActive = currentStep === item.step;
          const isCompleted = currentStep > item.step;
          const isLast = idx === STEPS.length - 1;

          return (
            <React.Fragment key={item.step}>
              {/* Step Node */}
              <div className="flex flex-col items-center justify-start relative select-none">
                {/* Circle Indicator */}
                <div
                  className={cn(
                    "size-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 z-10 border",
                    isCompleted
                      ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                      : isActive
                        ? "bg-emerald-800 text-white border-emerald-800 ring-4 ring-emerald-100 shadow-sm"
                        : "bg-white border-slate-300 text-slate-500"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4 stroke-[2.5]" />
                  ) : (
                    <span>{item.step}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    "mt-2 text-center text-sm tracking-tight transition-colors duration-150 whitespace-nowrap",
                    isActive
                      ? "text-emerald-900 font-bold"
                      : isCompleted
                        ? "text-emerald-800 font-semibold"
                        : "text-slate-500 font-medium"
                  )}
                >
                  {item.label}
                </span>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-[2px] bg-slate-200 mx-2 -mt-6 relative overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full bg-emerald-800 transition-all duration-300 ease-in-out",
                      currentStep > idx + 1 ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
