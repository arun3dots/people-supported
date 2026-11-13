"use client";

import React from "react";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { Text } from "@repo/ui/components/ui";

interface ShiftStaffSummaryProps {
  activeStaffList: any[];
  selectedResidentCount: number;
}

export function ShiftStaffSummary({
  activeStaffList,
  selectedResidentCount,
}: ShiftStaffSummaryProps) {
  if (activeStaffList.length === 0) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 font-sans">
        <AlertCircle className="size-4 text-amber-600 shrink-0" />
        <Text size={'md'} weight="medium" className="text-amber-900">
          Select staff member(s) below to view staff profile, capacity, and competency metrics.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <Text as="h3" size="md" weight="semibold" className="text-slate-900">
          Selected Staff Members ({activeStaffList.length})
        </Text>
        <Text size="md" weight="medium" className="text-primary">
          Shift &amp; care assignments apply to all selected staff
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
        {activeStaffList.map((stf: any) => {
          const validCerts = stf.certifications?.filter((c: any) => c.status === "Valid")?.length ?? 0;
          const totalCerts = stf.certifications?.length ?? 0;
          const compliancePct = totalCerts > 0
            ? Math.round((validCerts / totalCerts) * 100)
            : stf.compliancePercentage ?? 95;
          const isNurse = stf.role?.name?.toLowerCase().includes("nurse");
          const maxCapacity = isNurse ? 10 : 6;
          const isAtCapacity = selectedResidentCount > maxCapacity;

          return (
            <div
              key={stf.id}
              className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full overflow-hidden bg-primary/10 text-primary border border-primary/20 shrink-0 flex items-center justify-center font-bold text-md">
                  {stf.avatarUrl || stf.avatar ? (
                    <Image
                      unoptimized
                      src={stf.avatarUrl || stf.avatar}
                      alt={stf.fullName || "Staff"}
                      width={40}
                      height={40}
                      className="object-cover size-full"
                    />
                  ) : (
                    (stf.fullName || "S").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <Text size="md" weight="medium" className="text-slate-900 truncate">
                    {stf.fullName}
                  </Text>
                  <Text size="md" weight="regular" className="text-slate-500 truncate">
                    {stf.role?.name || "Care Staff"}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-900 border-l border-slate-200 pl-3 shrink-0">
                <div className="text-center">
                  <Text size="md" weight="medium" className="text-md text-slate-500">Compliance</Text>
                  <Text size="md" weight="bold" className={compliancePct >= 80 ? "text-primary" : "text-amber-700"}>
                    {compliancePct}%
                  </Text>
                </div>
                <div className="text-center border-l border-slate-200 pl-3">
                  <Text size="md" weight="medium" className="text-md text-slate-500">Assigned</Text>
                  <Text size="md" weight="bold" className={isAtCapacity ? "text-rose-600 font-extrabold" : "text-slate-900"}>
                    {selectedResidentCount.toString().padStart(2, "0")} / {maxCapacity.toString().padStart(2, "0")}
                  </Text>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
