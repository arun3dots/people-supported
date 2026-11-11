"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight, Ambulance, Activity, CheckCircle2 } from "lucide-react";
import { Card, Button } from "@repo/ui/components/ui";
import { useGetEscalationsQuery } from "../../../../../lib/queries/escalations";

export function ManagerClinicalGovernanceWidget(): React.JSX.Element {
  const router = useRouter();
  const { data: escalationsData, isLoading } = useGetEscalationsQuery({
    status: "Open,Triaged,ActionTaken,EscalatedToGP,EscalatedTo999,EscalatedToManager",
  });

  const items = escalationsData?.items || [];
  const urgentCount = items.filter(
    (i) => i.severity === "Critical" || i.status === "EscalatedTo999" || i.status === "EscalatedToManager"
  ).length;

  return (
    <Card className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-emerald-950 text-white border-none rounded-2xl  font-normal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/10 text-purple-200">
              <ShieldAlert className="size-4" />
            </span>
            <span className="text-md font-normal uppercase tracking-wider text-purple-300">
              Clinical Governance &amp; CQC Oversight
            </span>
          </div>
          <p className="text-md text-normal">
            {urgentCount > 0
              ? `${urgentCount} acute escalation(s) require Registered Manager review or CQC Regulation 18 documentation.`
              : "All clinical escalations across branches are actively managed and triaged."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="hidden md:flex items-center gap-4 text-md pr-2 border-r border-white/10">
            <div className="text-right">
              <div className="text-slate-400 text-md">Active Cases</div>
              <div className="text-md font-normal text-white">{items.length}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-md">Critical</div>
              <div className="text-md font-normal text-rose-400">{urgentCount}</div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => router.push("/admin/escalations")}
            variant="secondary"
            className="font-normal"
          >
            Governance Hub <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
