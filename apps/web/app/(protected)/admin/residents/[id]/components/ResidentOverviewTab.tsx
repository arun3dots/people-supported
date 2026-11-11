"use client";

import React, { useState } from "react";
import {
  Info,
  Activity,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Text,
} from "@repo/ui/components/ui";
import { parseNameParts } from "../../../../resident/admit/utils/admissionMappers";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import { cn } from "@repo/ui/lib/utils";

import { OverviewAboutCard } from "./overview/OverviewAboutCard";
import { OverviewPersonalCard } from "./overview/OverviewPersonalCard";
import { OverviewContactsCard } from "./overview/OverviewContactsCard";
import { OverviewMedicalCard } from "./overview/OverviewMedicalCard";
import { OverviewAdlCard } from "./overview/OverviewAdlCard";
import { OverviewCareProvidersCard } from "./overview/OverviewCareProvidersCard";
import { OverviewFinancialCard } from "./overview/OverviewFinancialCard";
import { EditCareProvidersModal } from "./EditCareProvidersModal";
import {
  EditResidentOverviewModal,
  type EditSection,
  type OverviewFormData,
} from "./EditResidentOverviewModal";

interface ResidentOverviewTabProps {
  resident: any;
  readOnly?: boolean;
}

export function ResidentOverviewTab({ resident, readOnly }: ResidentOverviewTabProps) {
  const { user } = useAuth();
  const isAdmin = user?.roleName?.toLowerCase() === "admin";

  const [data, setData] = useState({
    aboutBio:
      resident.aboutBio ||
      resident.careProfile?.specialRequirements ||
      (resident.careProfile
        ? `Care Category: ${resident.careProfile.careCategory || "General Care"}. Primary Care Need: ${resident.careProfile.primaryCareNeed || "Assisted Living"}.`
        : `Profile setup incomplete for ${resident.fullName}. Click "Complete Profile" to update care & medical details.`),
    firstName:
      resident.profile?.firstName ||
      (resident.fullName ? parseNameParts(resident.fullName).firstName : ""),
    middleName:
      resident.profile?.middleName ||
      (resident.fullName ? parseNameParts(resident.fullName).middleName : ""),
    lastName:
      resident.profile?.lastName ||
      (resident.fullName ? parseNameParts(resident.fullName).lastName : ""),
    addressLine1: resident.profile?.addressLine1 || "",
    city: resident.profile?.city || "",
    country: resident.profile?.country || resident.nationality || "",
    phoneNumber: resident.profile?.phoneNumber || resident.phoneNumber || "",
    religion: resident.profile?.religion || "",
    email: resident.email || "",
    nhsNumber: resident.nhsNumber || "",
    dob: resident.dob ? resident.dob.split("T")[0] : "",
    admissionDate: resident.admissionDate
      ? resident.admissionDate.split("T")[0]
      : (resident.admission?.admissionDate
        ? resident.admission.admissionDate.split("T")[0]
        : ""),
    preferredLanguage: resident.profile?.preferredLanguage || "English",
    nokFirstName:
      resident.nextOfKin?.[0]?.firstName ||
      (resident.nextOfKin?.[0]?.name
        ? parseNameParts(resident.nextOfKin[0].name).firstName
        : ""),
    nokMiddleName:
      resident.nextOfKin?.[0]?.middleName ||
      (resident.nextOfKin?.[0]?.name
        ? parseNameParts(resident.nextOfKin[0].name).middleName
        : ""),
    nokLastName:
      resident.nextOfKin?.[0]?.lastName ||
      (resident.nextOfKin?.[0]?.name
        ? parseNameParts(resident.nextOfKin[0].name).lastName
        : ""),
    nokName: resident.nextOfKin?.[0]?.name || "",
    nokPhone: resident.nextOfKin?.[0]?.phone || "",
    nokRelation:
      resident.nextOfKin?.[0]?.relation ||
      resident.nextOfKin?.[0]?.relationship ||
      "",
    secondaryNokFirstName:
      resident.nextOfKin?.[1]?.firstName ||
      (resident.nextOfKin?.[1]?.name
        ? parseNameParts(resident.nextOfKin[1].name).firstName
        : ""),
    secondaryNokMiddleName:
      resident.nextOfKin?.[1]?.middleName ||
      (resident.nextOfKin?.[1]?.name
        ? parseNameParts(resident.nextOfKin[1].name).middleName
        : ""),
    secondaryNokLastName:
      resident.nextOfKin?.[1]?.lastName ||
      (resident.nextOfKin?.[1]?.name
        ? parseNameParts(resident.nextOfKin[1].name).lastName
        : ""),
    secondaryNokName: resident.nextOfKin?.[1]?.name || "",
    secondaryNokPhone: resident.nextOfKin?.[1]?.phone || "",
    secondaryNokRelation:
      resident.nextOfKin?.[1]?.relation ||
      resident.nextOfKin?.[1]?.relationship ||
      "",
    gpName: resident.gpDetails?.name || resident.gpDetails?.gpName || "",
    gpPractice:
      resident.gpDetails?.practice || resident.gpDetails?.surgeryName || "",
    gpPhone: resident.gpDetails?.phone || "",
    fundingType:
      resident.admission?.primaryPaymentMethod ||
      resident.fundingType ||
      "",
    localAuthority: resident.admission?.localAuthority || "",
    payer: resident.admission?.payer || "",
    otherProviders: Array.isArray(resident.admission?.otherProviders)
      ? resident.admission.otherProviders
      : Array.isArray(resident.careProfile?.otherProviders)
        ? resident.careProfile.otherProviders
        : [],
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSection, setEditSection] = useState<EditSection>("personal");

  const [formState, setFormState] = useState<OverviewFormData>({ ...data });

  const handleOpenEdit = (section: EditSection) => {
    setEditSection(section);
    if (section === "nok") {
      const parsed = parseNameParts(data.nokName);
      setFormState({
        ...data,
        nokFirstName: data.nokFirstName || parsed.firstName,
        nokMiddleName: data.nokMiddleName || parsed.middleName,
        nokLastName: data.nokLastName || parsed.lastName,
      });
    } else if (section === "funding") {
      setFormState({
        ...data,
        fundingType:
          data.fundingType ||
          resident.admission?.primaryPaymentMethod ||
          resident.fundingType ||
          "",
        localAuthority:
          data.localAuthority ||
          resident.admission?.localAuthority ||
          "",
        payer:
          data.payer ||
          resident.admission?.payer ||
          "",
      });
    } else {
      setFormState({ ...data });
    }
    setEditModalOpen(true);
  };

  const formatDOB = (dobString?: string) => {
    if (!dobString) return "Not provided";
    try {
      return new Date(dobString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dobString;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* LEFT / MAIN COLUMN (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* 1. Personal Information Card */}
        <OverviewPersonalCard
          resident={resident}
          data={data}
          isAdmin={isAdmin}
          onEdit={() => handleOpenEdit("personal")}
          formatDOB={formatDOB}
        />

        {/* 2. Emergency Contacts & Legal Representatives Card */}
        <OverviewContactsCard
          resident={resident}
          data={data}
          isAdmin={isAdmin}
          onEditNok={() => handleOpenEdit("nok")}
          onEditGp={() => handleOpenEdit("gp")}
        />

        {/* 3. GP & Allied Care Providers Card */}
        <OverviewCareProvidersCard
          resident={resident}
          data={data}
          isAdmin={isAdmin}
          onEditGp={() => handleOpenEdit("gp")}
        />

        {/* 4. Medical Profile & Baseline Health Card */}
        <OverviewMedicalCard resident={resident} />

        {/* 5. Financial & Billing Card */}
        {isAdmin && (
          <OverviewFinancialCard
            resident={resident}
            data={data}
            isAdmin={isAdmin}
            onEdit={() => handleOpenEdit("funding")}
          />
        )}
      </div>

      {/* RIGHT COLUMN (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* 1. NEWS2 Score & Last Collected Vitals Card */}
        {(() => {
          const latestObs = resident.observations?.[0];
          const score = latestObs?.news2Score ?? 0;
          const criticalLevelText =
            score === 0
              ? "0 - Normal"
              : score <= 4
                ? `${score} - Low Risk`
                : score <= 6
                  ? `${score} - Medium Risk`
                  : `${score} - High Risk / Critical`;

          const monitoringText =
            score === 0
              ? "Minimum 12-hourly monitoring"
              : score <= 4
                ? "12-hourly clinical monitoring"
                : score <= 6
                  ? "Minimum 4-hourly monitoring"
                  : "Continuous monitoring & Emergency response";

          return (
            <Card className="bg-surface-card-grey border-none rounded-2xl p-6 lg:p-8 space-y-4 shadow-none font-sans">
              <div className="flex items-center justify-between border-b border-border-secondary/80 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-emerald-800" />
                  <Text as="h3" size="base" weight="semibold" className="text-slate-900">
                    NEWS2 Score &amp; Latest Vitals
                  </Text>
                </div>
                {latestObs?.timestamp && (
                  <Text size="sm" weight="regular" className="text-slate-500">
                    {new Date(latestObs.timestamp).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                )}
              </div>

              {/* Large Score + Critical Risk Badge */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <Text size="sm" weight="medium" className="text-slate-500 tracking-wider">
                    NEWS2 Clinical Score
                  </Text>
                  <Text size="4xl" weight="bold" className="text-slate-900 tracking-tight leading-none mt-1">
                    {score}
                  </Text>
                </div>
                <div className="text-right space-y-1">
                  <Badge
                    variant={score === 0 ? "outline" : score <= 4 ? "secondary" : score <= 6 ? "secondary" : "destructive"}
                    className={cn(
                      "px-3 py-1 font-bold text-md shadow-xs",
                      score === 0
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : score <= 4
                          ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                          : score <= 6
                            ? "border-amber-300 bg-amber-100 text-amber-900"
                            : "border-red-300 bg-red-600 text-white"
                    )}
                  >
                    {criticalLevelText}
                  </Badge>
                  <Text size="sm" weight="regular" className="text-slate-500 block">
                    {monitoringText}
                  </Text>
                </div>
              </div>

              {/* Last Collected Vitals Display */}
              {latestObs ? (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                  <div>
                    <Text size="sm" weight="medium" className="text-slate-500">Temp</Text>
                    <Text size="md" weight="bold" className="text-slate-900">
                      {latestObs.temp ? `${latestObs.temp}°C` : "—"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" weight="medium" className="text-slate-500">Pulse</Text>
                    <Text size="md" weight="bold" className="text-slate-900">
                      {latestObs.pulse ? `${latestObs.pulse} bpm` : "—"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" weight="medium" className="text-slate-500">BP</Text>
                    <Text size="md" weight="bold" className="text-slate-900">
                      {latestObs.bpSystolic ? `${latestObs.bpSystolic}/${latestObs.bpDiastolic || "?"}` : "—"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" weight="medium" className="text-slate-500">SpO2</Text>
                    <Text size="md" weight="bold" className="text-slate-900">
                      {latestObs.spo2 ? `${latestObs.spo2}%` : "—"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" weight="medium" className="text-slate-500">Respiration</Text>
                    <Text size="md" weight="bold" className="text-slate-900">
                      {latestObs.respiration ? `${latestObs.respiration} rpm` : "—"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" weight="medium" className="text-slate-500">Consciousness</Text>
                    <Text size="md" weight="bold" className="text-slate-900">
                      {latestObs.consciousness || "Alert"}
                    </Text>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                  <Text size="sm" weight="regular" className="text-slate-500 italic">
                    No observations recorded yet.
                  </Text>
                </div>
              )}

              {/* Dynamic 10-Segment Critical Level Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-md font-medium text-slate-500">
                  <span>Actual Critical Scale</span>
                  <span className="font-bold text-slate-900">
                    {score === 0
                      ? "Level 0 (Normal)"
                      : score <= 4
                        ? `Level ${score} (Low Risk)`
                        : score <= 6
                          ? `Level ${score} (Medium Risk)`
                          : `Level ${score} (High Risk / Critical)`}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const segScore = idx + 1;
                    const isActive = score >= segScore;

                    let activeColor = "bg-emerald-500";
                    if (score >= 7) {
                      activeColor = "bg-red-600";
                    } else if (score >= 5) {
                      activeColor = "bg-amber-500";
                    }

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "h-2 flex-1 rounded-full transition-all duration-300",
                          isActive ? activeColor : "bg-slate-200"
                        )}
                        title={`Segment ${segScore}: ${segScore <= 4 ? "Low Risk" : segScore <= 6 ? "Medium Risk" : "High Risk / Critical"}`}
                      />
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })()}

        {/* 2. Alerts & Important Flags Card */}
        <Card className="bg-surface-card-grey border-none rounded-2xl p-6 lg:p-8 space-y-4 shadow-none font-sans">
          <div className="flex items-center justify-between border-b border-border-secondary/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              <Text as="h3" size="base" weight="semibold" className="text-slate-900">
                Alerts &amp; Important Flags
              </Text>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {resident.dnarStatus && (
              <Badge variant="secondary" state="warning" className="px-2.5 py-0.5 shadow-none font-semibold">
                DNACPR
              </Badge>
            )}
            {resident.careProfile?.medicationAllergies?.map((allergy: string, i: number) => (
              <Badge key={`med-${i}`} variant="secondary" state="danger" className="px-2.5 py-0.5 shadow-none font-medium">
                Med Allergy: {allergy}
              </Badge>
            ))}
            {resident.careProfile?.foodAllergies?.map((allergy: string, i: number) => (
              <Badge key={`food-${i}`} variant="secondary" state="warning" className="px-2.5 py-0.5 shadow-none font-medium">
                Food Allergy: {allergy}
              </Badge>
            ))}
            {resident.careProfile?.chronicConditions?.map((cond: string, i: number) => (
              <Badge key={`cond-${i}`} variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none font-medium">
                {cond}
              </Badge>
            ))}
            {!resident.dnarStatus &&
              (!resident.careProfile?.medicationAllergies || resident.careProfile.medicationAllergies.length === 0) &&
              (!resident.careProfile?.chronicConditions || resident.careProfile.chronicConditions.length === 0) && (
                <Text size="sm" weight="regular" className="text-slate-500 italic">
                  No active risk alerts
                </Text>
              )}
          </div>
        </Card>

        {/* 3. Recent Care Activities */}
        <Card className="bg-surface-card-grey border-none rounded-2xl p-6 lg:p-8 space-y-4 shadow-none font-sans">
          <div className="flex items-center justify-between border-b border-border-secondary/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-emerald-800" />
              <Text as="h3" size="base" weight="semibold" className="text-slate-900">
                Recent Care Activities
              </Text>
            </div>
          </div>

          {Array.isArray(resident.careTimelines) && resident.careTimelines.length > 0 ? (
            <div className="space-y-4">
              {resident.careTimelines.slice(0, 4).map((event: any, i: number) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="size-7 rounded-full bg-emerald-100 text-[#3D5C57] flex items-center justify-center shrink-0 mt-0.5">
                      <Plus className="size-3.5" />
                    </div>
                    <div>
                      <Text as="h4" size="sm" weight="medium" className="text-[#141F1E]">
                        {event.eventType?.replace(/_/g, " ") || "Care Event"}
                      </Text>
                      <Text size="sm" weight="regular" className="text-[#5D5D5D] leading-[16px]">
                        {event.summary || "No description"}
                      </Text>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Text size="sm" weight="regular" className="text-[#5D5D5D]">
                      {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : ""}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No recent care activity"
              description="Care activity will appear here as they are recorded."
              className="py-6"
            />
          )}
        </Card>
      </div>

      {/* EDIT POPUP DIALOG FOR NON-GP SECTIONS */}
      <EditResidentOverviewModal
        open={editModalOpen && editSection !== "gp"}
        onOpenChange={setEditModalOpen}
        editSection={editSection}
        residentId={resident.id}
        residentFullName={resident.fullName || "Resident"}
        formState={formState}
        setFormState={setFormState}
        onSaved={(updated) => setData((prev) => ({ ...prev, ...updated }))}
      />

      {/* EDIT CARE PROVIDERS & GP MODAL */}
      <EditCareProvidersModal
        open={editModalOpen && editSection === "gp"}
        onOpenChange={(open) => {
          if (!open) setEditModalOpen(false);
        }}
        residentId={resident.id}
        residentName={resident.fullName || "Resident"}
        initialData={{
          gpName: data.gpName,
          gpPractice: data.gpPractice,
          gpPhone: data.gpPhone,
          otherProviders: data.otherProviders,
        }}
        onSuccess={(updated) => {
          setData((prev) => ({
            ...prev,
            ...updated,
          }));
          setEditModalOpen(false);
        }}
      />
    </div>
  );
}
