"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle2, AlertCircle, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui";
import type { FindingDetailItem } from "./FindingDetailDialog";
import { SEVERITY_BADGE_STATE, FINDING_TYPE_DOT_CLASS } from "./body-map-zones";

interface ActiveFindingsCardProps {
  allFindings?: FindingDetailItem[];
  openFindings?: FindingDetailItem[];
  totalFindings?: number;
  onSelect: (finding: FindingDetailItem) => void;
}

type FindingTab = "all" | "active" | "resolved";

export function ActiveFindingsCard({
  allFindings = [],
  openFindings = [],
  totalFindings,
  onSelect,
}: ActiveFindingsCardProps) {
  const [selectedTab, setSelectedTab] = useState<FindingTab>("all");

  // Derive findings per status
  const effectiveAllFindings = useMemo(() => {
    if (allFindings && allFindings.length > 0) return allFindings;
    return openFindings;
  }, [allFindings, openFindings]);

  const activeFindings = useMemo(
    () => effectiveAllFindings.filter((f) => f.status !== "Resolved"),
    [effectiveAllFindings],
  );

  const resolvedFindings = useMemo(
    () => effectiveAllFindings.filter((f) => f.status === "Resolved"),
    [effectiveAllFindings],
  );

  const displayedFindings = useMemo(() => {
    switch (selectedTab) {
      case "active":
        return activeFindings;
      case "resolved":
        return resolvedFindings;
      case "all":
      default:
        return effectiveAllFindings;
    }
  }, [selectedTab, activeFindings, resolvedFindings, effectiveAllFindings]);

  const emptyStateConfig = useMemo(() => {
    switch (selectedTab) {
      case "active":
        return {
          icon: CheckCircle2,
          title: "No active findings recorded",
          subtitle: "All documented observations have been resolved.",
        };
      case "resolved":
        return {
          icon: CheckCircle,
          title: "No resolved findings",
          subtitle: "Resolved observations will appear here.",
        };
      case "all":
      default:
        return {
          icon: AlertCircle,
          title: "No findings recorded",
          subtitle: "Click any anatomy region to document a clinical observation.",
        };
    }
  }, [selectedTab]);

  return (
    <Card variant="surface">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle>
            <Text size="md" weight="semibold">
              Findings ({effectiveAllFindings.length})
            </Text>
          </CardTitle>
          <Text size="md" variant="muted">
            Total: {totalFindings ?? effectiveAllFindings.length}
          </Text>
        </div>

        {/* Mandatory Three Tabs: All Findings, Active Findings, Resolved Findings */}
        <Tabs
          value={selectedTab}
          onValueChange={(val) => setSelectedTab(val as FindingTab)}
          className="w-full"
        >
          <TabsList className="bg-slate-100 border border-slate-200/80 p-1 rounded-xl h-auto grid grid-cols-3 gap-1 w-full">
            <TabsTrigger
              value="all"
              className="flex items-center justify-center px-2 py-1.5 gap-1.5 rounded-lg transition-all text-md font-semibold cursor-pointer border-0 data-[state=active]:border-0 data-[state=active]:border-b-0 text-slate-600 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs data-[state=active]:font-bold"
            >
              <span>All Findings</span>
              <span className="text-md font-bold px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
                {effectiveAllFindings.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex items-center justify-center px-2 py-1.5 gap-1.5 rounded-lg transition-all text-md font-semibold cursor-pointer border-0 data-[state=active]:border-0 data-[state=active]:border-b-0 text-slate-600 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs data-[state=active]:font-bold"
            >
              <span>Active Findings</span>
              <span className="text-md font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                {activeFindings.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="resolved"
              className="flex items-center justify-center px-2 py-1.5 gap-1.5 rounded-lg transition-all text-md font-semibold cursor-pointer border-0 data-[state=active]:border-0 data-[state=active]:border-b-0 text-slate-600 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs data-[state=active]:font-bold"
            >
              <span>Resolved Findings</span>
              <span className="text-md font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                {resolvedFindings.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        {displayedFindings.length === 0 ? (
          <div className="text-center py-6">
            <emptyStateConfig.icon className="size-7 text-slate-300 mx-auto mb-1.5" />
            <Text size="md" weight="medium" variant="subdued">
              {emptyStateConfig.title}
            </Text>
            <Text size="md" variant="muted" className="mt-0.5">
              {emptyStateConfig.subtitle}
            </Text>
          </div>
        ) : (
          <div className="space-y-2 max-h-65 overflow-y-auto pr-1">
            {displayedFindings.map((finding) => {
              const isResolved = finding.status === "Resolved";
              return (
                <button
                  key={finding.id}
                  type="button"
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border-secondary/60 hover:border-primary hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  onClick={() => onSelect(finding)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-block size-2 rounded-full shrink-0 ${FINDING_TYPE_DOT_CLASS[finding.findingType] ?? "bg-purple-500"}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" state="inactive" className="font-mono">
                          {finding.trackingId}
                        </Badge>
                        <Text size="md" weight="semibold">
                          {finding.findingType}
                        </Text>
                        {isResolved ? (
                          <Badge variant="secondary" state="success" className="text-md py-0 px-1.5">
                            Resolved
                          </Badge>
                        ) : selectedTab === "all" ? (
                          <Badge variant="secondary" state="inactive" className="text-md py-0 px-1.5">
                            Active
                          </Badge>
                        ) : null}
                      </div>
                      <Text size="md" variant="subdued" className="mt-0.5 truncate">
                        {finding.locationLabel}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Badge
                      variant="secondary"
                      state={SEVERITY_BADGE_STATE[finding.severity] ?? "inactive"}
                    >
                      {finding.severity}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
