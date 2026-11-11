import type { RiskListFilters } from "@repo/schema";

export const riskKeys = {
  all: ["risk"] as const,
  assessments: (filters?: RiskListFilters) =>
    filters
      ? (["risk", "assessments", filters] as const)
      : (["risk", "assessments"] as const),
  assessment: (id: string) => ["risk", "assessment", id] as const,
  templates: () => ["risk", "templates"] as const,
  alertsUnread: () => ["risk", "alerts", "unread"] as const,
  overview: () => ["risk", "overview"] as const,
};
