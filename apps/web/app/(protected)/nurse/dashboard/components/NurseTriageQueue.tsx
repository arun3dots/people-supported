"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  ShieldCheck,
  PhoneCall,
  Ambulance,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Skeleton,
} from "@repo/ui/components/ui";
import { ClinicalEscalationItemDTO } from "@repo/schema";
import {
  useGetEscalationsQuery,
  useGetEscalationShiftSummaryQuery,
} from "../../../../../lib/queries/escalations";
import { SbarTriageModal } from "../../../../shared/components/escalations/SbarTriageModal";

export function NurseTriageQueue(): React.JSX.Element {
  const [selectedEscalation, setSelectedEscalation] = useState<ClinicalEscalationItemDTO | null>(null);
  const [isTriageOpen, setIsTriageOpen] = useState(false);

  const {
    data: escalationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useGetEscalationsQuery({
    status: "Open,Triaged,ActionTaken,EscalatedToGP,EscalatedTo999,EscalatedToManager",
  });

  const { data: shiftSummary } = useGetEscalationShiftSummaryQuery();

  const activeEscalations = escalationsData?.items || [];

  const handleOpenTriage = (item: ClinicalEscalationItemDTO) => {
    setSelectedEscalation(item);
    setIsTriageOpen(true);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <Flame className="size-3 text-rose-600" />
            CRITICAL
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <AlertTriangle className="size-3 text-orange-600" />
            HIGH PRIORITY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-bold bg-amber-50 text-amber-800 border border-amber-200">
            MEDIUM
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-['Outfit',sans-serif]">
      {/* Clinical Shift KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Alerts</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {activeEscalations.filter((e) => e.status === "Open").length}
          </div>
          <div className="text-sm text-slate-400 mt-0.5">Awaiting SBAR triage</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">In Progress Triage</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {activeEscalations.filter((e) => e.status !== "Open" && e.status !== "Resolved").length}
          </div>
          <div className="text-sm text-slate-400 mt-0.5">Monitoring / GP calls</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Emergency / Critical</div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {shiftSummary?.emergencyCount ?? 0}
          </div>
          <div className="text-sm text-slate-400 mt-0.5">Escalated to Hospital/Mgr</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Shift Escalations</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {shiftSummary?.totalToday ?? 0}
          </div>
          <div className="text-sm text-slate-400 mt-0.5">Total shift records</div>
        </div>
      </div>

      {/* Main Triage Queue Card */}
      <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-emerald-800" />
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Live Clinical Triage &amp; Escalation Queue
              </h3>
            </div>
            <p className="text-md text-slate-500 mt-0.5">
              Urgent carer flags, skipped medication alerts, and acute resident deterioration.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8 px-3 rounded-xl text-md font-semibold text-slate-700 border-slate-200 gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh Queue
          </Button>
        </div>

        {/* List of Escalations */}
        <div className="space-y-3">
          {isLoading ? (
            [1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <Skeleton className="h-10 w-2/3 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))
          ) : activeEscalations.length > 0 ? (
            activeEscalations.map((item) => {
              const residentName = item.resident?.fullName || "Resident";
              const roomNumber = item.resident?.bed?.room?.roomNumber;
              const dateStr = new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSeverityBadge(item.severity)}
                        <Badge variant="outline" className="text-sm font-bold text-slate-700 border-slate-200">
                          {item.reason}
                        </Badge>
                        <span className="text-md font-bold text-slate-900">{residentName}</span>
                        {roomNumber && (
                          <span className="text-sm text-slate-500 font-medium">(Room {roomNumber})</span>
                        )}
                        <span className="text-sm text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                          <Clock className="size-3" /> {dateStr}
                        </span>
                      </div>

                      <p className="text-md text-slate-700 leading-relaxed font-normal">
                        {item.initialNotes}
                      </p>

                      <div className="text-sm text-slate-500 font-medium">
                        Raised by: <span className="text-slate-700 font-semibold">{item.raisedBy?.fullName || "Carer"}</span>
                        {item.dailyTask && ` • Linked Task: ${item.dailyTask.title}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <Button
                        size="sm"
                        onClick={() => handleOpenTriage(item)}
                        className="h-8.5 px-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-md gap-1.5 shadow-none cursor-pointer"
                      >
                        <Activity className="size-3.5" />
                        Perform SBAR Triage
                      </Button>
                    </div>
                  </div>

                  {item.actionsTaken && Array.isArray(item.actionsTaken) && item.actionsTaken.length > 1 && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                      <ShieldCheck className="size-3 text-emerald-600" />
                      <span>{item.actionsTaken.length} actions logged (Latest: {item.actionsTaken[item.actionsTaken.length - 1]?.action})</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
              <CheckCircle2 className="size-8 text-emerald-700 mx-auto mb-2" />
              <div className="text-md font-bold text-slate-800">No Pending Clinical Escalations</div>
              <p className="text-md text-slate-500 mt-0.5">
                All resident care alerts and skipped routines in your branch have been triaged.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Triage Dialog */}
      <SbarTriageModal
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
        escalation={selectedEscalation}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
