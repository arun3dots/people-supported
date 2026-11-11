"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileDown,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";
import type {
  SupportedLivingDetailsDTO,
  SupportedLivingDomainItemDTO,
  SupportedLivingOutcomeDTO,
} from "@repo/schema";
import type { Resident } from "../../../../../../lib/types/resident";
import { ResidentRecordCarePlans } from "./record";
import { AddSupportOutcomeModal, EditSupportDomainModal } from "./SupportPlanModals";

const DEFAULT_DOMAINS: SupportedLivingDomainItemDTO[] = [
  {
    id: "dom-1",
    domain: "Daily living skills",
    outcomeSummary: "Prepare meals independently",
    updatedAt: "14/10/2026",
    whatINeed:
      "Step-by-step recipe cards and supervision around the hob when preparing hot evening meals.",
    howToSupportMe:
      "Prompt me to check ingredients first, stand alongside during cooking, and praise independence.",
    staffing: "1:1 support worker, 45m daily",
  },
  {
    id: "dom-2",
    domain: "Health & medication",
    outcomeSummary: "Stays well and attends all health appointments",
    updatedAt: "02/09/2026",
    whatINeed:
      "Prompting with morning and evening medication and accompaniment to GP and annual health checks.",
    howToSupportMe:
      "Use visual calendar reminders 24 hours before appointments and sign MAR chart immediately.",
    staffing: "Core team, twice daily",
  },
  {
    id: "dom-3",
    domain: "Community & relationships",
    outcomeSummary: "Use public transport",
    updatedAt: "21/10/2026",
    whatINeed:
      "Confidence travelling on the local bus route to town and maintaining weekly contact with family.",
    howToSupportMe:
      "Travel together on the bus route, gradually stepping back as confidence increases.",
    staffing: "1:1 support worker, 3h weekly",
  },
  {
    id: "dom-4",
    domain: "Emotional wellbeing & behaviour",
    outcomeSummary: "Fewer episodes of distress; feels safe at home",
    updatedAt: "21/10/2026",
    whatINeed:
      "Predictable daily routine, advance notice of changes, and a calm environment.",
    howToSupportMe:
      "Use clear, short sentences and visual timetable help. Offer quiet space if overwhelmed.",
    staffing: "Core team, ongoing",
  },
  {
    id: "dom-5",
    domain: "Finances & tenancy",
    outcomeSummary: "Pays bills on time and saves towards a holiday",
    updatedAt: "30/09/2026",
    whatINeed:
      "Support to budget weekly money and understand tenancy responsibilities.",
    howToSupportMe:
      "Weekly budgeting session with receipts kept in finance folder. Two-person check of cash balances.",
    staffing: "Key worker, 1h weekly",
  },
];

const DEFAULT_GOALS: SupportedLivingOutcomeDTO[] = [
  { id: "g-1", title: "Prepare meals independently", progress: 70, status: "On track" },
  { id: "g-2", title: "Use public transport", progress: 45, status: "On track" },
  {
    id: "g-3",
    title: "Build confidence in community activities",
    progress: 30,
    status: "Needs focus",
  },
];

interface SupportPlanTabProps {
  resident: Resident;
  canEdit?: boolean;
}

export function SupportPlanTab({
  resident,
  canEdit = false,
}: SupportPlanTabProps): React.JSX.Element {
  const sl: SupportedLivingDetailsDTO = useMemo(
    () => (resident.supportedLivingDetails as SupportedLivingDetailsDTO | undefined) ?? {},
    [resident.supportedLivingDetails],
  );

  const domains: SupportedLivingDomainItemDTO[] = useMemo(
    () =>
      sl.supportPlanDomains && sl.supportPlanDomains.length > 0
        ? sl.supportPlanDomains
        : DEFAULT_DOMAINS,
    [sl.supportPlanDomains],
  );

  const goals: SupportedLivingOutcomeDTO[] = useMemo(
    () => (sl.outcomes && sl.outcomes.length > 0 ? sl.outcomes : DEFAULT_GOALS),
    [sl.outcomes],
  );

  const [expandedId, setExpandedId] = useState<string | null>(
    domains[domains.length - 1]?.id ?? "dom-5",
  );
  const [editingDomain, setEditingDomain] = useState<SupportedLivingDomainItemDTO | null>(
    null,
  );
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [showClinicalCarePlans, setShowClinicalCarePlans] = useState(false);

  const fullName = resident.fullName || "Person Supported";
  const nextReview = sl.supportPlanHeader?.nextReviewDate ?? "18/02/2027";
  const supportHours = sl.supportHoursPerWeek ?? 28;
  const oneToOne = sl.oneToOneHoursPerWeek ?? 6;
  const riskLevel = sl.riskLevel ?? "Medium";
  const reviewStatus = sl.supportPlanHeader?.status ?? "In date";

  const handleOpenNewDomain = () => {
    setEditingDomain(null);
    setDomainModalOpen(true);
  };

  const handleOpenEditDomain = (
    domain: SupportedLivingDomainItemDTO,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditingDomain(domain);
    setDomainModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Support Plan Summary Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <ClipboardCheck className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">
                Person-centred Support Plan v3.2
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {reviewStatus}
              </span>
            </div>
            <p className="text-md text-slate-600">
              Approved by Ben Cannon (Registered Manager) on 21/10/2026 · Co-produced with{" "}
              <span className="font-semibold text-slate-800">{fullName}</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-md font-medium text-slate-700 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-500" />
                Next review {nextReview}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5 text-slate-500" />
                {supportHours} hrs/wk ({oneToOne}h 1:1)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-slate-500" />
                {riskLevel} overall risk
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => typeof window !== "undefined" && window.print()}
            className="bg-white border-slate-200 text-slate-700 font-semibold text-md rounded-xl h-10 px-4 inline-flex items-center gap-2 cursor-pointer"
          >
            <FileDown className="size-4" />
            Export PDF
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              onClick={handleOpenNewDomain}
              className="font-semibold text-md rounded-xl h-10 px-4 inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              Start review
            </Button>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout: Left = Expandable Domains, Right = Outcomes Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-3">
          {domains.map((dom) => {
            const isExpanded = expandedId === dom.id;
            return (
              <div
                key={dom.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : dom.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : dom.id);
                    }
                  }}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base font-bold text-slate-900">{dom.domain}</h3>
                    <p className="text-md text-slate-500 truncate">
                      Outcome: {dom.outcomeSummary ?? "Maintain independence"} · Updated{" "}
                      {dom.updatedAt ?? "21/10/2026"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleOpenEditDomain(dom, e)}
                        className="h-8 px-2.5 text-md text-slate-600 hover:text-slate-900"
                      >
                        <Pencil className="size-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="size-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="bg-slate-50/90 border border-slate-200/60 rounded-xl p-4 space-y-1.5">
                      <span className="text-md font-bold uppercase tracking-wider text-slate-500">
                        WHAT I NEED
                      </span>
                      <p className="text-md text-slate-800 leading-relaxed font-medium">
                        {dom.whatINeed ?? "Consistent daily support tailored to preferences."}
                      </p>
                    </div>
                    <div className="bg-slate-50/90 border border-slate-200/60 rounded-xl p-4 space-y-1.5">
                      <span className="text-md font-bold uppercase tracking-wider text-slate-500">
                        HOW TO SUPPORT ME
                      </span>
                      <p className="text-md text-slate-800 leading-relaxed font-medium">
                        {dom.howToSupportMe ??
                          "Follow person-centred guidance and encourage independence."}
                      </p>
                    </div>
                    <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4 space-y-1.5">
                      <span className="text-md font-bold uppercase tracking-wider text-emerald-800">
                        STAFFING
                      </span>
                      <p className="text-md text-slate-900 leading-relaxed font-bold">
                        {dom.staffing ?? "Key worker, 1h weekly"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Outcomes Progress Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <h3 className="text-base font-bold text-slate-900">Outcomes Progress</h3>
          </div>

          <div className="space-y-4">
            {goals.map((goal) => {
              const isFocus = goal.status === "Needs focus" || goal.progress < 40;
              const badgeCls = isFocus
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200";
              const barColor = isFocus ? "bg-amber-600" : "bg-emerald-800";

              return (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-md font-bold text-slate-800 leading-snug">
                      {goal.title}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-md font-semibold border shrink-0 ${badgeCls}`}
                    >
                      {goal.status}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
                    />
                  </div>
                  <Text size="md" className="text-slate-500">
                    {goal.progress}% towards outcome
                  </Text>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setOutcomeModalOpen(true)}
            className="w-full h-10 rounded-xl border-slate-200 text-slate-800 font-semibold text-md inline-flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50"
          >
            <Plus className="size-4" />
            Add outcome
          </Button>
        </div>
      </div>

      {/* Collapsible Clinical Care Plans Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowClinicalCarePlans((prev) => !prev)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Clinical Care Plan Modules & Reviews
            </h3>
            <p className="text-md text-slate-500">
              Expand to manage detailed clinical care plan records, versions, and evaluations
            </p>
          </div>
          {showClinicalCarePlans ? (
            <ChevronUp className="size-4 text-slate-500" />
          ) : (
            <ChevronDown className="size-4 text-slate-500" />
          )}
        </button>
        {showClinicalCarePlans && (
          <div className="p-6 border-t border-slate-100">
            <ResidentRecordCarePlans residentId={resident.id} />
          </div>
        )}
      </div>

      <EditSupportDomainModal
        open={domainModalOpen}
        onOpenChange={setDomainModalOpen}
        residentId={resident.id}
        currentDetails={sl}
        initialDomain={editingDomain}
        allDomains={domains}
      />

      <AddSupportOutcomeModal
        open={outcomeModalOpen}
        onOpenChange={setOutcomeModalOpen}
        residentId={resident.id}
        currentDetails={sl}
        allGoals={goals}
      />
    </div>
  );
}
