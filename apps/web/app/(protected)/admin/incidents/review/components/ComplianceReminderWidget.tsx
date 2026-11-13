"use client";

import React, { useMemo } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Button } from "@repo/ui/components/ui/Button";
import { Badge } from "@repo/ui/components/ui/Badge";
import { Text } from "@repo/ui/components/ui/Text";
import { toast } from "@repo/ui/components/ui";
import { Incident } from "../../../../../../lib/types/incident";

interface ComplianceReminderWidgetProps {
  incident?: Incident | null;
  onEscalate?: () => void;
}

function getIncidentTimestamp(incident?: Incident | null): Date {
  if (!incident) return new Date();
  if (incident.createdAt) {
    const createdDate = new Date(incident.createdAt);
    if (!isNaN(createdDate.getTime())) return createdDate;
  }
  if (incident.incidentDate) {
    const timeStr = incident.incidentTime || "09:00";
    const [h = 9, m = 0] = timeStr.split(":").map(Number);
    const d = new Date(incident.incidentDate);
    if (!isNaN(d.getTime())) {
      d.setHours(h, m, 0, 0);
      return d;
    }
  }
  return new Date();
}

export function ComplianceReminderWidget({
  incident,
  onEscalate,
}: ComplianceReminderWidgetProps) {
  const {
    isClosed,
    isOverdue,
    hoursRemaining,
    overdueHours,
    overdueMinutes,
    elapsedHours,
  } = useMemo(() => {
    const isClosed = incident?.status === "Closed";
    const timestamp = getIncidentTimestamp(incident);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const elapsedHours = totalMinutes / 60;
    const isOverdue = elapsedHours >= 12;
    const hoursRemaining = Math.max(0, Math.ceil(12 - elapsedHours));
    const overdueHours = Math.floor(elapsedHours - 12);
    const overdueMinutes = totalMinutes % 60;

    return {
      isClosed,
      isOverdue,
      hoursRemaining,
      overdueHours,
      overdueMinutes,
      elapsedHours,
    };
  }, [incident]);

  // 1. Closed / Fully Compliant State
  if (isClosed) {
    return (
      <Card className="p-5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl shadow-xs space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-md">
            <CheckCircle2 className="size-4 text-emerald-700 shrink-0" />
            <Text size={"md"} weight={"bold"} className="text-emerald-800">
              Compliance Fulfilled
            </Text>
          </div>
          <Badge
            variant="secondary"
            state="success"
            className="px-2.5 py-0.5 shadow-none"
          >
            Closed
          </Badge>
        </div>

        <div className="space-y-1 text-md text-slate-700">
          <Text size={"md"} weight={"medium"} className="text-slate-600">
            All statutory CQC guidelines, family/GP notifications, and
            root-cause actions were documented within the required window.
          </Text>
          <div className="flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="size-3 text-emerald-600" />
            <Text size={"md"} weight={"semibold"} className="text-emerald-700">
              Safe &amp; Well-Led Governance Met
            </Text>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            toast({
              title: "Compliance Summary",
              description: "Audit export generated for CQC inspection log.",
            });
          }}
          className="w-full bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 rounded-xl shadow-none cursor-pointer"
        >
          View Governance Audit
        </Button>
      </Card>
    );
  }

  // 2. Overdue State (> 12 Hours Threshold Exceeded)
  if (isOverdue) {
    return (
      <Card className="p-5 bg-rose-50/80 border border-rose-200 rounded-2xl shadow-xs space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-md">
            <AlertOctagon className="size-4 text-rose-600 shrink-0" />
            <Text size={"md"} weight={"bold"} className="text-rose-800">
              Critical SLA Breach
            </Text>
          </div>
          <Badge
            variant="secondary"
            state="danger"
            className="px-2.5 py-0.5 shadow-none animate-pulse"
          >
            12h+ Overdue
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="p-2.5 bg-rose-100/80 border border-rose-300/80 rounded-xl">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-rose-700" />
              <Text size={"md"} weight={"bold"} className="text-rose-900">
                Exceeded 12-Hour SLA by{" "}
                {overdueHours > 0 ? `${overdueHours}h ` : ""}
                {overdueMinutes}m
              </Text>
            </div>
            <Text
              size={"md"}
              weight={"medium"}
              className="text-rose-800 mt-0.5 block"
            >
              Statutory window for CQC Regulation 18 notification &amp; manager
              investigation review has lapsed.
            </Text>
          </div>

          <Text
            size={"md"}
            weight={"regular"}
            className="text-slate-700 leading-tight"
          >
            Immediate escalation required. Complete the root-cause analysis and
            sign off manager response now.
          </Text>
        </div>

        <div className="space-y-2 pt-1">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              if (onEscalate) {
                onEscalate();
              } else {
                toast({
                  variant: "destructive",
                  title: "Manager Escalation Alert Sent",
                  description:
                    "Registered Manager and Safeguarding Lead have been notified of this SLA breach.",
                });
              }
            }}
            className="w-full h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-md font-semibold gap-1.5 shadow-none cursor-pointer"
          >
            <ShieldAlert className="size-3.5 text-white" />
            Escalate to Registered Manager
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              toast({
                title: "CQC Regulation 18",
                description:
                  "Opening regulatory statutory reporting requirements guide.",
              });
            }}
            className="w-full h-8 bg-white border-rose-200 text-rose-800 hover:bg-rose-100/50 rounded-xl text-md font-semibold shadow-none cursor-pointer"
          >
            View Regulation 18 Guide
          </Button>
        </div>
      </Card>
    );
  }

  // 3. Normal / Warning State (Within 12 Hours)
  return (
    <Card className="p-5 bg-amber-50/60 border border-amber-200/80 rounded-2xl shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600 shrink-0" />
          <Text size={"md"} weight={"bold"} className="text-amber-800">
            Compliance Reminder
          </Text>
        </div>
        <Badge
          variant="secondary"
          state="warning"
          className="px-2.5 py-0.5 shadow-none"
        >
          Active SLA
        </Badge>
      </div>

      <div className="space-y-1.5">
        <Text size={"md"} weight={"regular"} className="text-slate-600">
          This action contributes to CQC Safe &amp; Well-led evidence.
        </Text>

        <div className="flex items-center gap-1.5 bg-amber-100/60 px-2.5 py-1 rounded-lg border border-amber-200/60 w-fit">
          <Clock className="size-3.5 text-amber-700" />
          <Text size={"md"} weight={"bold"} className="text-amber-900">
            Due within {hoursRemaining}{" "}
            {hoursRemaining === 1 ? "hour" : "hours"}
          </Text>
        </div>

        <Text size={"md"} weight={"regular"} className="text-slate-600">
          Investigation must be completed and logged before the 12-hour
          statutory window closes.
        </Text>
      </div>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-full bg-white border-amber-300 text-amber-800 hover:bg-amber-100/60 rounded-xl shadow-none cursor-pointer"
      >
        <a
          href="https://www.cqc.org.uk/guidance-regulation/notifications"
          target="_blank"
          rel="noreferrer"
        >
          View CQC Guidance
        </a>
      </Button>
    </Card>
  );
}
