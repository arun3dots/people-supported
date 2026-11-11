"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Card } from "@repo/ui/components/ui";
import { ADMISSION_STEPS } from "../data/admissionFormFields";
import { AdmissionStep, AdmissionStepMeta } from "../types";

// Structured 2-line labels (Line 1 = Up, Line 2 = Down)
const STEP_LABELS: Record<number, { line1: string; line2?: string }> = {
  1: { line1: "Personal" },
  2: { line1: "Contacts", line2: "POA" },
  3: { line1: "Medical", line2: "Hx" },
  4: { line1: "ADL", line2: "Psychosocial" },
  5: { line1: "Legal", line2: "Consents" },
  6: { line1: "Financial" },
  7: { line1: "Room", line2: "Belongings" },
  8: { line1: "Documents" },
  9: { line1: "Review" },
};

interface AdmissionStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (stepId: AdmissionStep) => void;
  isEditMode?: boolean;
  steps?: AdmissionStepMeta[];
  labels?: Record<number, { line1: string; line2?: string }>;
}

export function AdmissionStepper({
  currentStep,
  completedSteps,
  onStepClick,
  isEditMode = false,
  steps = ADMISSION_STEPS,
  labels: labelMap = STEP_LABELS,
}: AdmissionStepperProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeStepRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to toggle left and right scroll hint buttons
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  // Smooth auto-scroll whenever active step changes (e.g. stepping into 8 or 9)
  useEffect(() => {
    if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentStep]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.45;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <Card
      variant="primary"
      border="default"
      className="p-4 sm:p-5 shadow-none font-sans overflow-hidden relative group"
    >
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="absolute left-2 top-[36px] sm:top-[42px] -translate-y-1/2 z-30 size-7 sm:size-8 rounded-full bg-emerald-950/85 hover:bg-emerald-950 text-white flex items-center justify-center shadow-lg border border-white/20 transition-all cursor-pointer"
          aria-label="Scroll left to view previous steps"
        >
          <ChevronLeft className="size-4 sm:size-5" />
        </button>
      )}

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="absolute right-2 top-[36px] sm:top-[42px] -translate-y-1/2 z-30 size-7 sm:size-8 rounded-full bg-emerald-950/85 hover:bg-emerald-950 text-white flex items-center justify-center shadow-lg border border-white/20 transition-all cursor-pointer"
          aria-label="Scroll right to view remaining steps"
        >
          <ChevronRight className="size-4 sm:size-5" />
        </button>
      )}

      {/* Scrollable Container with styled custom scrollbar */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="w-full overflow-x-auto scroll-smooth pb-1.5 pt-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.3)_transparent]"
      >
        {/* Step Track: Exactly 6 steps fit initially (w-[calc(100%/6)]), steps 7, 8 and 9 scroll into view */}
        <div className="flex items-start w-full min-w-full">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.number;
            const isCompleted = completedSteps.has(step.number);
            const isLast = idx === steps.length - 1;
            const isClickable =
              isEditMode || step.number <= currentStep || completedSteps.has(step.number);
            const labels = labelMap[step.number] || { line1: step.shortTitle };

            return (
              <div
                key={step.number}
                ref={isActive ? activeStepRef : null}
                className="w-[calc(100%/6)] min-w-[140px] shrink-0 relative flex flex-col items-center group select-none"
              >
                {/* 1. Connecting line with breathing room gap (does not touch circles) */}
                {!isLast && (
                  <div
                    className="absolute top-[20px] sm:top-[22px] left-[calc(50%+36px)] sm:left-[calc(50%+40px)] w-[calc(100%-72px)] sm:w-[calc(100%-80px)] h-[2px] bg-white/40 rounded-full -translate-y-1/2 z-0"
                    aria-hidden="true"
                  />
                )}

                {/* 2. Top Number Circle (Increased to size-10 sm:size-11) */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step.number)}
                  className={cn(
                    "relative z-10 size-10 sm:size-11 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-hidden",
                    isActive
                      ? "bg-white text-emerald-900 border-2 border-white shadow-md font-bold scale-105"
                      : isCompleted
                        ? "bg-white/20 text-white border-2 border-white/80 hover:bg-white/30"
                        : "bg-transparent text-white border-2 border-white/60",
                    isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="size-5 text-white stroke-[2.5]" />
                  ) : (
                    <span className="text-sm sm:text-base font-semibold leading-none">
                      {step.number}
                    </span>
                  )}
                </button>

                {/* 3. Text Container (Vertically centered: 1-line text is centered, 2-line text is stacked up & down) */}
                <div
                  onClick={() => isClickable && onStepClick(step.number)}
                  className={cn(
                    "mt-2.5 h-[38px] sm:h-[42px] flex flex-col items-center justify-center text-center w-full px-1",
                    isClickable ? "cursor-pointer" : "cursor-not-allowed"
                  )}
                >
                  {/* Line 1 (Up - Increased font) */}
                  <span
                    className={cn(
                      "text-sm sm:text-md leading-tight tracking-tight truncate max-w-full",
                      isActive ? "text-white font-bold" : "text-white/90 font-medium"
                    )}
                  >
                    {labels.line1}
                  </span>

                  {/* Line 2 (Down - Matching text size) */}
                  {labels.line2 && (
                    <span
                      className={cn(
                        "text-sm sm:text-md leading-tight tracking-tight truncate max-w-full mt-0.5",
                        isActive ? "text-white font-bold" : "text-white/90 font-medium"
                      )}
                    >
                      {labels.line2}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
