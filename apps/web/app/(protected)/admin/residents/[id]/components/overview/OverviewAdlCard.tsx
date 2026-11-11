"use client";

import React from "react";
import { Activity } from "lucide-react";
import { Card, Text, Badge, InfoField } from "@repo/ui/components/ui";

interface OverviewAdlCardProps {
  resident: {
    careProfile?: {
      adlScore?: number;
      adlKatzMatrix?: Record<string, string>;
      mobilityAidsUsed?: string[];
      fallRiskScore?: string;
      fallsLast6Months?: number;
      ambulationDistance?: string;
      cognitiveScore?: string;
      orientation?: string;
      dietType?: string;
      textureModification?: string;
      feedingAssistanceNeed?: string;
      feedingAssistance?: string;
      sleepPattern?: string;
      routinePreferences?: string;
      familyInvolvement?: string;
    };
  };
}

export function OverviewAdlCard({ resident }: OverviewAdlCardProps) {
  const care = resident.careProfile || {};
  const katzMatrix = care.adlKatzMatrix || {};
  const mobilityAids = Array.isArray(care.mobilityAidsUsed) ? care.mobilityAidsUsed : [];

  const getKatzBadgeState = (level?: string): "success" | "warning" | "danger" | "inactive" | "info" => {
    switch (level) {
      case "Independent":
        return "success";
      case "Supervision":
      case "Limited Assist":
        return "warning";
      case "Extensive Assist":
      case "Total Dependence":
        return "danger";
      default:
        return "inactive";
    }
  };

  return (
    <Card className="space-y-5 border-none bg-surface-card-grey rounded-2xl p-6 shadow-none font-sans">
      <div className="flex items-center justify-between border-b border-border-secondary/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-surface-primary-light border border-emerald-100 flex items-center justify-center text-icon-primary shrink-0">
            <Activity className="size-4" />
          </div>
          <Text as="h3" size="base" weight="semibold" className="text-slate-900">
            ADL &amp; Functional Capacity Assessment
          </Text>
        </div>
        {care.adlScore !== undefined && care.adlScore !== null && (
          <Badge variant="secondary" state="success" className="px-2.5 py-0.5 shadow-none font-semibold">
            Katz Score: {care.adlScore} / 6
          </Badge>
        )}
      </div>

      {/* Katz 6-Domain Matrix */}
      {katzMatrix && Object.keys(katzMatrix).length > 0 && (
        <div className="bg-white border border-border-secondary/80 rounded-xl p-4 space-y-3 shadow-xs">
          <Text size="md" weight="bold" className="text-slate-900 tracking-wider">
            Katz Index of Independence in Activities of Daily Living
          </Text>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-md">
            {Object.entries(katzMatrix).map(([domain, level]) => (
              <div key={domain} className="flex flex-col gap-1">
                <Text size="sm" weight="medium" className="text-slate-500 capitalize">
                  {domain}
                </Text>
                <div>
                  <Badge variant="secondary" state={getKatzBadgeState(level as string)} className="px-2.5 py-0.5 shadow-none">
                    {String(level)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobility & Fall Risk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoField
          label="Mobility Aids Used"
          value={mobilityAids.length > 0 ? mobilityAids.join(", ") : "Independent / None"}
        />
        <InfoField
          label="Fall Risk Assessment"
          value={
            care.fallRiskScore
              ? `${care.fallRiskScore}${care.fallsLast6Months ? ` (${care.fallsLast6Months} falls in last 6 months)` : ""}`
              : "Standard Risk"
          }
        />
        <InfoField
          label="Ambulation Distance"
          value={care.ambulationDistance || "Independent within unit"}
        />
        <InfoField
          label="Cognitive &amp; Orientation"
          value={
            care.cognitiveScore || care.orientation
              ? `${care.cognitiveScore || "Alert"}${care.orientation ? ` - ${care.orientation}` : ""}`
              : "Alert & Oriented"
          }
        />
      </div>

      {/* Dining & Psychosocial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border-secondary/60">
        <InfoField
          label="Diet Type &amp; Texture"
          value={
            care.dietType
              ? `${care.dietType}${care.textureModification ? ` (${care.textureModification})` : ""}`
              : "Regular Diet"
          }
        />
        <InfoField
          label="Feeding Assistance Need"
          value={care.feedingAssistanceNeed || care.feedingAssistance || "Independent"}
        />
        <InfoField
          label="Sleep Pattern"
          value={care.sleepPattern || "Normal sleep-wake cycle"}
        />
        <InfoField
          label="Daily Routine Preferences"
          value={care.routinePreferences || care.familyInvolvement || "No special requests"}
        />
      </div>
    </Card>
  );
}
