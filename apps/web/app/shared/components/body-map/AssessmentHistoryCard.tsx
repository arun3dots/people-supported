"use client";

import { Clock, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
  Badge,
} from "@repo/ui/components/ui";
import type { FindingDetailItem } from "./FindingDetailDialog";

interface AssessmentHistoryItem {
  id: string;
  assessedAt: string;
  findings: FindingDetailItem[];
}

interface AssessmentHistoryCardProps {
  assessments: AssessmentHistoryItem[];
  isLoading: boolean;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onFindingSelect?: (finding: FindingDetailItem) => void;
}

export function AssessmentHistoryCard({
  assessments,
  isLoading,
  expandedId,
  onToggle,
  onFindingSelect,
}: AssessmentHistoryCardProps) {
  return (
    <Card variant="surface">
      <CardHeader className="pb-3 border-b border-border-secondary/40">
        <CardTitle className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-slate-500" />
          <Text size="sm" weight="semibold">
            Assessment History ({assessments.length})
          </Text>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-4 animate-spin text-slate-400" />
          </div>
        ) : assessments.length === 0 ? (
          <Text
            size="sm"
            variant="muted"
            className="italic py-3 text-center block"
          >
            No historical assessments recorded.
          </Text>
        ) : (
          <div className="space-y-1.5 max-h-55 overflow-y-auto pr-1">
            {assessments.map((a) => {
              const isExpanded = expandedId === a.id;
              return (
                <div
                  key={a.id}
                  className="border border-border-secondary/60 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                    onClick={() => onToggle(a.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Text size="sm" weight="semibold">
                        {format(new Date(a.assessedAt), "dd MMM yyyy, HH:mm")}
                      </Text>
                      <Text size="sm" variant="muted">
                        {a.findings.length} finding
                        {a.findings.length !== 1 ? "s" : ""}
                      </Text>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="size-3 text-slate-400" />
                    ) : (
                      <ChevronRight className="size-3 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border-secondary/40 p-2 space-y-1 bg-slate-50/50">
                      {a.findings.map((f) => (
                        <button
                          type="button"
                          key={f.id}
                          onClick={() => onFindingSelect?.(f)}
                          className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border border-border-secondary/40 cursor-pointer hover:bg-amber-50"
                        >
                          <Text size="sm" className="font-mono">
                            {f.trackingId}: {f.findingType} on {f.locationLabel}
                          </Text>
                          <Badge
                            variant={
                              f.status === "Open" ? "destructive" : "secondary"
                            }
                            state={
                              f.status === "Resolved" ? "success" : undefined
                            }
                            className="text-secondary-400"
                          >
                            {f.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
