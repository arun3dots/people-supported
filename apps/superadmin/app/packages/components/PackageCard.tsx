"use client";

import { Button, Badge, Text } from "@repo/ui/components/ui";
import { Pencil, Power, Users, Bed } from "lucide-react";
import type { SubscriptionPackage } from "../../../lib/types/package";

interface PackageCardProps {
  pkg: SubscriptionPackage;
  onEdit: (pkg: SubscriptionPackage) => void;
  onDeactivate: (id: string) => void;
  deactivating: boolean;
}

export function PackageCard({
  pkg,
  onEdit,
  onDeactivate,
  deactivating,
}: PackageCardProps) {
  return (
    <div
      className={`bg-surface-card-grey rounded-2xl p-6 space-y-4 transition-all ${
        pkg.isActive ? "hover:bg-slate-100/80" : "opacity-60 grayscale"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <Text as="h3" size="sm" weight="bold" className="text-slate-900">
            {pkg.name}
          </Text>
          <div className="flex gap-1.5 mt-1.5">
            {pkg.isCustom && (
              <Badge state="info" className="text-2xs font-semibold px-2 py-0.5 rounded-full">
                Custom
              </Badge>
            )}
            <Badge
              state={pkg.isPublic ? "success" : "inactive"}
              className="text-2xs font-semibold px-2 py-0.5 rounded-full"
            >
              {pkg.isPublic ? "Public" : "Private"}
            </Badge>
            {!pkg.isActive && (
              <Badge state="danger" className="text-2xs font-semibold px-2 py-0.5 rounded-full">
                Inactive
              </Badge>
            )}
          </div>
        </div>
        <Text as="div" size="lg" weight="bold" className="text-slate-900">
          {pkg.currency} {pkg.priceMonthly}
          <span className="text-xs font-normal text-slate-500 ml-1">
            /mo
          </span>
        </Text>
      </div>

      <div className="flex gap-4 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200/60">
        <span className="flex items-center gap-1.5 font-medium">
          <Users className="size-3.5 text-slate-400" /> {pkg.residentLimit} residents
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <Bed className="size-3.5 text-slate-400" /> {pkg.staffLimit} staff
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-xs"
          onClick={() => onEdit(pkg)}
        >
          <Pencil className="size-3.5" /> Edit
        </Button>
        {pkg.isActive && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={deactivating}
            onClick={() => onDeactivate(pkg.id)}
          >
            <Power className="size-3.5" /> Deactivate
          </Button>
        )}
      </div>
    </div>
  );
}
