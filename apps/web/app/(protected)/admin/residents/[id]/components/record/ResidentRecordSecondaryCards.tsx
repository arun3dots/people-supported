"use client";

import React, { useState } from "react";
import {
  Users,
  Zap,
  Stethoscope,
  Pencil,
  Phone,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge, Button, Card, InfoField, Text } from "@repo/ui/components/ui";
import { useGetPreAdmissionQuery } from "../../../../../../../lib/queries/pre-admission";
import { hydrateParts } from "../../../../../resident/admit/pre-admission/partsState";
import { PreAdmissionSummary } from "../../../../../resident/admit/pre-admission/review/PreAdmissionSummary";
import type { ProfileEditSection } from "./SupportedLivingProfileEditModal";

type PreAdmissionRecordData = ReturnType<typeof useGetPreAdmissionQuery>["data"];

interface ResidentRecordSecondaryCardsProps {
  residentId: string;
  canEdit: boolean;
  onEditSection: (section: ProfileEditSection) => void;
  onNavigateTab?: (tab: string) => void;
  housematesCount: number;
  preferredEnvironment: string;
  knownTriggers: string;
  likesAndInterests: string;
  nokName: string;
  nokPhone: string;
  allergiesList: string[];
  preAdmissionRecord: PreAdmissionRecordData;
}

const QUICK_ACTION_TABS = [
  { label: "View Support Plan", tab: "careplan" },
  { label: "Record Daily Log", tab: "timeline" },
  { label: "Add Incident", tab: "incidents" },
  { label: "Update Medication", tab: "mar" },
] as const;

export function ResidentRecordSecondaryCards({
  residentId,
  canEdit,
  onEditSection,
  onNavigateTab,
  housematesCount,
  preferredEnvironment,
  knownTriggers,
  likesAndInterests,
  nokName,
  nokPhone,
  allergiesList,
  preAdmissionRecord,
}: ResidentRecordSecondaryCardsProps) {
  const [showPreAdmission, setShowPreAdmission] = useState(false);

  return (
    <>
      {/* 5. Compatibility & 6. Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="surface" className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                Compatibility
              </Text>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditSection("compatibility")}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" /> Edit
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label="Housemates" value={`${housematesCount}`} />
            <InfoField label="Preferred Environment" value={preferredEnvironment} multiline />
            <InfoField label="Known Triggers" value={knownTriggers} multiline />
            <InfoField label="Likes & Interests" value={likesAndInterests} multiline />
          </div>
        </Card>

        <Card variant="surface" className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <Text as="h3" size="md" weight="semibold" className="text-slate-900">
              Quick Actions
            </Text>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {QUICK_ACTION_TABS.map((act) => (
              <Button
                key={act.tab}
                type="button"
                variant="outline"
                onClick={() => onNavigateTab?.(act.tab)}
                className="h-10 bg-white justify-center"
              >
                {act.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* 7. Health & Contacts */}
      <Card variant="surface" className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="size-4 text-primary" />
          <Text as="h3" size="md" weight="semibold" className="text-slate-900">
            Health & Contacts
          </Text>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="white" border="secondary" className="p-4">
            <InfoField
              label="GP practice"
              value="York Medical Practice — Dr A. Malik"
              multiline
            />
          </Card>

          <Card variant="white" border="secondary" className="p-4">
            <InfoField
              label="Next of kin"
              value={nokName}
              subValue={
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Phone className="size-3" /> {nokPhone}
                </span>
              }
              multiline
            />
          </Card>

          <Card variant="white" border="secondary" className="p-4">
            <InfoField
              label={
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="size-3.5" /> Communication
                </span>
              }
              value="Verbal. Short sentences and visual timetable help."
              multiline
            />
          </Card>

          <Card variant="white" border="secondary" className="p-4">
            <InfoField
              label={
                <span className="inline-flex items-center gap-1 text-text-error">
                  <AlertTriangle className="size-3.5" /> Allergies
                </span>
              }
            >
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(allergiesList.length > 0 ? allergiesList : ["Penicillin"]).map(
                  (allergy) => (
                    <Badge key={allergy} variant="secondary" state="danger" className="border">
                      {allergy}
                    </Badge>
                  ),
                )}
              </div>
            </InfoField>
          </Card>
        </div>
      </Card>

      {/* 8. Onboarding & Pre-Admission Summary Accordion */}
      {preAdmissionRecord && (
        <Card variant="surface" className="p-5">
          <button
            type="button"
            onClick={() => setShowPreAdmission((prev) => !prev)}
            className="w-full flex items-center justify-between text-left px-1 py-1 cursor-pointer"
          >
            <div className="space-y-0.5">
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                Onboarding & Pre-Admission Assessment Record (v{preAdmissionRecord.versionNumber})
              </Text>
              <Text size="md" variant="muted">
                Click to {showPreAdmission ? "hide" : "view"} full pre-admission clinical &
                baseline details
              </Text>
            </div>
            {showPreAdmission ? (
              <ChevronUp className="size-4 text-slate-500 shrink-0" />
            ) : (
              <ChevronDown className="size-4 text-slate-500 shrink-0" />
            )}
          </button>
          {showPreAdmission && (
            <div className="pt-4 mt-4 border-t border-slate-200/80">
              <PreAdmissionSummary
                parts={hydrateParts(preAdmissionRecord)}
                residentId={residentId}
                hasSavedAdls={Boolean(preAdmissionRecord.partD?.adlChecklist)}
              />
            </div>
          )}
        </Card>
      )}
    </>
  );
}
