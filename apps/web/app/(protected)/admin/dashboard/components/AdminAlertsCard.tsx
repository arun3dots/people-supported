"use client";

import React from "react";
import { Card, Text, EmptyState } from "@repo/ui/components/ui";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface AlertItem {
  id?: string;
  title?: string;
  description?: string;
  subtitle?: string;
  severity?: "critical" | "high" | "medium" | "low" | string;
  level?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  timestamp?: string;
  createdAt?: string;
  news2Score?: number;
  isAbnormal?: boolean;
  resident?: {
    fullName?: string;
  };
}

interface AdminAlertsCardProps {
  alerts?: AlertItem[];
  isLoading?: boolean;
}

export function AdminAlertsCard({ alerts, isLoading }: AdminAlertsCardProps) {

  const displayAlerts =
    alerts && alerts.length > 0
      ? alerts.map((a, idx) => {
        let level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
        let badgeStyle = "bg-amber-100 text-amber-800";
        let dotBg = "bg-amber-500";

        const sev = (a.severity || a.level || "").toLowerCase();

        if (sev === "critical" || (a.news2Score !== undefined && a.news2Score >= 7)) {
          level = "CRITICAL";
          badgeStyle = "bg-red-600 text-white";
          dotBg = "bg-red-600";
        } else if (sev === "high" || (a.news2Score !== undefined && a.news2Score >= 5)) {
          level = "HIGH";
          badgeStyle = "bg-rose-100 text-rose-700";
          dotBg = "bg-rose-500";
        } else if (sev === "low" || (a.news2Score !== undefined && a.news2Score <= 2)) {
          level = "LOW";
          badgeStyle = "bg-emerald-100 text-emerald-800";
          dotBg = "bg-emerald-500";
        }

        let timeText = "Just now";
        const rawDate = a.timestamp || a.createdAt;
        if (rawDate) {
          const dateObj = new Date(rawDate);
          if (!isNaN(dateObj.getTime())) {
            timeText =
              formatDistanceToNow(dateObj, { addSuffix: false })
                .replace("about ", "")
                .replace("less than a minute", "1m")
                .replace("minutes", "m")
                .replace("minute", "m")
                .replace("hours", "h")
                .replace("hour", "h")
                .trim() + " ago";
          }
        }

        const residentName = a.resident?.fullName;
        let titleText = a.title || "Clinical Alert";
        if (a.news2Score !== undefined) {
          titleText = `Abnormal NEWS2 Score (${a.news2Score})${residentName ? ` - ${residentName}` : ""}`;
        } else if (residentName && !titleText.includes(residentName)) {
          titleText = `${titleText} - ${residentName}`;
        }

        const subtitleText = a.description || a.subtitle || "Clinical review required";

        return {
          id: a.id || `alert-${idx}`,
          level,
          badgeStyle,
          title: titleText,
          subtitle: subtitleText,
          time: timeText,
          dotBg,
        };
      })
      : [];

  return (
    <Card
      variant="surface"
      className="w-full h-full min-h-[380px] p-5 flex-col justify-between shadow-xs"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <Text as="h3" size="base" weight="semibold" className="text-slate-900 leading-tight">
            Clinical Alerts & Escalations
          </Text>
          <Link
            href="/admin/escalations"
            className="flex items-center gap-1 text-md font-medium text-emerald-700 hover:text-emerald-800"
          >
            See All
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-4 w-full flex-1">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-1.5 w-full">
                <div className="h-4 bg-slate-200 rounded w-16" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-2 bg-slate-200 rounded w-1/2" />
              </div>
            ))
          ) : displayAlerts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-4">
              <EmptyState
                title="No clinical alerts"
                description="Alerts and escalations will appear here when triggered."
              />
            </div>
          ) : (
            displayAlerts.map((alert) => (
              <div key={alert.id} className="flex flex-col gap-1 w-full">
                {/* Top Bar: Badge & Timestamp */}
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-md  tracking-wider ${alert.badgeStyle}`}
                  >
                    {alert.level}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Text size="md" variant="muted" weight="medium">
                      {alert.time}
                    </Text>
                    <div
                      className={`size-1.5 rounded-full shrink-0 ${alert.dotBg}`}
                    />
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="flex flex-col">
                  <Text size="md" className="truncate">
                    {alert.title}
                  </Text>
                  <Text size="md" variant="muted" className="truncate">
                    {alert.subtitle}
                  </Text>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}