"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Badge,
} from "@repo/ui/components/ui";
import { History, Eye, ArrowRight, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { CarePlanStatusBadge } from "../../../../../../shared/components/care-plan/CarePlanStatusBadge";

interface VersionItem {
  id: string;
  versionNumber: number;
  status: string;
  validFrom: string | Date;
  validTo?: string | Date | null;
  renewalReason?: string | null;
  approvals?: Array<{ decision: string; role: string }>;
  goals?: Array<{ id: string; title: string }>;
  tasks?: Array<{ id: string; title: string }>;
}

interface CarePlanVersionHistoryCardProps {
  residentId: string;
  versions: VersionItem[];
}

export function CarePlanVersionHistoryCard({
  residentId,
  versions = [],
}: CarePlanVersionHistoryCardProps) {
  const router = useRouter();

  const formatDate = (d: unknown) => {
    if (!d) return "Present";
    const date = new Date(d as string);
    return isNaN(date.getTime()) ? "Present" : format(date, "MMM yyyy");
  };

  return (
    <Card variant="surface" border="secondary" className="p-5 sm:p-6 space-y-4 rounded-2xl bg-white shadow-xs font-sans">
      <div className="flex items-center justify-between border-b border-border-secondary/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <History className="size-4" />
          </div>
          <div>
            <h3 className="text-md font-bold text-text-primary  tracking-wider">
              Care Plan Version History ({versions.length})
            </h3>
            <p className="text-md text-text-description">
              CQC-compliant audit log of all historical and current care plan iterations
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {versions.length === 0 ? (
          <div className="py-6 text-center text-md text-text-description">
            No version history recorded yet.
          </div>
        ) : (
          versions.map((ver) => {
            const versionPill = `v${String(ver.versionNumber).padStart(4, "0")}`;
            const isActive = ver.status === "Active" || ver.status === "active";

            return (
              <div
                key={ver.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${isActive ? "bg-emerald-50/20 border-emerald-300/70" : "bg-slate-50/40 border-slate-200/80 hover:bg-slate-50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-md px-2.5 py-1 rounded-md bg-slate-200/80 text-slate-800">
                    {versionPill}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <CarePlanStatusBadge status={ver.status} />
                      <span className="text-md text-text-description">
                        {formatDate(ver.validFrom)} — {formatDate(ver.validTo)}
                      </span>
                    </div>
                    {ver.renewalReason && (
                      <p className="text-md text-text-description mt-0.5">
                        Renewal Reason: <span className="font-medium text-text-primary">{ver.renewalReason}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/care-plans/${ver.id}`)}
                    className="text-md h-8 px-3 gap-1"
                  >
                    <Eye className="size-3.5" /> View Details
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
