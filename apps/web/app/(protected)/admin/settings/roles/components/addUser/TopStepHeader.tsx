"use client";

import React from "react";
import { Check } from "lucide-react";
import { UserFormSection } from "./data/addUserFields";
import { cn } from "@repo/ui/lib/utils";

interface TopStepHeaderProps {
  sections: UserFormSection[];
  currentStep: number;
  onSelectStep: (stepIndex: number) => void;
}

export function TopStepHeader({
  sections,
  currentStep,
  onSelectStep,
}: TopStepHeaderProps) {
  return (
    <div className="w-full bg-[#4A706A] rounded-2xl p-6 sm:p-7 text-white shadow-xs">
      <div className="flex items-center justify-between relative max-w-3xl mx-auto">
        {sections.map((section, idx) => {
          const isActive = currentStep === idx;
          const isCompleted = currentStep > idx;
          const isLast = idx === sections.length - 1;

          return (
            <React.Fragment key={section.id}>
              {/* Step Circle & Label Container */}
              <div
                onClick={() => {
                  if (idx <= currentStep) {
                    onSelectStep(idx);
                  }
                }}
                className={cn(
                  "flex flex-col items-center group cursor-pointer z-10 select-none",
                  idx > currentStep && "cursor-not-allowed opacity-90"
                )}
              >
                <div
                  className={cn(
                    "size-10 sm:size-11 rounded-full flex items-center justify-center text-md sm:text-base font-semibold transition-all duration-200",
                    isActive
                      ? "bg-white text-[#4A706A] shadow-md border-2 border-white scale-105"
                      : isCompleted
                        ? "bg-white/20 text-white border-2 border-white/80"
                        : "bg-transparent text-white border-2 border-white/60"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-5 text-white stroke-[2.5]" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    "mt-3 text-md sm:text-md font-regular tracking-wide text-center transition-opacity",
                    isActive ? "text-white opacity-100 font-bold" : "text-white/90"
                  )}
                >
                  {section.sectionTitle}
                </span>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-[2px] bg-white/40 mx-2 sm:mx-4 -mt-7" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
