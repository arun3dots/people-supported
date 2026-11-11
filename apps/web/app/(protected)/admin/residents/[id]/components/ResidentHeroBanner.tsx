"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Building2,
  Calendar,
  User,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { AdmissionProgressCard } from "./AdmissionProgressCard";
import {
  useGetRiskAssessmentsQuery,
  type RiskAssessmentResponse,
} from "../../../../../../lib/queries/risk";
import { type Resident } from "../../../../../../lib/types/resident";
import {
  TABS,
  ResidentHeroData,
  getInitials,
  calculateAge,
  getAllergiesList,
} from "./ResidentHeroBanner.utils";

interface ResidentHeroBannerProps {
  resident: ResidentHeroData;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onEditClick?: () => void;
  onExportClick?: () => void;
  onDischargeClick?: () => void;
  carePlanSummary?: {
    total: number;
    agreed: number;
    nextReviewDate: string | null;
  };
}

export function ResidentHeroBanner({
  resident,
  activeTab,
  onTabChange,
}: ResidentHeroBannerProps) {
  const hasDnacpr = Boolean(
    resident.dnarStatus ||
      resident.dnacprStatus ||
      resident.admission?.dnarStatus ||
      (typeof resident.consent?.dnarStatus === "string" &&
        resident.consent.dnarStatus.toLowerCase() === "dnr"),
  );

  const { data: riskAssessments } = useGetRiskAssessmentsQuery({
    residentId: resident.id,
  });
  const activeHighRisks = (riskAssessments || []).filter(
    (ra: RiskAssessmentResponse) => {
      const lvl = ra.residualLevel || ra.inherentLevel;
      return (lvl === "High" || lvl === "Extreme") && ra.status !== "Archived";
    },
  );

  const sl = resident.supportedLivingDetails ?? {};
  const riskLevel =
    sl.riskLevel ||
    (activeHighRisks.length > 0
      ? "High"
      : resident.careProfile?.careComplexity === "Low"
        ? "Low"
        : "Medium");

  const refCode =
    sl.referenceCode || `SL-${(resident.id || "00125").slice(0, 5).toUpperCase()}`;
  const dobFormatted = (() => {
    if (!resident.dob) return "N/A";
    const d = new Date(resident.dob);
    return isNaN(d.getTime()) ? resident.dob : format(d, "dd/MM/yyyy");
  })();
  const ageVal = calculateAge(resident.dob);
  const supportHours = sl.supportHoursPerWeek ?? 28;
  const fundedBy =
    resident.admission?.localAuthority ||
    resident.admission?.payer ||
    resident.fundingType ||
    "North Yorkshire Council";

  const propertyId = resident.bed?.room?.wing?.id;
  const propertyName =
    resident.bed?.wingName ||
    resident.bed?.room?.wing?.name ||
    "Oak House";
  const roomNum = resident.bed?.room?.roomNumber
    ? /^(flat|room)\b/i.test(resident.bed.room.roomNumber.trim())
      ? resident.bed.room.roomNumber.trim()
      : `Flat ${resident.bed.room.roomNumber.trim()}`
    : "Flat 1";
  const schemeName =
    resident.bed?.room?.wing?.scheme?.name ||
    "North Yorkshire Supported Living";

  const allergyList = getAllergiesList(resident);

  return (
    <>
      <Card variant="surface" className="p-6 gap-5 font-sans">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Avatar + Name + Supported Living Metadata */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <Avatar className="size-20 sm:size-24 shrink-0 rounded-full border-2 border-primary/20 shadow-xs">
              {resident.photoUrl && (
                <AvatarImage
                  src={resident.photoUrl}
                  alt={resident.fullName}
                  className="object-cover size-full rounded-full"
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-2xl rounded-full size-full">
                {getInitials(resident.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <Text
                  as="h2"
                  size="xl"
                  weight="semibold"
                  className="text-slate-900 tracking-tight"
                >
                  {resident.fullName}
                </Text>

                <Badge
                  variant="secondary"
                  state={
                    resident.status === "Active"
                      ? "success"
                      : resident.status === "Draft" || resident.isDraft
                        ? "warning"
                        : "inactive"
                  }
                  className="px-2.5 py-0.5 shadow-none"
                >
                  {resident.status === "Draft"
                    ? "In referral"
                    : resident.status || "Active"}
                </Badge>

                <Badge
                  variant="secondary"
                  state={
                    riskLevel === "High"
                      ? "danger"
                      : riskLevel === "Low"
                        ? "success"
                        : "warning"
                  }
                  className="px-2.5 py-0.5 shadow-none"
                >
                  {riskLevel} risk
                </Badge>
              </div>

              {/* Row 1: Ref, DOB, Age, NHS */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                <Text size="sm" variant="subdued" className="inline-flex items-center gap-1">
                  <CreditCard className="size-3.5 text-slate-400" />
                  Ref:{" "}
                  <Text as="span" size="sm" weight="medium" className="text-slate-800">
                    {refCode}
                  </Text>
                </Text>
                <Text size="sm" variant="subdued" className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5 text-slate-400" />
                  DOB:{" "}
                  <Text as="span" size="sm" weight="medium" className="text-slate-800">
                    {dobFormatted}
                  </Text>
                </Text>
                <Text size="sm" variant="subdued" className="inline-flex items-center gap-1">
                  <User className="size-3.5 text-slate-400" />
                  Age:{" "}
                  <Text as="span" size="sm" weight="medium" className="text-slate-800">
                    {ageVal ?? 41}
                  </Text>
                </Text>
                <Text size="sm" variant="subdued">
                  NHS{" "}
                  <Text as="span" size="sm" weight="medium" className="text-slate-800">
                    {resident.nhsNumber ||
                      resident.profile?.nationalId ||
                      "485 777 3456"}
                  </Text>
                </Text>
              </div>

              {/* Row 2: Key worker · support hrs/wk · Funded by */}
              <Text size="sm" variant="subdued">
                Key worker{" "}
                <Text as="span" size="sm" weight="medium" className="text-slate-800">
                  {resident.keyworker?.fullName || "Deborah Lee"}
                </Text>{" "}
                · {supportHours} support hrs/wk · Funded by {fundedBy}
              </Text>

              {(hasDnacpr || allergyList.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {hasDnacpr && (
                    <Badge variant="destructive" className="px-2.5 py-0.5 shadow-none">
                      DNACPR
                    </Badge>
                  )}
                  {allergyList.map((allergy, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      state="danger"
                      className="px-2.5 py-0.5 shadow-none"
                    >
                      Allergy: {allergy}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Property / Scheme Box */}
          <Card variant="white" border="secondary" className="p-4 min-w-64 shrink-0 gap-2">
            <Text size="sm" weight="medium" variant="subdued">
              Property / Scheme
            </Text>
            <div className="flex items-start gap-2.5">
              <div className="size-8 rounded-xl bg-surface-primary-light border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Building2 className="size-4" />
              </div>
              <div className="space-y-1">
                <Text size="md" weight="medium" className="text-slate-900 leading-tight">
                  {propertyName}
                </Text>
                <Text size="sm" variant="subdued">
                  {roomNum} · {schemeName}
                </Text>
                <Link
                  href={
                    propertyId
                      ? `/admin/configuration/facility?tab=properties&propertyId=${propertyId}`
                      : "/admin/configuration/facility?tab=properties"
                  }
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline pt-0.5"
                >
                  <span>View property</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {(resident.isDraft || resident.status === "Draft") && (
          <AdmissionProgressCard resident={resident as unknown as Resident} />
        )}
      </Card>

      {/* Clean Underline Tabs matching Staff Profile & @repo/ui Tabs */}
      <div className="w-full border-b border-slate-200/80">
        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
          className="w-full overflow-x-auto"
        >
          <TabsList className="bg-transparent h-auto p-0 gap-6 rounded-none border-b-0 w-full justify-start min-w-max">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary-800 data-[state=active]:text-primary-900 data-[state=active]:font-medium rounded-none bg-transparent px-0 pb-3 text-md font-normal text-slate-500 hover:text-slate-900 border-b-2 border-transparent -mb-px shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  );
}
