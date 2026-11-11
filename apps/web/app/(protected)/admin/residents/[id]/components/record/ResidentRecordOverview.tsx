"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Home,
  Heart,
  Target,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { Button, Card, InfoField, Spinner, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { SupportedLivingDetailsDTO, SupportedLivingOutcomeDTO } from "@repo/schema";
import {
  useGetResidentQuery,
  useUpdateSupportedLivingMutation,
} from "../../../../../../../lib/queries/residents";
import { useGetPreAdmissionQuery } from "../../../../../../../lib/queries/pre-admission";
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

  const propName =
    resident?.bed?.wingName || resident?.bed?.room?.wing?.name || "Oak House";
  const roomNum = resident?.bed?.room?.roomNumber
    ? /^(flat|room)\b/i.test(resident.bed.room.roomNumber.trim())
      ? resident.bed.room.roomNumber.trim()
      : `Flat ${resident.bed.room.roomNumber.trim()}`
    : "Flat 1";

  const addressVal =
    sl.tenancy?.address ||
    [resident?.profile?.addressLine1, resident?.profile?.city, resident?.profile?.postcode]
      .filter(Boolean)
      .join(", ") ||
    `${roomNum}, ${propName}, York, YO31 7EH`;

  const phoneVal = resident?.careProfile?.communityNursePhone || "07123 456789";
  const emailVal = `${(resident?.fullName || "resident").toLowerCase().replace(/\s+/g, ".")}@tenant.cantracare.co.uk`;
  const preferredName =
    resident?.profile?.preferredName || resident?.fullName?.split(" ")[0] || "—";
  const genderVal = resident?.profile?.gender || "Male";

  const tenancyStart = sl.tenancy?.tenancyStartDate || "01/01/2023";
  const landlordVal = sl.tenancy?.landlord || "Yorkshire Housing Association";
  const tenancyTypeVal = sl.tenancy?.tenancyType || "Assured Shorthold Tenancy";
  const housingBenefitVal = sl.tenancy?.housingBenefit || "Yes";
  const weeklyRentVal =
    sl.tenancy?.weeklyRent !== undefined && sl.tenancy?.weeklyRent !== null
      ? `£${Number(sl.tenancy.weeklyRent).toFixed(2)}`
      : "£142.50";

  const supportNeedsList: string[] = sl.supportNeeds?.length
    ? sl.supportNeeds
    : [
        sl.primaryNeed || resident?.careProfile?.primaryCareNeed || "Learning disability",
        "Support with daily living skills",
        "Help with medication",
        "Prompting with personal care",
      ];

  const goalsList: SupportedLivingOutcomeDTO[] = sl.outcomes?.length
    ? sl.outcomes
    : [
        { id: "g1", title: "Prepare meals independently", progress: 70, status: "On track" },
        { id: "g2", title: "Use public transport", progress: 45, status: "On track" },
        {
          id: "g3",
          title: "Build confidence in community activities",
          progress: 30,
          status: "Needs focus",
        },
      ];

  const housematesVal = sl.compatibility?.housematesCount ?? 2;
  const preferredEnvVal =
    sl.compatibility?.preferredEnvironment || "Quiet, supportive home";
  const triggersVal = sl.compatibility?.knownTriggers || "Loud noise, change in routine";
  const interestsVal =
    sl.compatibility?.likesAndInterests || "Football, cooking shows, dog walking";

  const nokName = resident?.nextOfKin?.name || "Janet Webb (Mother)";
  const nokPhone = resident?.nextOfKin?.phoneNumber || "07700 900321";
  const allergiesList = resident?.careProfile?.allergies ?? [];

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Personal Details */}
        <Card variant="surface" className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                Personal Details
              </Text>
            </div>
            {canEdit && (
              <Link href={`/admin/residents/admit?id=${residentId}&step=1`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Pencil className="size-3.5" /> Edit
                </Button>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label="Address" value={addressVal} multiline className="sm:col-span-2" />
            <InfoField label="Phone" value={phoneVal} />
            <InfoField label="Email" value={emailVal} multiline />
            <InfoField label="Preferred name" value={preferredName} />
            <InfoField label="Gender" value={genderVal} />
          </div>
        </Card>

        {/* 2. Tenancy Information */}
        <Card variant="surface" className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Home className="size-4 text-primary" />
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                Tenancy Information
              </Text>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSection("tenancy")}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" /> Edit
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label="Tenancy Start Date" value={tenancyStart} />
            <InfoField label="Landlord" value={landlordVal} multiline />
            <InfoField label="Tenancy Type" value={tenancyTypeVal} multiline />
            <InfoField label="Housing Benefit" value={housingBenefitVal} />
            <InfoField label="Weekly Rent" value={weeklyRentVal} />
          </div>
        </Card>

        {/* 3. Support Needs */}
        <Card variant="surface" className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-primary fill-primary" />
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                Support Needs
              </Text>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSection("needs")}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" /> Edit
              </Button>
            )}
          </div>
          <ul className="space-y-2 list-disc pl-5 text-slate-800">
            {supportNeedsList.map((item: string, idx: number) => (
              <li key={idx}>
                <Text as="span" size="md" weight="normal" className="text-slate-800">
                  {item}
                </Text>
              </li>
            ))}
          </ul>
        </Card>

        {/* 4. Support Goals */}
        <Card variant="surface" className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <Text as="h3" size="md" weight="semibold" className="text-slate-900">
                Support Goals
              </Text>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSection("goals")}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" /> Edit
              </Button>
            )}
          </div>
          <div className="space-y-3.5">
            {goalsList.map((goal: SupportedLivingOutcomeDTO) => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Text
                    as="span"
                    size="md"
                    weight="normal"
                    className="inline-flex items-center gap-1.5 text-slate-800"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                    {goal.title}
                  </Text>
                  <Text as="span" size="sm" weight="medium" variant="muted">
                    {goal.progress}%
                  </Text>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white overflow-hidden border border-slate-200/70">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      goal.status === "Needs focus" ? "bg-amber-600" : "bg-emerald-800",
                    )}
                    style={{ width: `${Math.min(100, goal.progress)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

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
        details={sl}
        onSave={(patch) => updateSlMutation.mutateAsync({ residentId, data: patch })}
        isSaving={updateSlMutation.isPending}
      />
    </div>
  );
}
