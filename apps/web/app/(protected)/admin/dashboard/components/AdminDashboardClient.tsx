"use client";

import React from "react";
import { AdminWelcomeBanner } from "./AdminWelcomeBanner";
import { QuickActionsCard } from "./QuickActionsCard";
import { MetricStatsRow } from "./MetricStatsRow";
import { QuickViewCarousel } from "./QuickViewCarousel";
import { ComplianceReadinessCard } from "./ComplianceReadinessCard";
import { AdminAlertsCard } from "./AdminAlertsCard";
import { AdminActivityCard } from "./AdminActivityCard";
import { FinancialOverviewCard } from "./FinancialOverviewCard";
import { ManagerClinicalGovernanceWidget } from "./ManagerClinicalGovernanceWidget";
import { useGetAdminStatsQuery } from "../../../../../lib/queries/dashboard/useGetAdminStatsQuery";

import type { AdminStatsDTO } from "@repo/schema";

export function AdminDashboardClient() {
  const { data, isLoading } = useGetAdminStatsQuery();

  const stats = data as AdminStatsDTO | undefined;

  return (
    <div className="w-full space-y-6 pb-10">
      {/* 1. Welcome + Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-7 xl:col-span-7 w-full min-h-[285px]">
          <AdminWelcomeBanner />
        </div>
        <div className="lg:col-span-5 xl:col-span-5 w-full min-h-[285px]">
          <QuickActionsCard />
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <MetricStatsRow stats={stats} isLoading={isLoading} />


      {/* 3. Quick View Carousel */}
      <QuickViewCarousel />

      {/* 4. Core Activity & Compliance Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-stretch">
        {/* <ComplianceReadinessCard /> */}
        <AdminActivityCard
          activities={stats?.recentActivity ?? []}
          isLoading={isLoading}
        />
        <AdminAlertsCard alerts={stats?.alerts ?? []} isLoading={isLoading} />
      </div>


      {/* 3. Clinical Governance & Escalations Command Center */}
      {/* <ManagerClinicalGovernanceWidget /> */}

      {/* 5. Revenue & Financial Overview */}
      <FinancialOverviewCard />
    </div>
  );
}