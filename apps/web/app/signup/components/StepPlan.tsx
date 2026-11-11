"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { PublicPackage } from "../../../lib/queries/onboarding/useOnboarding";

interface StepPlanProps {
  packages?: PublicPackage[];
  selectedPackageId?: string | null;
  onSelectPackage: (packageId: string) => void;
  errorMessage?: string;
}

export function StepPlan({
  packages = [],
  selectedPackageId,
  onSelectPackage,
  errorMessage,
}: StepPlanProps) {
  if (packages.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <p className="text-md font-medium text-slate-500">
          No subscription plans are currently available. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;

          return (
            <div
              key={pkg.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPackage(pkg.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPackage(pkg.id);
                }
              }}
              className={cn(
                "relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700",
                isSelected
                  ? "border-emerald-700 bg-emerald-50/40 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                    {pkg.name}
                  </h4>
                  <p className="text-sm font-medium text-slate-500">
                    Up to {pkg.residentLimit} residents · {pkg.staffLimit} staff members
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900">
                      {pkg.currency} {pkg.priceMonthly}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 ml-1">
                      /mo
                    </span>
                  </div>

                  <div
                    className={cn(
                      "size-6 rounded-full flex items-center justify-center transition-colors border",
                      isSelected
                        ? "bg-emerald-800 border-emerald-800 text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {isSelected && <Check className="size-3.5 stroke-[2.5]" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <p className="text-sm font-medium text-red-500 mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
