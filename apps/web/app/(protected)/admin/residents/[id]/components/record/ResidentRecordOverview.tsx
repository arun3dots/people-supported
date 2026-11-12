"use client";

import React, { useState } from "react";
import { Activity, FileText, ShieldCheck, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, InfoField, Spinner, Text } from "@repo/ui/components/ui";
import type { SupportedLivingDetailsDTO } from "@repo/schema";
import {
  useGetResidentQuery,
  useUpdateSupportedLivingMutation,
} from "../../../../../../../lib/queries/residents";
import { useGetPreAdmissionQuery } from "../../../../../../../lib/queries/pre-admission";
import {
  emptyParts,
  hydrateParts,
} from "../../../../../resident/admit/pre-admission/partsState";
import {
  buildAboutMeRows,
  buildAdlRows,
  buildAdvanceCareRows,
  buildCapacityRows,
  hasValue,
  type SummaryRow,
} from "../../../../../resident/admit/pre-admission/review/summarySections";
import {
  SupportedLivingProfileEditModal,
  type ProfileEditSection,
} from "./SupportedLivingProfileEditModal";
import { ResidentRecordSecondaryCards } from "./ResidentRecordSecondaryCards";

interface ResidentRecordOverviewProps {
  residentId: string;
  canEdit: boolean;
  onNavigateTab?: (tab: string) => void;
}

export function ResidentRecordOverview({
  residentId,
  canEdit,
  onNavigateTab,
}: ResidentRecordOverviewProps) {
  const { data: resident, isLoading } = useGetResidentQuery(residentId);
  const preAdmissionQuery = useGetPreAdmissionQuery(residentId, { retry: false });
  const updateSlMutation = useUpdateSupportedLivingMutation();

  const [editSection, setEditSection] = useState<ProfileEditSection>(null);

  if (isLoading) {
    return (
      <Card variant="surface" className="flex items-center justify-center min-h-72 p-6">
        <Spinner />
      </Card>
    );
  }

  const sl: SupportedLivingDetailsDTO =
    (resident?.supportedLivingDetails as SupportedLivingDetailsDTO | undefined) ?? {};
  const record = preAdmissionQuery.data;
  const parts = record ? hydrateParts(record) : emptyParts();
  const hasSavedAdls = Boolean(record?.partD?.adlChecklist);

  const housematesVal = sl.compatibility?.housematesCount ?? 2;
  const preferredEnvVal =
    sl.compatibility?.preferredEnvironment || "Quiet, supportive home";
  const triggersVal = sl.compatibility?.knownTriggers || "Loud noise, change in routine";
  const interestsVal =
    sl.compatibility?.likesAndInterests || "Football, cooking shows, dog walking";

  const nokName = resident?.nextOfKin?.name || "Janet Webb (Mother)";
  const nokPhone = resident?.nextOfKin?.phoneNumber || "07700 900321";
  const allergiesList = resident?.careProfile?.allergies ?? [];

  const sections: Array<{ title: string; icon: LucideIcon; rows: SummaryRow[] }> = [
    {
      title: "Activities of Daily Living (ADLs)",
      icon: Activity,
      rows: buildAdlRows(parts.partD, hasSavedAdls),
    },
    {
      title: "Advance care planning",
      icon: FileText,
      rows: buildAdvanceCareRows(parts.partF),
    },
    {
      title: "About me",
      icon: User,
      rows: buildAboutMeRows(parts.partG),
    },
    {
      title: "Capacity, consent, DoLS",
      icon: ShieldCheck,
      rows: buildCapacityRows(parts.partE),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {sections.map((section) => {
        const filled = section.rows.filter(([, value]) => hasValue(value));
        return (
          <Card key={section.title} variant="surface" className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <section.icon className="size-4 text-primary" />
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                {section.title}
              </Text>
            </div>
            {filled.length === 0 ? (
              <Text size="md" className="text-slate-500">
                Nothing recorded yet.
              </Text>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filled.map(([label, value], idx) => (
                  <InfoField key={`${label}-${idx}`} label={label} value={value} multiline />
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <ResidentRecordSecondaryCards
        residentId={residentId}
        canEdit={canEdit}
        onEditSection={setEditSection}
        onNavigateTab={onNavigateTab}
        housematesCount={housematesVal}
        preferredEnvironment={preferredEnvVal}
        knownTriggers={triggersVal}
        likesAndInterests={interestsVal}
        nokName={nokName}
        nokPhone={nokPhone}
        allergiesList={allergiesList}
        preAdmissionRecord={record}
      />

      <SupportedLivingProfileEditModal
        section={editSection}
        onClose={() => setEditSection(null)}
        details={
          !sl.tenancy?.landlord && record?.roomAllocation?.landlord
            ? {
                ...sl,
                tenancy: {
                  ...sl.tenancy,
                  landlord: record.roomAllocation.landlord,
                },
              }
            : sl
        }
        onSave={(patch) => updateSlMutation.mutateAsync({ residentId, data: patch })}
        isSaving={updateSlMutation.isPending}
      />
    </div>
  );
}
