"use client";

import React from "react";
import { Heart, Star, AlertTriangle, FileText, LineChart } from "lucide-react";
import Link from "next/link";
import { useGetResidentInsightsQuery } from "../../../../../lib/queries/residents";
import { Card, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export function ResidentInsights() {
  const { data: insightsData } = useGetResidentInsightsQuery();

  const reviewsDue = insightsData?.reviewsDue ?? 0;
  const alertsCount = insightsData?.residentsWithAlerts ?? 0;
  const docsCount = insightsData?.recentDocumentsCount ?? 0;
  const careTypesCount = insightsData?.careTypeBreakdown?.length ?? 0;

  const insights = [
    {
      icon: Heart,
      iconContainer: "bg-emerald-50 text-emerald-800",
      title: "Care Type Breakdown",
      subtitle: careTypesCount > 0 ? `${careTypesCount} Care categories` : "View by care type",
    },
    {
      icon: Star,
      iconContainer: "bg-amber-50 text-amber-800",
      title: "Upcoming Reviews",
      subtitle: `${reviewsDue} Reviews due`,
    },
    {
      icon: AlertTriangle,
      iconContainer: "bg-red-50 text-red-800",
      title: "Allergies & Alerts",
      subtitle: `${alertsCount} residents with alerts`,
    },
    {
      icon: FileText,
      iconContainer: "bg-blue-50 text-blue-800",
      title: "Documents",
      subtitle: `${docsCount} recent documents`,
    },
  ];

  return (
    <div className="space-y-3 w-full font-sans">
      <Text as="h3" size="md" weight="medium" className="text-slate-900">
        Resident Insights
      </Text>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 w-full">
        {insights.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className="p-4 flex flex-row items-center gap-3 w-full"
            >
              <div
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center shrink-0",
                  item.iconContainer
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <Text size="md" weight="medium" className="truncate text-slate-900 block">
                  {item.title}
                </Text>
                <Text size="md" weight="regular" className="truncate text-slate-500 block">
                  {item.subtitle}
                </Text>
              </div>
            </Card>
          );
        })}

        <Card
          className="p-4 flex items-center justify-center transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <Link
            href="/admin/residents/analytics"
            className="flex items-center justify-center gap-2 h-full w-full"
          >
            <LineChart className="size-5 text-emerald-800 shrink-0" />
            <Text size="md" weight="medium" className="text-emerald-800">
              View Analytics
            </Text>
          </Link>
        </Card>
      </div>
    </div>
  );
}
