"use client";

import { Input, Label, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { SubscriptionPackage } from "../../../../lib/types/package";

export interface CustomPackageForm {
  name: string;
  priceMonthly: string;
  residentLimit: string;
  staffLimit: string;
  currency: string;
}

interface StepSubscriptionProps {
  selectablePackages: SubscriptionPackage[];
  useCustomPackage: boolean;
  selectedPackageId: string | null | undefined;
  onSelectPackage: (id: string) => void;
  onSelectCustom: () => void;
  customForm: CustomPackageForm;
  onCustomFormChange: (form: CustomPackageForm) => void;
}

export function StepSubscription({
  selectablePackages,
  useCustomPackage,
  selectedPackageId,
  onSelectPackage,
  onSelectCustom,
  customForm,
  onCustomFormChange,
}: StepSubscriptionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectablePackages.map((pkg) => {
          const selected = !useCustomPackage && selectedPackageId === pkg.id;
          return (
            <div
              key={pkg.id}
              className={cn(
                "p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white",
                selected
                  ? "border-emerald-800 bg-emerald-50/50 shadow-sm"
                  : "border-slate-200/80 hover:border-slate-300",
              )}
              onClick={() => onSelectPackage(pkg.id)}
            >
              <Text as="h4" size="sm" weight="bold" className="text-slate-900 mb-1">
                {pkg.name}
              </Text>
              <Text size="xs" variant="subdued" className="mb-3">
                Up to {pkg.residentLimit} residents · {pkg.staffLimit} staff
              </Text>
              <Text as="div" size="lg" weight="bold" className="text-slate-900">
                {pkg.currency} {pkg.priceMonthly}
                <span className="text-xs font-normal text-slate-500 ml-1">
                  /mo
                </span>
              </Text>
            </div>
          );
        })}

        {/* Custom package option */}
        <div
          className={cn(
            "p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer bg-white",
            useCustomPackage
              ? "border-emerald-800 bg-emerald-50/50 shadow-sm"
              : "border-slate-200 hover:border-slate-300",
          )}
          onClick={onSelectCustom}
        >
          <Text as="h4" size="sm" weight="bold" className="text-slate-900 mb-1">
            Custom package
          </Text>
          <Text size="xs" variant="subdued">
            Define bespoke pricing &amp; limits for this tenant only.
          </Text>
        </div>
      </div>

      {useCustomPackage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-white border border-slate-200/80">
          <div className="space-y-1.5 md:col-span-2 [&_[data-slot=input-error]]:hidden">
            <Label required>Package Name</Label>
            <Input
              placeholder="e.g. Enterprise (Willow Creek)"
              value={customForm.name}
              onChange={(e) =>
                onCustomFormChange({ ...customForm, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required>Monthly Price</Label>
            <Input
              type="number"
              placeholder="4999"
              value={customForm.priceMonthly}
              onChange={(e) =>
                onCustomFormChange({
                  ...customForm,
                  priceMonthly: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required>Currency</Label>
            <Input
              placeholder="INR"
              value={customForm.currency}
              onChange={(e) =>
                onCustomFormChange({ ...customForm, currency: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required>Resident Limit</Label>
            <Input
              type="number"
              placeholder="100"
              value={customForm.residentLimit}
              onChange={(e) =>
                onCustomFormChange({
                  ...customForm,
                  residentLimit: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required>Staff Limit</Label>
            <Input
              type="number"
              placeholder="100"
              value={customForm.staffLimit}
              onChange={(e) =>
                onCustomFormChange({
                  ...customForm,
                  staffLimit: e.target.value,
                })
              }
            />
          </div>
        </div>
      )}

      <Text size="xs" variant="subdued" className="text-center">
        A verification email and a payment link will be sent to the primary contact. The tenant can log in but must complete payment to unlock the dashboard.
      </Text>
    </div>
  );
}
