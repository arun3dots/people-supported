"use client";

import React from "react";
import { Activity, ShieldAlert, Calendar } from "lucide-react";
import { HighRiskResidentsCard } from "../../../shared/components/risk-assessment";
import { NurseTriageQueue } from "./components/NurseTriageQueue";

export default function NurseDashboardPage(): React.JSX.Element {
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full space-y-6 pb-12 font-['Outfit',sans-serif] max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
              <Activity className="size-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Nurse Clinical Command Centre
            </h1>
          </div>
          <p className="text-md sm:text-md text-slate-500 font-medium mt-1">
            Real-time branch escalations, SBAR triage queue, and clinical risk governance.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-md font-semibold text-slate-700 self-start sm:self-auto">
          <Calendar className="size-3.5 text-emerald-800" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Main Grid: Triage Queue (8 cols) & Clinical Risk Governance (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        <div className="lg:col-span-8 w-full">
          <NurseTriageQueue />
        </div>
        <div className="lg:col-span-4 w-full space-y-6">
          <HighRiskResidentsCard />
        </div>
      </div>
    </div>
  );
}
