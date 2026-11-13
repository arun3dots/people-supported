"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
} from "@repo/ui/components/ui";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  FileDiff,
} from "lucide-react";
import { CarePlanDiffResponseDTO, ItemDiffDTO } from "@repo/schema";

interface CarePlanDiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  diffData?: CarePlanDiffResponseDTO | null;
  isLoading?: boolean;
}

export function CarePlanDiffViewer({
  isOpen,
  onClose,
  diffData,
  isLoading = false,
}: CarePlanDiffViewerProps) {
  if (!isOpen) return null;

  const renderTagBadge = (tag: string) => {
    switch (tag) {
      case "CarriedOver":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-md">
            <CheckCircle2 className="w-3 h-3 mr-1 text-slate-500" /> Carried Over
          </Badge>
        );
      case "Changed":
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-md">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-600" /> Changed
          </Badge>
        );
      case "New":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-md">
            <PlusCircle className="w-3 h-3 mr-1 text-emerald-600" /> New
          </Badge>
        );
      case "Retired":
      case "Removed":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-md">
            <MinusCircle className="w-3 h-3 mr-1 text-rose-600" /> {tag}
          </Badge>
        );
      default:
        return <Badge variant="outline">{tag}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <FileDiff className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Care Plan Version Diff Comparison
              </DialogTitle>
            </div>
            {diffData && (
              <div className="flex items-center gap-1.5 text-md font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                <span>v{String(diffData.sourceVersionNumber).padStart(4, "0")}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-emerald-700">
                  v{String(diffData.targetVersionNumber).padStart(4, "0")}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-md">
            Computing clinical diff analysis...
          </div>
        ) : !diffData ? (
          <div className="py-12 text-center text-slate-400 text-md">
            No diff data available
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Summary Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <p className="text-md font-medium text-slate-700 leading-relaxed">
                {diffData.summary.humanSummary}
              </p>

              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                <Badge variant="outline" className="bg-white text-md">
                  {diffData.summary.carriedOverCount} Carried Over
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-800 text-md">
                  {diffData.summary.changedCount} Changed
                </Badge>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 text-md">
                  {diffData.summary.newCount} New
                </Badge>
                <Badge variant="outline" className="bg-rose-50 text-rose-800 text-md">
                  {diffData.summary.retiredCount + diffData.summary.removedCount} Retired/Removed
                </Badge>
              </div>
            </div>

            {/* Goals Diffs */}
            <div className="space-y-3">
              <h4 className="text-md font-bold text-slate-500 uppercase tracking-wider">
                Clinical Goals ({diffData.goalDiffs.length})
              </h4>
              <div className="space-y-2">
                {diffData.goalDiffs.map((g: ItemDiffDTO, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-md font-semibold text-slate-900">
                          {g.title}
                        </span>
                        <Badge variant="secondary" className="text-md px-1.5 py-0">
                          {g.category}
                        </Badge>
                      </div>
                      {g.details && (
                        <p className="text-md text-slate-500 mt-0.5">{g.details}</p>
                      )}
                    </div>
                    <div>{renderTagBadge(g.diffTag)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks Diffs */}
            <div className="space-y-3">
              <h4 className="text-md font-bold text-slate-500 uppercase tracking-wider">
                Daily Routines & Tasks ({diffData.taskDiffs.length})
              </h4>
              <div className="space-y-2">
                {diffData.taskDiffs.map((t: ItemDiffDTO, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-md font-semibold text-slate-900">
                          {t.title}
                        </span>
                        <Badge variant="secondary" className="text-md px-1.5 py-0">
                          {t.category}
                        </Badge>
                      </div>
                      {t.details && (
                        <p className="text-md text-slate-500 mt-0.5">{t.details}</p>
                      )}
                    </div>
                    <div>{renderTagBadge(t.diffTag)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close Diff
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
