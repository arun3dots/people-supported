"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useGetMyProfileQuery } from "../../../../lib/queries/profile/useMyProfileQueries";
import { useAuth } from "../../../../lib/context/AuthContext";
import { Text } from "@repo/ui/components/ui/Text";
import { ProfileContactDialog } from "./ProfileContactDialog";
import { ProfileHeaderCard } from "./ProfileHeaderCard";
import { ProfilePersonalTab } from "./ProfilePersonalTab";
import { ProfileNotificationPreferences } from "./ProfileNotificationPreferences";
import { ProfilePreferencesCard } from "./ProfilePreferencesCard";
import { ProfileAccessibilityCard } from "./ProfileAccessibilityCard";
import { ProfileRecentActivity } from "./ProfileRecentActivity";
import { ProfileSecurityTab } from "./ProfileSecurityTab";
import { ProfileAccountDetails } from "./ProfileAccountDetails";
import { ProfileQuickLinks } from "./ProfileQuickLinks";
import { ProfileActionBar } from "./ProfileActionBar";

export function MyProfileClient() {
  const { data: profile, isLoading } = useGetMyProfileQuery();
  const { user } = useAuth();
  const router = useRouter();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="animate-spin size-10 border-4 border-emerald-800 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center space-y-2">
        <Text size={'xl'} weight={'bold'}>Profile unavailable</Text>
        <Text size={'md'} weight={'regular'} className="text-slate-500">
          We couldn&apos;t load your profile. Please try again later.
        </Text>
      </div>
    );
  }

  const roleName = profile.role?.name || user?.roleName || "Staff";
  const canViewAuditLog =
    !!user?.roleName &&
    ["ADMIN", "SUPERADMIN", "MANAGER"].includes(user.roleName.toUpperCase());

  return (
    <div className="space-y-6 pb-24 font-sans">
      {/* ═══ Page Title ═══ */}
      <div>
        <Text size="xl" weight="bold" className="tracking-tight">
          Profile Settings
        </Text>
        <Text variant="subdued" size="md" weight="regular">
          Manage your personal account, security and preferences.
        </Text>
      </div>

      {/* ═══ Teal Header Banner ═══ */}
      <ProfileHeaderCard
        fullName={profile.fullName}
        roleName={roleName}
        email={profile.email}
        department={profile.department}
        photoUrl={profile.profilePhotoUrl}
      />

      {/* ═══ Two-Column Grid (Items-stretch so both columns match height) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ──── LEFT COLUMN (span-2) ──── */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <ProfilePersonalTab
            fullName={profile.fullName}
            roleName={roleName}
            email={profile.email}
            department={profile.department}
            preferredLanguage={profile.preferredLanguage}
            phoneNumber={profile.phoneNumber}
            addressLine1={profile.addressLine1}
            addressLine2={profile.addressLine2}
            city={profile.city}
            postcode={profile.postcode}
            startDate={profile.startDate}
            isActive={profile.isActive}
            onEdit={() => setContactDialogOpen(true)}
          />

          <ProfileRecentActivity
            userId={profile.id}
            onViewAll={
              canViewAuditLog
                ? () => router.push("/admin/audit-log")
                : undefined
            }
          />
        </div>

        {/* ──── RIGHT COLUMN (span-1: Full Height Flex Container) ──── */}
        <div className="space-y-6 flex flex-col justify-start h-full">
          <ProfileSecurityTab
            mfaEnabled={profile.mfaEnabled}
            emailVerified={profile.emailVerified}
            passwordChangedAt={profile.passwordChangedAt}
          />
        </div>
      </div>

      {/* ═══ Dialogs ═══ */}
      <ProfileContactDialog
        profile={profile}
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
      />
    </div>
  );
}