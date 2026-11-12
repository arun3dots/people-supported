"use client";

import React from "react";
import Link from "next/link";
import {
  Bed,
  Building2,
  Layers,
  User,
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
import { useGetRiskAssessmentsQuery } from "../../../../../../lib/queries/risk";
import { useGetPreAdmissionQuery } from "../../../../../../lib/queries/pre-admission";
import {
  useGetSchemesQuery,
  useGetPropertiesQuery,
  useGetRoomsQuery,
} from "../../../../../../lib/queries/facility";
import { type Resident } from "../../../../../../lib/types/resident";
import {
  TABS,
  ResidentHeroData,
  getInitials,
  resolveHeroLocation,
  resolveHeroMetadata,
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

interface HeroMetaItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  className?: string;
}

function HeroMetaItem({ icon, label, value, href, className }: HeroMetaItemProps) {
  return (
    <div className={cn("flex items-center justify-center sm:justify-start gap-3 py-2 sm:py-0", className)}>
      <div className="size-9 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <Text size="md" variant="subdued" className="leading-snug">
          {label}
        </Text>
        {href ? (
          <Link
            href={href}
            className="block text-md font-semibold text-slate-900 hover:text-primary hover:underline leading-snug truncate"
          >
            {value}
          </Link>
        ) : (
          <Text size="md" weight="semibold" className="text-slate-900 leading-snug truncate">
            {value}
          </Text>
        )}
      </div>
    </div>
  );
}

export function ResidentHeroBanner({
  resident,
  activeTab,
  onTabChange,
}: ResidentHeroBannerProps) {
  const { data: riskAssessments } = useGetRiskAssessmentsQuery(
    { residentId: resident.id },
    { enabled: Boolean(resident.id) },
  );
  const { data: preAdmission } = useGetPreAdmissionQuery(resident.id ?? "", {
    retry: false,
  });
  const { data: schemes = [] } = useGetSchemesQuery();
  const { data: properties = [] } = useGetPropertiesQuery();
  const { data: rooms = [] } = useGetRoomsQuery();

  const {
    hasDnacpr,
    uniqueHighRiskBadges,
    severityLevel,
    severityBadgeClass,
    subtitleItems,
    allergyList,
    hasNoKnownAllergies,
    keyworkerName,
  } = resolveHeroMetadata(resident, riskAssessments, preAdmission?.partC);

  const location = resolveHeroLocation({
    resident,
    preAdmissionRoom: preAdmission?.roomAllocation,
    schemes,
    properties,
    rooms,
  });

  const propertyDisplayValue = location.propertyName
    ? location.roomLabel
      ? `${location.propertyName} (${location.roomLabel})`
      : location.propertyName
    : location.roomLabel || "Unassigned";

  return (
    <>
      <Card variant="surface" className="p-6 gap-5 font-sans">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Left: Square Rounded Photo */}
          <Avatar className="size-32 sm:size-36 shrink-0 rounded-2xl border border-slate-200/80 shadow-xs">
            {resident.photoUrl && (
              <AvatarImage
                src={resident.photoUrl}
                alt={resident.fullName}
                className="object-cover size-full rounded-2xl"
              />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-3xl rounded-2xl size-full">
              {getInitials(resident.fullName)}
            </AvatarFallback>
          </Avatar>

          {/* Right: Name, Metadata, Scheme/Property/Keyworker & Risk Badges */}
          <div className="flex-1 min-w-0 flex flex-col space-y-3 text-center sm:text-left">
            {/* Name + Status Pill */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Text
                as="h2"
                size="xl"
                weight="semibold"
                className="text-slate-900 tracking-tight"
              >
                {resident.fullName}
              </Text>

              <Badge
                variant={resident.status === "Active" ? "success" : "secondary"}
                state={
                  resident.status === "Active"
                    ? undefined
                    : resident.status === "Draft" || resident.isDraft
                      ? "warning"
                      : "inactive"
                }
                className="px-3 py-0.5 shadow-none font-semibold"
              >
                {resident.status === "Draft"
                  ? "In referral"
                  : resident.status || "Active"}
              </Badge>
            </div>

            {/* Pipe-separated personal metadata */}
            {subtitleItems.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                {subtitleItems.map((item, index) => (
                  <React.Fragment key={item}>
                    {index > 0 && (
                      <span aria-hidden="true" className="text-slate-300 select-none">
                        |
                      </span>
                    )}
                    <Text as="span" size="md" variant="subdued">
                      {item}
                    </Text>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Scheme / Property (or Room & Bed fallback) & Keyworker Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 pt-1">
              {location.hasSchemeOrProperty ? (
                <>
                  <HeroMetaItem
                    icon={<Layers className="size-4" />}
                    label="Scheme"
                    value={location.schemeName || "Unassigned"}
                    className="sm:pr-5"
                  />
                  <HeroMetaItem
                    icon={<Building2 className="size-4" />}
                    label="Property"
                    value={propertyDisplayValue}
                    href={
                      location.propertyId
                        ? `/admin/configuration/facility/properties?propertyId=${location.propertyId}`
                        : undefined
                    }
                    className="sm:px-5"
                  />
                </>
              ) : (
                <>
                  <HeroMetaItem
                    icon={<Building2 className="size-4" />}
                    label="Room & Wing"
                    value={location.roomLabel || "Unassigned"}
                    className="sm:pr-5"
                  />
                  <HeroMetaItem
                    icon={<Bed className="size-4" />}
                    label="Bed Number"
                    value={location.bedLabel || "Unassigned"}
                    className="sm:px-5"
                  />
                </>
              )}

              <HeroMetaItem
                icon={<User className="size-4" />}
                label="Keyworker"
                value={keyworkerName}
                className="sm:pl-5"
              />
            </div>

            {/* Alert Badges: Severity, DNACPR & Allergies */}
            {(severityLevel || hasDnacpr || allergyList.length > 0 || hasNoKnownAllergies) && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {severityLevel && (
                  <Badge
                    className={cn(
                      "px-3 py-1 rounded-full font-semibold shadow-none",
                      severityBadgeClass,
                    )}
                  >
                    Severity: {severityLevel}
                  </Badge>
                )}
                {hasDnacpr && (
                  <Badge className="px-3 py-1 rounded-full font-semibold shadow-none border-transparent bg-rose-600 text-white">
                    DNACPR
                  </Badge>
                )}
                {allergyList.map((allergy, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    state="danger"
                    className="px-3 py-1 rounded-full font-medium shadow-none"
                  >
                    Allergy: {allergy}
                  </Badge>
                ))}
                {hasNoKnownAllergies && (
                  <Badge
                    variant="secondary"
                    state="inactive"
                    className="px-3 py-1 rounded-full font-medium shadow-none"
                  >
                    No known allergies
                  </Badge>
                )}
              </div>
            )}

            {/* Active High / Extreme Risk Assessment Pills */}
            {uniqueHighRiskBadges.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {uniqueHighRiskBadges.map((risk) => (
                  <Badge
                    key={risk.id}
                    className="px-3 py-1 rounded-full font-semibold shadow-none border-transparent bg-red-700 text-white"
                  >
                    {risk.label}: {risk.level}
                  </Badge>
                ))}
              </div>
            )}
          </div>
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
