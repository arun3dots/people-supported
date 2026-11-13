"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Badge,
  Button,
  Text,
} from "@repo/ui/components/ui";
import {
  History,
  GitBranch,
  Eye,
  Clock,
} from "lucide-react";
import { CarePlanDiffViewer } from "./CarePlanDiffViewer";
import { useGetCarePlanDiffQuery } from "../../../../lib/queries/care-plan";
import { CarePlanDiffResponseDTO } from "@repo/schema";

export interface CarePlanVersionItem {
  id: string;
  versionNumber: number;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  validFrom?: string | Date;
  validTo?: string | Date | null;
  renewalReason?: string | null;
  primaryDoctor?: { fullName?: string };
}

interface CarePlanHistoryViewProps {
  versions: CarePlanVersionItem[];
  currentPlanId: string;
  onSelectVersion: (versionId: string) => void;
  onViewPlanDetail?: (versionId: string) => void;
  residentName?: string;
  isLoading?: boolean;
}

export function CarePlanHistoryView({
  versions = [],
  currentPlanId,
  onSelectVersion,
  onViewPlanDetail,
  residentName,
  isLoading = false,
}: CarePlanHistoryViewProps) {
  const [comparingPlanId, setComparingPlanId] = useState<string | null>(null);
  const { data: diffData, isLoading: isDiffLoading } = useGetCarePlanDiffQuery(
    comparingPlanId || ""
  );

  const getStatusBadge = (st: string) => {
    const s = (st || "").toLowerCase();
    if (s === "active") {
      return (
        <Badge variant="secondary" state="success" className="text-md font-semibold px-2.5 py-0.5 shadow-none">
          Active
        </Badge>
      );
    }
    if (s.includes("pending") || s.includes("review")) {
      return (
        <Badge variant="secondary" state="warning" className="text-md font-semibold px-2.5 py-0.5 shadow-none">
          Under Review
        </Badge>
      );
    }
    if (s.includes("change") || s.includes("returned")) {
      return (
        <Badge variant="secondary" state="warning" className="text-md font-semibold px-2.5 py-0.5 shadow-none">
          Changes Requested
        </Badge>
      );
    }
    if (s === "superseded") {
      return (
        <Badge variant="secondary" state="inactive" className="text-md font-medium px-2.5 py-0.5 shadow-none">
          Superseded
        </Badge>
      );
    }
    if (s === "expired") {
      return (
        <Badge variant="secondary" state="danger" className="text-md font-medium px-2.5 py-0.5 shadow-none">
          Expired
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" state="inactive" className="text-md font-medium px-2.5 py-0.5 shadow-none">
        Draft
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/90 font-sans">
        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <Text size="md" variant="muted">Loading care plan version history...</Text>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 font-sans space-y-2">
        <History className="size-8 text-slate-300 mx-auto" />
        <Text size="md" weight="semibold" className="text-slate-800">
          No Version History Available
        </Text>
        <Text size="md" variant="muted" className="max-w-md mx-auto">
          This resident is currently on their initial care plan version. Subsequent reviews, approvals, and annual renewals will be versioned here.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div>
          <Text as="h3" size="md" weight="bold" className="text-slate-900 flex items-center gap-2">
            <History className="size-4 text-primary" /> Care Plan Version History
          </Text>
          <Text size="md" variant="muted" className="mt-0.5">
            Audit-tracked revisions for {residentName || "this resident"}. Click any version to inspect or compare changes.
          </Text>
        </div>
        <Badge variant="secondary" state="info" className="self-start sm:self-auto text-md px-2.5 py-1">
          {versions.length} Version{versions.length > 1 ? "s" : ""} Recorded
        </Badge>
      </div>

      <div className="space-y-3">
        {versions.map((ver, idx) => {
          const isCurrent = ver.id === currentPlanId;
          const vNum = `v${String(ver.versionNumber || versions.length - idx).padStart(4, "0")}`;
          const dateLabel = ver.createdAt || ver.validFrom
            ? format(new Date(ver.createdAt || ver.validFrom || Date.now()), "dd MMM yyyy HH:mm")
            : "—";

          return (
            <div
              key={ver.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCurrent
                  ? "bg-primary/5 border-primary shadow-xs"
                  : "bg-white border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <GitBranch className="size-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-md">
                      {`CP-${String(ver.versionNumber || versions.length - idx).padStart(4, "0")}`}
                    </span>
                    <span className="font-mono text-md font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {vNum}
                    </span>
                    {getStatusBadge(ver.status)}
                    {isCurrent && (
                      <span className="text-md font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Viewing Now
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-md text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-slate-400" />
                      Created {dateLabel}
                    </span>
                    {ver.renewalReason && (
                      <span className="flex items-center gap-1 text-slate-600">
                        · Reason: <span className="font-medium">{ver.renewalReason}</span>
                      </span>
                    )}
                    {ver.primaryDoctor?.fullName && (
                      <span className="flex items-center gap-1 text-slate-600">
                        · Lead: <span className="font-medium">{ver.primaryDoctor.fullName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setComparingPlanId(ver.id)}
                  className="h-8 px-3 text-md font-medium rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Compare Changes
                </Button>

                {!isCurrent && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => onSelectVersion(ver.id)}
                    className="h-8 px-3.5 text-md font-semibold rounded-xl shadow-xs"
                  >
                    Switch to Version
                  </Button>
                )}

                {onViewPlanDetail && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPlanDetail(ver.id)}
                    className="h-8 px-2 text-md font-medium text-slate-600 hover:text-slate-900"
                    title="Open Full Detail Page"
                  >
                    <Eye className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Version Diff Viewer Modal */}
      {comparingPlanId && (
        <CarePlanDiffViewer
          isOpen={!!comparingPlanId}
          onClose={() => setComparingPlanId(null)}
          diffData={diffData as unknown as CarePlanDiffResponseDTO}
          isLoading={isDiffLoading}
        />
      )}
    </div>
  );
}
