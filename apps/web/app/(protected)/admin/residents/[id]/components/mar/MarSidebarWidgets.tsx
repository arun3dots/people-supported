"use client";

import React from "react";
import { format } from "date-fns";
import { ShieldAlert, Info, Clock, CheckCircle2, FileText } from "lucide-react";
import { Card, Text } from "@repo/ui/components/ui";

interface MarSidebarWidgetsProps {
  allergies: string[];
  recentAdministrations: any[];
  specialRequirements?: string | null;
}

export function MarSidebarWidgets({
  allergies,
  recentAdministrations,
  specialRequirements,
}: MarSidebarWidgetsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
      {/* 1. Allergies & Contraindications (Longer: 40% width) */}
      <Card className="md:col-span-4 min-h-[120px] flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200/80 shadow-xs bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
          <div className="size-7 rounded-xl bg-red-50 border border-red-200/80 flex items-center justify-center text-red-700 shrink-0">
            <ShieldAlert className="size-3.5" />
          </div>
          <div className="min-w-0">
            <Text
              as="h3"
              style={{ fontSize: "14px" }}
              weight="medium"
              className="!text-[14px] text-slate-900 leading-tight truncate font-medium"
            >
              Allergies & Contraindications
            </Text>
            <Text size="md" variant="muted" className="text-md leading-tight truncate">
              Critical contraindications and drug allergies
            </Text>
          </div>
        </div>

        {/* Inner Cards in 1 Row */}
        <div className="flex-1 flex items-center">
          {allergies.length === 0 ? (
            <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-md text-slate-500">
              <Info className="size-3.5 text-slate-400 shrink-0" />
              <span className="truncate">No known drug allergies recorded</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 w-full">
              {allergies.map((allergy, idx) => (
                <div
                  key={idx}
                  className="bg-red-50/70 border border-red-200/80 rounded-xl px-2 py-1 flex items-center gap-1.5 min-w-0"
                  title={allergy}
                >
                  <div className="size-4 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 font-bold text-md">
                    !
                  </div>
                  <div className="min-w-0 flex-1">
                    <Text size="md" weight="medium" className="text-slate-900 truncate block text-md leading-tight font-medium">
                      {allergy}
                    </Text>
                    <Text size="md" variant="muted" className="text-md text-red-600/90 leading-tight">
                      Allergy
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 2. Recent Administrations (Equal width: 30% width) */}
      <Card className="md:col-span-3 min-h-[120px] flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200/80 shadow-xs bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
          <div className="size-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-emerald-800 shrink-0">
            <Clock className="size-3.5" />
          </div>
          <div className="min-w-0">
            <Text
              as="h3"
              style={{ fontSize: "14px" }}
              weight="medium"
              className="!text-[14px] text-slate-900 leading-tight truncate font-medium"
            >
              Recent Administrations
            </Text>
            <Text size="md" variant="muted" className="text-md leading-tight truncate">
              Audit log of completed medication events
            </Text>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center divide-y divide-slate-100">
          {recentAdministrations.length === 0 ? (
            <div className="py-1 text-center text-md text-slate-400">
              No recent administrations logged
            </div>
          ) : (
            recentAdministrations.slice(0, 2).map((admin: any) => (
              <div key={admin.id} className="flex items-center justify-between gap-2 py-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="size-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-3" />
                  </div>
                  <Text size="md" weight="medium" className="text-slate-900 truncate text-md font-medium">
                    {admin.drugName} {admin.dose}
                  </Text>
                  <Text size="md" variant="muted" className="text-md truncate">
                    • {admin.administeredBy}
                  </Text>
                </div>
                <div className="text-right shrink-0">
                  <Text size="md" variant="muted" className="text-md">
                    {format(new Date(admin.administeredAt), "dd MMM, HH:mm")}
                  </Text>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 3. Medication Notes (Equal width: 30% width) */}
      <Card className="md:col-span-3 min-h-[120px] flex flex-col justify-between bg-amber-50/40 border border-amber-200/80 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2 mb-2">
          <div className="size-7 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <FileText className="size-3.5" />
          </div>
          <div className="min-w-0">
            <Text
              as="h3"
              style={{ fontSize: "14px" }}
              weight="medium"
              className="!text-[14px] text-slate-900 leading-tight truncate font-medium"
            >
              Medication Notes
            </Text>
            <Text size="md" variant="muted" className="text-md leading-tight truncate">
              Special instructions & administration guidelines
            </Text>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center text-slate-700 leading-relaxed overflow-hidden">
          {specialRequirements ? (
            <p className="line-clamp-2 text-md text-slate-600">{specialRequirements}</p>
          ) : (
            <p className="text-slate-400 italic text-md">No special medication notes recorded for this resident.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
