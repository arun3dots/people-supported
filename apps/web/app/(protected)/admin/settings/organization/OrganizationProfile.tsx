"use client";

import { useGetOrganizationProfileQuery } from "../../../../../lib/queries/organization/useGetOrganizationProfileQuery";
import { useState } from "react";
import {
  Skeleton,
  Text,
  Card,
  Button,
} from "@repo/ui/components/ui";
import { Edit } from "lucide-react";
import { GeneralInformationSection } from "./components/GeneralInformationSection";
import { PrimaryContactSection } from "./components/PrimaryContactSection";
import { LocationAddressSection } from "./components/LocationAddressSection";
import { OrgBrandingCard } from "./components/OrgBrandingCard";
import { OrgSummaryCard } from "./components/OrgSummaryCard";
import { OrgDocumentsCard } from "./components/OrgDocumentsCard";
import { OrganizationEditForm } from "./components/OrganizationEditForm";

export function OrganizationProfile() {
  const { data: profile, isLoading: isFetching } =
    useGetOrganizationProfileQuery();
  const [orgEditOpen, setOrgEditOpen] = useState(false);
  const [orgEditMode, setOrgEditMode] = useState<
    "general" | "contact" | "location" | "all"
  >("all");

  if (isFetching) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><Skeleton className="h-64 w-full rounded-xl" /></Card>
            <Card><Skeleton className="h-48 w-full rounded-xl" /></Card>
          </div>
          <div className="space-y-6">
            <Card><Skeleton className="h-48 w-full rounded-xl" /></Card>
            <Card><Skeleton className="h-28 w-full rounded-xl" /></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <Text size={'xl'} weight={'bold'}>
            Organisational Profile
          </Text>
          <Text size={'md'} weight={'regular'} className="text-slate-500">
            Manage your care home&apos;s identity, contact information, and physical address
          </Text>
        </div>


      </div>

      {/* ═══ Two-Column Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ──── LEFT COLUMN (span-2) ──── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="w-full h-full flex flex-col gap-[30px] sm:gap-[36px]">
            {/* ─── 1. General Information ─── */}
            <GeneralInformationSection
              profile={profile}
              onEditClick={() => {
                setOrgEditMode("general");
                setOrgEditOpen(true);
              }}
            />

            {/* ─── 2. Primary Contact ─── */}
            <PrimaryContactSection
              profile={profile}
              onEditClick={() => {
                setOrgEditMode("contact");
                setOrgEditOpen(true);
              }}
            />

            {/* ─── 3. Location & Address ─── */}
            <LocationAddressSection
              profile={profile}
              onEditClick={() => {
                setOrgEditMode("location");
                setOrgEditOpen(true);
              }}
            />
          </Card>
        </div>

        {/* ──── RIGHT COLUMN (span-1) ──── */}
        <div className="space-y-6">
          {/* ─── Branding ─── */}
          <OrgBrandingCard initialLogoUrl={profile?.logoUrl || ""} />

          {/* ─── Organization Summary ─── */}
          <OrgSummaryCard
            id={profile?.id}
            createdAt={profile?.createdAt}
            status={profile?.status ?? null}
          />

          {/* ─── Documents ─── */}
          <OrgDocumentsCard />
        </div>
      </div>

      {/* ═══ Edit Form Modal ═══ */}
      <OrganizationEditForm
        profile={profile}
        open={orgEditOpen}
        onOpenChange={setOrgEditOpen}
        mode={orgEditMode}
      />
    </div>
  );
}
