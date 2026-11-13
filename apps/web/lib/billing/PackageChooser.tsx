"use client";

import { Check, Loader2, Users, Bed } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { PublicPackage } from "../queries/onboarding/useOnboarding";

interface PackageChooserProps {
  packages: PublicPackage[];
  /** Currently-assigned package id, highlighted as selected. */
  selectedId?: string | null;
  /** Id currently being submitted (shows a spinner on that card). */
  busyId?: string | null;
  onSelect: (packageId: string) => void;
}

/**
 * Grid of public subscription packages used inside the payment gate, both for
 * first-time selection (no package yet) and for switching plans before payment.
 */
export function PackageChooser({
  packages,
  selectedId,
  busyId,
  onSelect,
}: PackageChooserProps) {
  if (packages.length === 0) {
    return (
      <p className="py-8 text-center text-md text-muted-foreground">
        No subscription packages are available right now. Please contact
        support.
      </p>
    );
  }

  return (
    <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
      {packages.map((pkg) => {
        const selected = selectedId === pkg.id;
        const busy = busyId === pkg.id;
        return (
          <button
            key={pkg.id}
            type="button"
            disabled={!!busyId}
            onClick={() => onSelect(pkg.id)}
            className={cn(
              "relative rounded-2xl border-2 p-5 text-left transition-all disabled:opacity-60",
              selected
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-slate-100 bg-white hover:border-slate-200",
            )}
          >
            {selected && (
              <span className="absolute right-4 top-4 text-primary">
                <Check className="h-5 w-5" />
              </span>
            )}
            <h4 className="text-base font-bold text-foreground">{pkg.name}</h4>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {pkg.currency} {pkg.priceMonthly}
              <span className="text-md font-medium text-muted-foreground">
                /mo
              </span>
            </div>
            <div className="mt-3 flex gap-4 text-md text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {pkg.residentLimit} residents
              </span>
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" /> {pkg.staffLimit} staff
              </span>
            </div>
            {busy && (
              <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
