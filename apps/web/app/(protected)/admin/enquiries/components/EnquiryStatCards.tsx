"use client";

import React from "react";
import { Users, Clock, UserCheck, CheckCircle2 } from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui";

interface EnquiryStatCardsProps {
  totalEnquiries: number;
  pendingAssessments: number;
  readyForAdmission: number;
  admittedCount: number;
}

export function EnquiryStatCards({
  totalEnquiries,
  pendingAssessments,
  readyForAdmission,
  admittedCount,
}: EnquiryStatCardsProps) {
  const pendingPercent =
    totalEnquiries > 0
      ? ((pendingAssessments / totalEnquiries) * 100).toFixed(0)
      : "0";
  const conversionPercent =
    totalEnquiries > 0
      ? ((admittedCount / totalEnquiries) * 100).toFixed(0)
      : "0";

  const cards: SummaryCardItem[] = [
    {
      title: "Total Enquiries",
      value: totalEnquiries,
      subtitle: "All registered leads",
      subtitleColor: "text-text-success",
      icon: <Users className="size-5 text-emerald-800" />,
    },
    {
      title: "Assessment Pending",
      value: pendingAssessments,
      subtitle: `${pendingPercent}% of total`,
      subtitleColor: "text-text-body",
      icon: <Clock className="size-5 text-amber-700" />,
    },
    {
      title: "Ready for Admission",
      value: readyForAdmission,
      subtitle: "Assessment passed",
      subtitleColor: "text-text-success",
      icon: <UserCheck className="size-5 text-blue-700" />,
    },
    {
      title: "Admitted / Converted",
      value: admittedCount,
      subtitle: `${conversionPercent}% conversion`,
      subtitleColor: "text-text-success",
      icon: <CheckCircle2 className="size-5 text-emerald-800" />,
    },
  ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
    />
  );
}
