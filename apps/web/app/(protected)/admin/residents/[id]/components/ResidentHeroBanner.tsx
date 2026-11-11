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
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 gap-5 shadow-xs font-sans">
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
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl rounded-full size-full">
                {getInitials(resident.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <Text
                  as="h2"
                  size="2xl"
                  weight="bold"
                  className="text-slate-900"
                >
                  {resident.fullName}
                </Text>

                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 font-semibold text-md rounded-full",
                    resident.status === "Active"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : resident.status === "Draft" || resident.isDraft
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-slate-50 text-slate-800",
                  )}
                >
                  {resident.status === "Draft"
                    ? "In referral"
                    : resident.status || "Active"}
                </Badge>

                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-md font-semibold border",
                    riskLevel === "High"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : riskLevel === "Low"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200",
                  )}
                >
                  {riskLevel} risk
                </span>
              </div>

              {/* Row 1: Ref, DOB, Age, NHS */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-md font-medium text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <CreditCard className="size-3.5 text-slate-400" />
                  Ref: <strong className="text-slate-800">{refCode}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5 text-slate-400" />
                  DOB: <strong className="text-slate-800">{dobFormatted}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <User className="size-3.5 text-slate-400" />
                  Age:{" "}
                  <strong className="text-slate-800">{ageVal ?? 41}</strong>
                </span>
                <span>
                  NHS{" "}
                  <strong className="text-slate-800">
                    {resident.nhsNumber ||
                      resident.profile?.nationalId ||
                      "485 777 3456"}
                  </strong>
                </span>
              </div>

              {/* Row 2: Key worker · support hrs/wk · Funded by */}
              <div className="text-md text-slate-500">
                Key worker{" "}
                <strong className="text-slate-800">
                  {resident.keyworker?.fullName || "Deborah Lee"}
                </strong>{" "}
                · {supportHours} support hrs/wk · Funded by {fundedBy}
              </div>

              {(hasDnacpr || allergyList.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {hasDnacpr && (
                    <span className="border border-rose-700 bg-rose-600 text-white rounded-md px-2 py-0.5 text-md font-semibold">
                      DNACPR
                    </span>
                  )}
                  {allergyList.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="border border-red-200 bg-red-50 text-red-800 rounded-md px-2 py-0.5 text-md font-medium"
                    >
                      Allergy: {allergy}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Property / Scheme Box */}
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 min-w-64 shrink-0">
            <p className="text-md font-bold text-slate-600 mb-1.5">
              Property / Scheme
            </p>
            <div className="flex items-start gap-2.5">
              <div className="size-8 rounded-xl bg-white border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Building2 className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-md font-semibold text-slate-900 leading-tight">
                  {propertyName}
                </p>
                <p className="text-md text-slate-600">
                  {roomNum} · {schemeName}
                </p>
                <Link
                  href={
                    propertyId
                      ? `/admin/configuration/facility?tab=properties&propertyId=${propertyId}`
                      : "/admin/configuration/facility?tab=properties"
                  }
                  className="inline-flex items-center gap-1 text-md font-semibold text-primary hover:underline pt-0.5"
                >
                  <span>View property</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {(resident.isDraft || resident.status === "Draft") && (
          <AdmissionProgressCard resident={resident as unknown as Resident} />
        )}
      </Card>

      {/* Pill-style Navigation Tabs matching Screenshots 2-5 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs">
        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
          className="w-full overflow-x-auto"
        >
          <TabsList className="bg-transparent h-auto p-0 gap-1.5 w-full justify-start min-w-max">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="px-4 py-2 text-md font-medium rounded-xl transition-all cursor-pointer border-0 text-slate-600 hover:text-slate-900 hover:bg-slate-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs"
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
