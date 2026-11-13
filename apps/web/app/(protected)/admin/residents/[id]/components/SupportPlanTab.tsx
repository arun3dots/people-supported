"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileDown,
  Plus,
  RefreshCw,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { Badge, Button, Card, Text } from "@repo/ui/components/ui";
import type {
  SupportedLivingDetailsDTO,
  SupportedLivingDomainItemDTO,
  SupportedLivingOutcomeDTO,
} from "@repo/schema";
import type { Resident } from "../../../../../../lib/types/resident";
import { ResidentRecordCarePlans } from "./record";
import { AddSupportOutcomeModal, EditSupportDomainModal } from "./SupportPlanModals";
import { SupportPlanDomainCard } from "./SupportPlanDomainCard";

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
  const reviewBadgeState =
    reviewStatus === "Overdue"
      ? "danger"
      : reviewStatus === "Due soon"
        ? "warning"
        : "success";

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
      <Card
        variant="secondary"
        border="secondary"
        className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
            <ClipboardCheck className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Text as="h2" size="lg" weight="semibold" className="text-slate-900">
                Person-centred Support Plan v3.2
              </Text>
              <Badge variant="secondary" state={reviewBadgeState} className="border">
                {reviewStatus}
              </Badge>
            </div>
            <Text size="md" variant="muted">
              Approved by Ben Cannon (Registered Manager) on 21/10/2026 · Co-produced with{" "}
              <Text as="span" size="md" weight="medium" className="text-slate-800">
                {fullName}
              </Text>
            </Text>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
              <Text size="md" className="inline-flex items-center gap-1.5 text-slate-700">
                <Calendar className="size-3.5 text-slate-500" />
                Next review {nextReview}
              </Text>
              <Text size="md" className="inline-flex items-center gap-1.5 text-slate-700">
                <Users className="size-3.5 text-slate-500" />
                {supportHours} hrs/wk ({oneToOne}h 1:1)
              </Text>
              <Text size="md" className="inline-flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="size-3.5 text-slate-500" />
                {riskLevel} overall risk
              </Text>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => typeof window !== "undefined" && window.print()}
            className="bg-white h-10 px-4 inline-flex items-center gap-2"
          >
            <FileDown className="size-4" />
            Export PDF
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              onClick={handleOpenNewDomain}
              className="h-10 px-4 inline-flex items-center gap-2"
            >
              <RefreshCw className="size-3.5" />
              Start review
            </Button>
          )}
        </div>
      </Card>

      {/* Main 2-Column Layout: Left = Expandable Domains, Right = Outcomes Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-3">
          {domains.map((dom) => (
            <SupportPlanDomainCard
              key={dom.id}
              domain={dom}
              isExpanded={expandedId === dom.id}
              canEdit={canEdit}
              onToggle={() => setExpandedId(expandedId === dom.id ? null : dom.id)}
              onEdit={(e) => handleOpenEditDomain(dom, e)}
            />
          ))}
        </div>

        {/* Right Column: Outcomes Progress Card */}
        <Card variant="surface" className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <Text as="h3" size="md" weight="semibold" className="text-slate-900">
              Outcomes Progress
            </Text>
          </div>

          <div className="space-y-4">
            {goals.map((goal) => {
              const isFocus = goal.status === "Needs focus" || goal.progress < 40;
              const barColor = isFocus ? "bg-amber-600" : "bg-emerald-800";

              return (
                <Card key={goal.id} variant="white" border="secondary" className="p-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <Text size="md" weight="medium" className="text-slate-800 leading-snug">
                      {goal.title}
                    </Text>
                    <Badge
                      variant="secondary"
                      state={isFocus ? "warning" : "success"}
                      className="border shrink-0"
                    >
                      {goal.status}
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
                    />
                  </div>
                  <Text size="md" variant="muted">
                    {goal.progress}% towards outcome
                  </Text>
                </Card>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setOutcomeModalOpen(true)}
            className="w-full h-10 bg-white inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="size-4" />
            Add outcome
          </Button>
        </Card>
      </div>

      {/* Collapsible Clinical Care Plans Section */}
      <Card variant="surface" className="overflow-hidden">
        <button
          type="button"
          onClick={() => setShowClinicalCarePlans((prev) => !prev)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors cursor-pointer"
        >
          <div>
            <Text as="h3" size="md" weight="semibold" className="text-slate-800">
              Clinical Care Plan Modules & Reviews
            </Text>
            <Text size="md" variant="muted">
              Expand to manage detailed clinical care plan records, versions, and evaluations
            </Text>
          </div>
          {showClinicalCarePlans ? (
            <ChevronUp className="size-4 text-slate-500" />
          ) : (
            <ChevronDown className="size-4 text-slate-500" />
          )}
        </button>
        {showClinicalCarePlans && (
          <div className="p-6 border-t border-slate-200/70">
            <ResidentRecordCarePlans residentId={resident.id} />
          </div>
        )}
      </Card>

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
