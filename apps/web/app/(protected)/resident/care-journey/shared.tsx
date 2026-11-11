"use client";

import type { AssessmentRating } from "@repo/schema";
import { Badge } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

const RATING_STATE = {
  high: "danger",
  med: "warning",
  low: "success",
  none: "inactive",
} as const;

export function RatingPill({
  rating,
  children,
  className,
}: {
  rating: AssessmentRating;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      state={RATING_STATE[rating]}
      className={cn("px-2.5 py-0.5 text-sm", className)}
    >
      {children}
    </Badge>
  );
}

export const SUPPORT_LEVEL_LABELS = {
  I: "Independent",
  P: "Prompting",
  "1": "Assistance of one",
  "2": "Assistance of two",
  F: "Fully dependent",
} as const;

export const SUPPORT_LEVEL_HELP =
  "Support level: I independent · P prompting · 1 assistance of one · 2 assistance of two · F fully dependent.";

export const todayIso = (): string => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};
