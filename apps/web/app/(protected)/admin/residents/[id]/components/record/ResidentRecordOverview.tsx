"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Home,
  Heart,
  Target,
  Users,
  Zap,
  Stethoscope,
  Pencil,
  CheckCircle2,
  Phone,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button, Spinner, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { SupportedLivingDetailsDTO, SupportedLivingOutcomeDTO } from "@repo/schema";
import {
  useGetResidentQuery,
  useUpdateSupportedLivingMutation,
} from "../../../../../../../lib/queries/residents";
import { useGetPreAdmissionQuery } from "../../../../../../../lib/queries/pre-admission";
import { hydrateParts } from "../../../../../resident/admit/pre-admission/partsState";
import { PreAdmissionSummary } from "../../../../../resident/admit/pre-admission/review/PreAdmissionSummary";
import {
  SupportedLivingProfileEditModal,
  type ProfileEditSection,
} from "./SupportedLivingProfileEditModal";

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
  const [showPreAdmission, setShowPreAdmission] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-72">
        <Spinner />
      </div>
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

  const renderDefinitionRows = (rows: { label: string; value: React.ReactNode; bold?: boolean }[]) => (
    <dl className="space-y-2.5 text-md">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-3 gap-2">
          <dt className="text-slate-500 font-medium">{r.label}</dt>
          <dd className={cn("col-span-2 text-slate-900", r.bold ? "font-bold" : "font-medium")}>
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Personal Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <Text size="md" weight="semibold" className="text-slate-900">
                Personal Details
              </Text>
            </div>
            {canEdit && (
              <Link href={`/admin/residents/admit?id=${residentId}&step=1`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl border-slate-200 text-md font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="size-3" /> Edit
                </Button>
              </Link>
            )}
          </div>
          {renderDefinitionRows([
            { label: "Address:", value: addressVal },
            { label: "Phone:", value: phoneVal },
            { label: "Email:", value: emailVal },
            { label: "Preferred name:", value: preferredName },
            { label: "Gender:", value: genderVal },
          ])}
        </div>

        {/* 2. Tenancy Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="size-4 text-primary" />
              <Text size="md" weight="semibold" className="text-slate-900">
                Tenancy Information
              </Text>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSection("tenancy")}
                className="h-9 gap-1.5 rounded-xl border-slate-200 text-md font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="size-3" /> Edit
              </Button>
            )}
          </div>
          {renderDefinitionRows([
            { label: "Tenancy Start Date:", value: tenancyStart },
            { label: "Landlord:", value: landlordVal },
            { label: "Tenancy Type:", value: tenancyTypeVal },
            { label: "Housing Benefit:", value: housingBenefitVal },
            { label: "Weekly Rent:", value: weeklyRentVal, bold: true },
          ])}
        </div>

        {/* 3. Support Needs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-primary fill-primary" />
              <Text size="md" weight="semibold" className="text-slate-900">
                Support Needs
              </Text>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSection("needs")}
                className="h-9 gap-1.5 rounded-xl border-slate-200 text-md font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="size-3" /> Edit
              </Button>
            )}
          </div>
          <ul className="space-y-2 text-md text-slate-800 list-disc pl-5">
            {supportNeedsList.map((item: string, idx: number) => (
              <li key={idx} className="font-medium">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Support Goals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <Text size="md" weight="semibold" className="text-slate-900">
                Support Goals
              </Text>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSection("goals")}
                className="h-9 gap-1.5 rounded-xl border-slate-200 text-md font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="size-3" /> Edit
              </Button>
            )}
          </div>
          <div className="space-y-3.5">
            {goalsList.map((goal: SupportedLivingOutcomeDTO) => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-md">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                    {goal.title}
                  </span>
                  <span className="font-semibold text-slate-500">{goal.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
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
        </div>

        {/* 5. Compatibility */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <Text size="md" weight="semibold" className="text-slate-900">
                Compatibility
              </Text>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditSection("compatibility")}
                className="h-9 gap-1.5 rounded-xl border-slate-200 text-md font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="size-3" /> Edit
              </Button>
            )}
          </div>
          {renderDefinitionRows([
            { label: "Housemates:", value: housematesVal, bold: true },
            { label: "Preferred Environment:", value: preferredEnvVal },
            { label: "Known Triggers:", value: triggersVal },
            { label: "Likes & Interests:", value: interestsVal },
          ])}
        </div>

        {/* 6. Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <Text size="md" weight="semibold" className="text-slate-900">
              Quick Actions
            </Text>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { label: "View Support Plan", tab: "careplan" },
              { label: "Record Daily Log", tab: "timeline" },
              { label: "Add Incident", tab: "incidents" },
              { label: "Update Medication", tab: "mar" },
            ].map((act) => (
              <Button
                key={act.tab}
                type="button"
                variant="outline"
                onClick={() => onNavigateTab?.(act.tab)}
                className="h-10 rounded-xl border-slate-200 text-md font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {act.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Health & Contacts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="size-4 text-primary" />
          <Text size="md" weight="semibold" className="text-slate-900">
            Health & Contacts
          </Text>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-4 space-y-1">
            <p className="text-md text-slate-500">GP practice</p>
            <p className="text-md font-semibold text-slate-900">
              York Medical Practice — Dr A. Malik
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-4 space-y-1">
            <p className="text-md text-slate-500">Next of kin</p>
            <p className="text-md font-semibold text-slate-900">{nokName}</p>
            <p className="text-md text-slate-500 inline-flex items-center gap-1">
              <Phone className="size-3" /> {nokPhone}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-4 space-y-1">
            <p className="text-md text-slate-500 inline-flex items-center gap-1">
              <MessageSquare className="size-3" /> Communication
            </p>
            <p className="text-md font-medium text-slate-800">
              Verbal. Short sentences and visual timetable help.
            </p>
          </div>
          <div className="rounded-xl bg-red-50/60 border border-red-200/70 p-4 space-y-1">
            <p className="text-md text-red-700 font-semibold inline-flex items-center gap-1">
              <AlertTriangle className="size-3" /> Allergies
            </p>
            <p className="text-md font-semibold text-red-800">
              {allergiesList.length > 0 ? allergiesList.join(", ") : "Penicillin"}
            </p>
          </div>
        </div>
      </div>

      {record && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <button
            type="button"
            onClick={() => setShowPreAdmission((prev) => !prev)}
            className="w-full flex items-center justify-between text-left px-2 py-1 cursor-pointer"
          >
            <div>
              <Text size="md" weight="semibold" className="text-slate-800">
                Onboarding & Pre-Admission Assessment Record (v{record.versionNumber})
              </Text>
              <Text size="md" className="text-slate-500">
                Click to {showPreAdmission ? "hide" : "view"} full pre-admission clinical &
                baseline details
              </Text>
            </div>
            {showPreAdmission ? (
              <ChevronUp className="size-4 text-slate-500" />
            ) : (
              <ChevronDown className="size-4 text-slate-500" />
            )}
          </button>
          {showPreAdmission && (
            <div className="pt-4 mt-3 border-t border-slate-100">
              <PreAdmissionSummary
                parts={hydrateParts(record)}
                residentId={residentId}
                hasSavedAdls={Boolean(record.partD?.adlChecklist)}
              />
            </div>
          )}
        </div>
      )}

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
