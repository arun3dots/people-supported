"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button, Card, InfoField, Text } from "@repo/ui/components/ui";
import { Edit, ShieldCheck, FileText } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useParams } from "next/navigation";
import { DocumentViewerModal } from "../DocumentViewerModal";

interface OccupationalHealthCardProps {
  health?: {
    status?: string;
    lastAssessmentDate?: string;
    nextAssessmentDate?: string;
    assessedBy?: string;
    outcome?: string;
    restrictions?: string;
    notes?: string;
    documentUrl?: string;
  };
  complianceLoading?: boolean;
  onEditClick: () => void;
}

export function OccupationalHealthCard({
  health,
  complianceLoading,
  onEditClick,
}: OccupationalHealthCardProps) {
  const { id: staffId } = useParams<{ id: string }>();
  const [viewerOpen, setViewerOpen] = useState(false);

  // SVG Circular Gauge Parameters
  const radius = 48;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Mount State for smooth animation
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine score & outcome state
  const statusRaw = health?.status?.trim() || "Pending";
  const statusLower = statusRaw.toLowerCase();

  const isCleared =
    statusLower === "cleared" ||
    statusLower === "valid" ||
    statusLower === "clear";
  const isRestricted =
    statusLower === "restricted" ||
    statusLower === "refused" ||
    statusLower === "expired";

  const hasHealthRecord = Boolean(health?.status || health?.lastAssessmentDate);
  const scorePercent = hasHealthRecord ? (isCleared ? 100 : isRestricted ? 100 : 50) : 0;
  const targetOffset = circumference - (scorePercent / 100) * circumference;
  const strokeDashoffset = mounted ? targetOffset : circumference;

  const ringColorClass = isCleared
    ? "text-primary"
    : isRestricted
      ? "text-red-500"
      : "text-amber-500";

  const statusTextColorClass = isCleared
    ? "text-primary"
    : isRestricted
      ? "text-red-600"
      : "text-amber-600";

  const statusDotColorClass = isCleared
    ? "bg-primary"
    : isRestricted
      ? "bg-red-500"
      : "bg-amber-400";

  // Extract documentUrl and extended fields from property or embedded notes tags
  const notesStr = health?.notes || "";
  const docMatch = notesStr.match(/\[Document:\s*(.+?)\]/);
  const nextAssMatch = notesStr.match(/\[NextAssessment:\s*(.+?)\]/);
  const assessedByMatch = notesStr.match(/\[AssessedBy:\s*(.+?)\]/);
  const outcomeMatch = notesStr.match(/\[Outcome:\s*(.+?)\]/);
  const restrictionsMatch = notesStr.match(/\[Restrictions:\s*(.+?)\]/);

  const effectiveDocumentUrl = health?.documentUrl || (docMatch ? docMatch[1] : undefined);
  const effectiveNextDate = health?.nextAssessmentDate || (nextAssMatch ? nextAssMatch[1] : undefined);
  const effectiveAssessedBy = health?.assessedBy || (assessedByMatch ? assessedByMatch[1] : undefined);
  const effectiveOutcome = health?.outcome || (outcomeMatch ? outcomeMatch[1] : (isCleared ? "Fit to Work" : undefined));
  const effectiveRestrictions = health?.restrictions || (restrictionsMatch ? restrictionsMatch[1] : undefined);
  const cleanNotes = notesStr.replace(/\[(NextAssessment|AssessedBy|Outcome|Restrictions|Document):[^\]]+\]/g, "").trim();

  return (
    <Card className="p-6 flex flex-col gap-6 w-full font-['Outfit',sans-serif]">
      {/* Document Viewer Modal (Protected Download-Disabled Preview) */}
      <DocumentViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        title="Occupational Health Certificate"
        documentPath={effectiveDocumentUrl}
        staffId={staffId}
      />

      {/* Header Section */}
      <div className="w-full flex items-center justify-between h-[44px]">
        <h3 className="text-h7 font-medium text-[#141F1E]">
          Occupational Health Clearance
        </h3>

        <div className="flex items-center gap-2">
          {effectiveDocumentUrl && (
            <Button
              onClick={() => setViewerOpen(true)}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-md text-primary border-primary/30 hover:bg-primary/5 cursor-pointer"
              title="View uploaded health clearance certificate"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              View Certificate
            </Button>
          )}
          <Button onClick={onEditClick} variant="ghost" size="icon" aria-label="Edit">
            <Edit className="w-4 h-4" />

          </Button>
        </div>
      </div>

      {complianceLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-[#4A706A] border-t-transparent rounded-full" />
        </div>
      ) : !hasHealthRecord ? (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 border border-dashed rounded-xl border-slate-200">
          <ShieldCheck className="w-8 h-8 text-slate-400" />
          <Text size="sm" weight="regular" className="text-slate-500 italic">
            No occupational health clearance record found. Click &quot;Edit&quot; to record health details.
          </Text>
        </div>
      ) : (
        <>
          {/* Top Info Section: Gauge + Grid Fields */}
          <div className="flex flex-col md:flex-row items-center gap-8 w-full">
            {/* Circular Progress Gauge */}
            <div className="relative w-[130px] h-[130px] flex items-center justify-center shrink-0">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 120 120"
              >
                {/* Outer / Background Track */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="text-[#D9D9D9]"
                  strokeWidth={strokeWidth}
                  stroke="currentColor"
                  fill="none"
                />
                {/* Animated Progress Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className={ringColorClass}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  style={{
                    transition: "stroke-dashoffset 1s ease-out",
                  }}
                />
              </svg>
              {/* Center Gauge Status replacing percentage */}
              <div className="absolute flex flex-col items-center justify-center text-center p-3">
                <Text
                  size="sm"
                  weight="bold"
                  className={cn("leading-tight tracking-wide  text-center break-words", statusTextColorClass)}
                >
                  {statusRaw}
                </Text>
              </div>
            </div>

            {/* Data Grid Section using InfoField UI components */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-8 w-full">
              {/* Column 1: Overall Status */}
              <InfoField label="Overall Status">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-3 h-3 rounded-full inline-block shrink-0",
                      statusDotColorClass
                    )}
                  />
                  <Text size="sm" weight="regular" className="text-[#141F1E]">
                    {health?.status || "Pending"}
                  </Text>
                </div>
              </InfoField>

              {/* Column 2: Last Assessment */}
              <InfoField
                label="Clearance Date"
                value={
                  health?.lastAssessmentDate
                    ? format(new Date(health.lastAssessmentDate), "dd MMM yyyy")
                    : "Not set"
                }
              />

              {/* Column 3: Next Assessment Due */}
              <InfoField
                label="Next Assessment Due"
                value={
                  effectiveNextDate
                    ? (isNaN(Date.parse(effectiveNextDate)) ? effectiveNextDate : format(new Date(effectiveNextDate), "dd MMM yyyy"))
                    : "Not set"
                }
              />

              {/* Column 4: Assessed By */}
              <InfoField
                label="Assessed By"
                value={effectiveAssessedBy || "Not specified"}
              />

              {/* Column 5: Outcome */}
              <InfoField
                label="Outcome"
                value={effectiveOutcome || health?.status || "Not set"}
              />

              {/* Column 6: Restrictions */}
              <InfoField
                label="Restrictions"
                value={effectiveRestrictions || "None"}
              />
            </div>
          </div>

          {/* Bottom Banner Note using Text UI component */}
          {cleanNotes && (
            <div className="flex items-center gap-3 p-4 bg-[#F5F8F7] border border-[#BCD3CD] rounded-xl w-full">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#4A706A]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <Text size="sm" weight="semibold" className="text-[#22973F]">
                  {health?.outcome || "Fit to Work"}
                </Text>
                <Text size="sm" weight="regular" className="text-[#5D5D5D]">
                  {cleanNotes}
                </Text>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}