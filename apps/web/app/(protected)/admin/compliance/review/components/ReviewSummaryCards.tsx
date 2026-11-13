"use client";

import React from "react";
import { AlertTriangle, Heart, Award, Pill } from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui/SummaryCard";
import type { ComplianceReviewSummaryDTO } from "@repo/schema";

interface ReviewSummaryCardsProps {
  summary: ComplianceReviewSummaryDTO;
  activeCategory: string;
  onSelectCategory: (category: "all" | "support-plan" | "staff-certification" | "medication") => void;
}

export function ReviewSummaryCards({
  summary,
  activeCategory,
  onSelectCategory,
}: ReviewSummaryCardsProps): React.JSX.Element {
  const cards: SummaryCardItem[] = [
    {
      title: "Total Reviews Due",
      value: summary.totalDue,
      subtitle: `${summary.criticalCount} critical (< 7 days)`,
      subtitleColor: summary.criticalCount > 0 ? "text-rose-600 font-semibold" : "text-slate-500",
      icon: <AlertTriangle className="size-5" />,
      iconClassName: "bg-slate-100 text-[#4a706a]",
    },
    {
      title: "Support Plans",
      value: summary.supportPlansDue,
      subtitle: "Care reviews & validity",
      icon: <Heart className="size-5" />,
      iconClassName:
        activeCategory === "support-plan"
          ? "bg-[#4a706a] text-white"
          : "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Staff Certifications",
      value: summary.staffCertsDue,
      subtitle: "Mandatory training courses",
      icon: <Award className="size-5" />,
      iconClassName:
        activeCategory === "staff-certification"
          ? "bg-[#4a706a] text-white"
          : "bg-purple-50 text-purple-700",
    },
    {
      title: "Medications",
      value: summary.medicationsDue,
      subtitle: "Prescription end dates",
      icon: <Pill className="size-5" />,
      iconClassName:
        activeCategory === "medication"
          ? "bg-[#4a706a] text-white"
          : "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="gap-4"
    />
  );
}
