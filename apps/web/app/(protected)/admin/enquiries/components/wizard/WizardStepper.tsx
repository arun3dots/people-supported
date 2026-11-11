"use client";

import React from "react";
import { Check, LucideIcon } from "lucide-react";
import { Button, Card, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export interface WizardStepItem {
  id: number;
  title: string;
  icon: LucideIcon;
}

interface WizardStepperProps {
  steps: WizardStepItem[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  canNavigate: boolean;
}

export function WizardStepper({
  steps,
  currentStep,
  onStepClick,
  canNavigate,
}: WizardStepperProps) {
  return (
    <Card variant="wizard" className="font-['Outfit',sans-serif]">
      <div className="flex items-center justify-between relative w-full max-w-2xl mx-auto">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center justify-start relative flex-1 px-1"
            >
              {/* Connecting line between step nodes */}
              {idx < steps.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 bg-slate-200 z-0">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 ease-in-out",
                      isCompleted ? "bg-emerald-800 w-full" : "w-0"
                    )}
                  />
                </div>
              )}

              {/* Step Circle Indicator */}
              <Button
                variant="circle"
                size="circle"
                onClick={() => {
                  if (canNavigate || step.id === 1) {
                    onStepClick(step.id);
                  }
                }}
                className={cn(
                  "cursor-pointer transition-all duration-200 z-10 size-9 rounded-full flex items-center justify-center font-bold",
                  isCompleted
                    ? "bg-emerald-800 text-white border-emerald-800"
                    : isActive
                      ? "bg-emerald-800 text-white border-emerald-800 ring-4 ring-emerald-100"
                      : "bg-white border-slate-300 text-slate-600 hover:border-emerald-700"
                )}
              >
                {isCompleted ? <Check className="size-4 stroke-2" /> : step.id}
              </Button>

              {/* Step Label */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (canNavigate || step.id === 1) {
                    onStepClick(step.id);
                  }
                }}
                className={cn(
                  "mt-2 text-center font-medium leading-tight cursor-pointer hover:bg-transparent p-0 h-auto",
                  isActive
                    ? "text-emerald-800 font-bold"
                    : isCompleted
                      ? "text-emerald-800 font-semibold"
                      : "text-slate-500 font-medium"
                )}
              >
                <Text size="md" weight={isActive ? "medium" : "regular"}>
                  {step.title}
                </Text>
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
