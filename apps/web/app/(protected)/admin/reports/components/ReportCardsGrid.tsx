"use client";

import React from "react";
import {
  ShieldCheck,
  Users,
  Pill,
  ClipboardList,
  CalendarCheck,
  Receipt,
  AlertTriangle,
  Download,
  FileText,
} from "lucide-react";
import { Card, Text, Badge, Button } from "@repo/ui/components/ui";

export interface ReportDefinition {
  id: string;
  title: string;
  category:
  | "Compliance & CQC"
  | "Clinical & Care"
  | "Finance & Billing"
  | "Staffing & HR"
  | "Operations";
  description: string;
  frequency: string;
  formats: ("CSV")[];
  detailHref: string;
  icon: React.ElementType;
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "cqc-compliance",
    title: "CQC Quality & Compliance Pack (RM-01)",
    category: "Compliance & CQC",
    description:
      "Combined statutory evidence log across incidents, safeguarding referrals, and complaints.",
    frequency: "Monthly / On-Demand",
    formats: ["CSV"],
    detailHref: "/admin/incidents",
    icon: ShieldCheck,
  },
  {
    id: "resident-occupancy",
    title: "Occupancy & Admissions Ledger (RM-13)",
    category: "Operations",
    description:
      "Property, room and bed utilisation, void status, resident admissions, and funding splits.",
    frequency: "Weekly / On-Demand",
    formats: ["CSV"],
    detailHref: "/admin/configuration/facility/properties",
    icon: Users,
  },
  {
    id: "medication-mar",
    title: "eMAR Medication & Drug Rounds (NU-01)",
    category: "Clinical & Care",
    description:
      "Medication round schedules, administration status, omitted doses, and PRN records.",
    frequency: "Daily / On-Demand",
    formats: ["CSV"],
    detailHref: "/admin/residents",
    icon: Pill,
  },
  {
    id: "care-plan-reviews",
    title: "Care Plan & Risk Review Matrix (RM-06)",
    category: "Clinical & Care",
    description:
      "Active care plan versions, review schedules, overdue reviews, and consent basis.",
    frequency: "Monthly / On-Demand",
    formats: ["CSV"],
    detailHref: "/admin/care-plans",
    icon: ClipboardList,
  },
  {
    id: "staff-rota-attendance",
    title: "Staff Rota, Hours & Agency Report (RM-07)",
    category: "Staffing & HR",
    description:
      "Scheduled shifts, care types, property allocations, durations, and assigned staff.",
    frequency: "Weekly / On-Demand",
    formats: ["CSV"],
    detailHref: "/admin/staff/rota",
    icon: CalendarCheck,
  },
  {
    id: "finance-invoicing",
    title: "Invoicing & Revenue Settlement (AD-03)",
    category: "Finance & Billing",
    description:
      "Resident fee invoices, issued/due dates, payment status, and settlement tracking.",
    frequency: "Monthly / On-Demand",
    formats: ["CSV"],
    detailHref: "/admin/finance/invoices",
    icon: Receipt,
  },
  {
    id: "resident-clinical-risk",
    title: "Resident Clinical Risk Summary (NU-11)",
    category: "Clinical & Care",
    description:
      "Room allocations, NEWS2 score, falls risk, nutrition MUST, Waterlow, and active clinical alerts.",
    frequency: "Weekly / On-Demand",
    formats: ["CSV"],
    detailHref: "/admin/residents",
    icon: ClipboardList,
  },
  {
    id: "incidents-safeguarding",
    title: "Incident & Accident Log (RM-02)",
    category: "Compliance & CQC",
    description:
      "Falls analysis, injury severity, CQC statutory notifications, and root-cause actions.",
    frequency: "Monthly / On-Demand",
    formats: ["CSV"],
    detailHref: "/admin/incidents",
    icon: AlertTriangle,
  },
  {
    id: "clinical-escalations",
    title: "Clinical Escalations & Falls Log (NU-07)",
    category: "Compliance & CQC",
    description:
      "Acute deterioration, 999 ambulance transfers, SBAR triage notes, and post-fall reviews.",
    frequency: "Daily / On-Demand",
    formats: ["CSV"],
    detailHref: "/admin/escalations",
    icon: ShieldCheck,
  },
];

interface ReportCardsGridProps {
  reports: ReportDefinition[];
  onGenerateReport: (
    report: ReportDefinition,
    format: "PDF" | "Excel" | "CSV"
  ) => void;
}

export function ReportCardsGrid({
  reports,
  onGenerateReport,
}: ReportCardsGridProps) {
  if (reports.length === 0) {
    return (
      <div className="bg-surface-card-grey rounded-2xl p-12 text-center shadow-none border-none font-sans">
        <FileText className="size-10 text-slate-300 mx-auto mb-2" />
        <Text size="md" weight="medium" className="text-slate-600">
          No reports match your filters
        </Text>
        <Text
          size="md"
          weight="regular"
          className="text-slate-400 mt-1 max-w-sm mx-auto"
        >
          Try clearing search keywords or selecting all categories.
        </Text>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 font-sans">
      {reports.map((report) => {
        const Icon = report.icon;
        return (
          <Card
            key={report.id}
            variant="surface"
            className="p-5 flex flex-col justify-between gap-4 shadow-none bg-surface-card-grey border-none rounded-2xl hover:shadow-xs transition-shadow"
          >
            <div className="space-y-3">
              {/* Header with Icon and Badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-full bg-surface-primary-light text-icon-primary border border-emerald-100/60 flex items-center justify-center font-bold text-md shrink-0">
                    <Icon className="size-5 text-icon-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <Text
                      size="md"
                      weight="bold"
                      className="text-slate-900 leading-tight truncate"
                    >
                      {report.title}
                    </Text>
                    <Text
                      size="md"
                      weight="regular"
                      className="text-slate-500 mt-0.5"
                    >
                      {report.frequency}
                    </Text>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  state="info"
                  className="px-2.5 py-0.5 text-md shrink-0 shadow-none"
                >
                  {report.category}
                </Badge>
              </div>

              {/* Description */}
              <Text
                size="md"
                weight="regular"
                className="text-slate-600 leading-relaxed line-clamp-2"
              >
                {report.description}
              </Text>
            </div>

            {/* Footer with Formats & Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {report.formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="text-md font-mono font-medium px-2 py-0.5 rounded bg-white border border-slate-200/80 text-slate-700"
                  >
                    {fmt}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => onGenerateReport(report, "CSV")}
                  className="rounded-xl h-9 px-3 text-md font-semibold gap-1.5 shadow-none border-slate-200 bg-white hover:bg-slate-50"
                >
                  <Download className="size-3.5" />
                  Generate
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
