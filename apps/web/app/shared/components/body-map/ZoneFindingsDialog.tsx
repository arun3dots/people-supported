"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Badge,
} from "@repo/ui/components/ui";
import { Plus, Eye, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { FINDING_TYPE_COLORS, SEVERITY_COLORS } from "./body-map-zones";
import { type BodyMapViewType } from "@repo/schema";

interface ZoneFindingItem {
  id: string;
  trackingId?: string;
  view: string;
  anatomyId?: string;
  locationLabel: string;
  findingType: string;
  severity: string;
  description?: string;
  onsetDate: string;
  status: string;
  photos?: Array<{ id: string }>;
}

interface ZoneFindingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: BodyMapViewType;
  locationLabel: string | null;
  findings: ZoneFindingItem[];
  onViewFindingDetail: (finding: ZoneFindingItem) => void;
  onAddNewFinding: () => void;
}

export function ZoneFindingsDialog({
  open,
  onOpenChange,
  view,
  locationLabel,
  findings,
  onViewFindingDetail,
  onAddNewFinding,
}: ZoneFindingsDialogProps) {
  if (!locationLabel) return null;

  const openFindingsCount = findings.filter((f) => f.status === "Open").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <MapPin className="size-4 text-blue-600" />
              {locationLabel}
              <Badge variant="outline" className="text-sm font-normal">
                {view}
              </Badge>
            </DialogTitle>
            {openFindingsCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {openFindingsCount} Open
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-3 my-2">
          <p className="text-sm text-slate-500">
            {findings.length} recorded finding{findings.length !== 1 ? "s" : ""} on this anatomical area:
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {findings.map((f) => {
              const typeColor = FINDING_TYPE_COLORS[f.findingType] || "#A855F7";
              const sevColor = SEVERITY_COLORS[f.severity] || "#6B7280";
              const isOpen = f.status === "Open";

              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full shrink-0"
                        style={{ background: typeColor }}
                      />
                      {f.trackingId && (
                        <span className="font-mono text-[10px] bg-slate-200/80 text-slate-700 px-1 rounded">
                          {f.trackingId}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-slate-900">
                        {f.findingType}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-medium"
                        style={{ borderColor: sevColor, color: sevColor }}
                      >
                        {f.severity}
                      </Badge>
                      <Badge
                        variant={isOpen ? "destructive" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {f.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="size-3" />
                      <span>
                        Onset: {format(new Date(f.onsetDate), "dd MMM yyyy")}
                      </span>
                      {f.photos && f.photos.length > 0 && (
                        <span>· 📷 {f.photos.length}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-sm border-slate-300"
                    onClick={() => {
                      onOpenChange(false);
                      onViewFindingDetail(f);
                    }}
                  >
                    <Eye className="size-3.5" />
                    Details
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              onOpenChange(false);
              onAddNewFinding();
            }}
          >
            <Plus className="size-4" />
            Add Finding
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
