"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Badge,
  Textarea,
  Label,
} from "@repo/ui/components/ui";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  AlertTriangle,
  X,
  Crosshair,
} from "lucide-react";
import { format } from "date-fns";
import { FINDING_TYPE_COLORS, SEVERITY_COLORS } from "./body-map-zones";
import { FindingClinicalDetailsCard } from "./FindingClinicalDetailsCard";
import {
  FindingPhotosSection,
  type FindingPhoto,
} from "./FindingPhotosSection";
import {
  FindingActionsSection,
  type FindingActionItem,
} from "./FindingActionsSection";

// ─── Types ───────────────────────────────────────────────────

export interface FindingDetailItem {
  id: string;
  trackingId: string;
  view: string;
  bodyMapVariant: string;
  bodyMapAssetVersion?: string;
  anatomyId: string;
  locationLabel: string;
  exactCoordinateSpace?: string;
  exactX?: number | null;
  exactY?: number | null;
  findingType: string;
  severity: string;
  description?: string;
  onsetDate: string;
  status: string;
  linkedIncidentId?: string;
  resolvedAt?: string;
  resolvedById?: string;
  resolutionNote?: string;
  createdAt: string;
  photos: FindingPhoto[];
  actions?: FindingActionItem[];
}

interface FindingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: FindingDetailItem | null;
  canResolve?: boolean;
  onResolve?: (findingId: string, resolutionNote: string) => void;
  onUploadPhoto?: (findingId: string, file: File) => void;
  photoStreamBaseUrl?: string;
  residentId?: string;
}

export function FindingDetailDialog({
  open,
  onOpenChange,
  finding,
  canResolve = true,
  onResolve,
  onUploadPhoto,
  photoStreamBaseUrl = "/api/body-map-photos",
  residentId = "",
}: FindingDetailDialogProps) {
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");

  if (!finding) return null;

  const isOpen = finding.status === "Open";
  const typeColor = FINDING_TYPE_COLORS[finding.findingType] || "#A855F7";
  const sevColor = SEVERITY_COLORS[finding.severity] || "#6B7280";

  const handleResolve = () => {
    onResolve?.(finding.id, resolutionNote);
    setShowResolveForm(false);
    setResolutionNote("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="2xl"
        className="sm:max-w-2xl max-h-[88vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span
                className="inline-block size-3 rounded-full"
                style={{ background: typeColor }}
              />
              <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {finding.trackingId}
              </span>
              <span>{finding.findingType}</span>
            </DialogTitle>
            <Badge
              variant={isOpen ? "destructive" : "secondary"}
              className="text-sm px-2.5 py-0.5"
            >
              {finding.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Location & Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <MapPin className="size-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Anatomical Location
                </p>
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {finding.locationLabel}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {finding.view} View ({finding.bodyMapVariant})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <AlertTriangle
                className="size-4 shrink-0"
                style={{ color: sevColor }}
              />
              <div>
                <p className="text-sm font-medium text-slate-500">Severity</p>
                <p className="text-sm font-bold" style={{ color: sevColor }}>
                  {finding.severity}
                </p>
              </div>
            </div>
          </div>

          {/* Exact Location Badge */}
          {finding.exactX != null && finding.exactY != null && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
              <Crosshair className="size-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold">Exact Coordinate Pin:</span>{" "}
                <span className="font-mono text-sm font-medium">
                  x: {finding.exactX.toFixed(2)}, y: {finding.exactY.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Calendar className="size-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-500">Onset Date</p>
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(finding.onsetDate), "dd MMM yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Calendar className="size-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-500">Recorded</p>
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(finding.createdAt), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
            </div>
          </div>

          {/* Structured Clinical Details & Observations */}
          <FindingClinicalDetailsCard
            description={finding.description}
            findingType={finding.findingType}
          />

          {/* Photographs */}
          <FindingPhotosSection
            photos={finding.photos || []}
            isOpen={isOpen}
            trackingId={finding.trackingId}
            onUploadPhoto={(file) => onUploadPhoto?.(finding.id, file)}
            photoStreamBaseUrl={photoStreamBaseUrl}
          />

          {/* Action History and Action Taken */}
          <FindingActionsSection
            findingId={finding.id}
            residentId={residentId}
            isResolved={!isOpen}
            actions={finding.actions || []}
          />

          {/* Resolution Info */}
          {finding.resolvedAt && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <p className="text-sm text-emerald-800 font-semibold">
                  Resolved on{" "}
                  {format(new Date(finding.resolvedAt), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
              {finding.resolutionNote && (
                <p className="text-sm text-emerald-900 mt-1">
                  {finding.resolutionNote}
                </p>
              )}
            </div>
          )}

          {/* Resolve Form */}
          {isOpen && canResolve && showResolveForm && (
            <div className="space-y-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Label className="text-sm font-semibold text-amber-900">
                Resolution Notes
              </Label>
              <Textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. Skin tear fully healed, dressing discontinued."
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowResolveForm(false)}
                  className="text-sm"
                >
                  <X className="size-3.5 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleResolve} className="text-sm">
                  <CheckCircle2 className="size-3.5 mr-1" />
                  Confirm Resolve
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {isOpen && canResolve && !showResolveForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolveForm(true)}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-sm"
            >
              <CheckCircle2 className="size-3.5 mr-1.5" />
              Resolve Finding
            </Button>
          ) : (
            <div />
          )}
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
