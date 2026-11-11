// Frontend mirror of @repo/schema's score helpers — colocated so components
// can import without a roundtrip through the schema package.
//
// Source of truth: packages/schema/src/risk.ts (calculateRiskScore /
// riskLevelFromScore). Keep behaviour identical.

import type { RiskLevel, RiskStatus } from "@repo/schema";

export function getRiskLevelStyle(level?: string | null): {
  badge: string;
  text: string;
  bg: string;
} {
  const normalized = (level || "").toLowerCase();
  switch (normalized) {
    case "extreme":
      return {
        badge: "bg-red-700 text-white",
        text: "text-red-700",
        bg: "bg-red-100",
      };
    case "high":
      return {
        badge: "bg-red-500 text-white",
        text: "text-red-600",
        bg: "bg-red-50",
      };
    case "moderate":
    case "medium":
      return {
        badge: "bg-orange-500 text-white",
        text: "text-orange-600",
        bg: "bg-orange-50",
      };
    case "low":
    default:
      return {
        badge: "bg-emerald-500 text-white",
        text: "text-emerald-600",
        bg: "bg-emerald-50",
      };
  }
}

export function getStatusStyle(status?: string | null): {
  label: string;
  className: string;
} {
  const normalized = (status || "").toLowerCase().replace(/[\s_-]/g, "");
  switch (normalized) {
    case "pendingreview":
    case "pending":
    case "underreview":
      return {
        label: "Pending Review",
        className: "bg-amber-100 text-amber-800",
      };
    case "active":
    case "approved":
    case "completed":
    case "verified":
      return { label: "Verified", className: "bg-emerald-100 text-emerald-800" };
    case "archived":
    case "closed":
      return { label: "Archived", className: "bg-slate-100 text-slate-500" };
    case "draft":
    default:
      return { label: status || "Draft", className: "bg-slate-200 text-slate-700" };
  }
}

export function formatReviewFrequency(value: string): string {
  switch (value) {
    case "SixMonthly":
      return "Every 6 months";
    case "AfterIncident":
      return "After incident";
    default:
      return value;
  }
}
