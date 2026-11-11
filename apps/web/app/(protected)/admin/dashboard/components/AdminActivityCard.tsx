"use client";

import React from "react";
import { Users, Pill, AlertTriangle, FileText, Activity as ActivityIcon } from "lucide-react";
import { Card, Text, EmptyState } from "@repo/ui/components/ui";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface Activity {
  id?: string;
  eventType?: string;
  type?: string;
  title?: string;
  actionType?: string;
  summary?: string;
  description?: string;
  desc?: string;
  timestamp?: string;
  createdAt?: string;
  actorName?: string;
  resident?: {
    fullName?: string;
  };
  carer?: {
    fullName?: string;
  };
}

interface AdminActivityCardProps {
  activities?: Activity[];
  isLoading?: boolean;
}

export function AdminActivityCard({
  activities,
  isLoading,
}: AdminActivityCardProps) {


  const displayActivities =
    activities && activities.length > 0
      ? activities.map((act, idx) => {
        let type = "update";
        const eventStr = (
          act.eventType ||
          act.type ||
          act.actionType ||
          act.title ||
          ""
        ).toLowerCase();

        if (eventStr.includes("med")) type = "medication";
        else if (eventStr.includes("admit") || eventStr.includes("resident"))
          type = "admission";
        else if (eventStr.includes("incident") || eventStr.includes("alert"))
          type = "incident";
        else if (eventStr.includes("assess") || eventStr.includes("risk"))
          type = "assessment";

        let timeStr = "Today";
        const rawDate = act.timestamp || act.createdAt;
        if (rawDate) {
          const dateObj = new Date(rawDate);
          if (!isNaN(dateObj.getTime())) {
            timeStr = format(dateObj, "HH:mm");
          }
        }

        const titleStr = act.title || act.eventType || act.actionType || "Activity Logged";
        const performer = act.carer?.fullName || act.actorName || "Staff";
        const descStr =
          act.summary ||
          act.description ||
          act.desc ||
          `Action recorded by ${performer}`;

        return {
          id: act.id || `act-${idx}`,
          time: timeStr,
          title: titleStr,
          desc: descStr,
          type,
        };
      })
      : [];

  const getIconConfig = (type: string) => {
    switch (type) {
      case "medication":
        return {
          icon: Pill,
          bg: "bg-emerald-50 text-emerald-700",
          isFilledAlert: false,
        };
      case "admission":
        return {
          icon: Users,
          bg: "bg-sky-50 text-sky-700",
          isFilledAlert: false,
        };
      case "incident":
        return {
          icon: AlertTriangle,
          bg: "bg-rose-50 text-rose-700",
          isFilledAlert: true,
        };
      case "assessment":
        return {
          icon: FileText,
          bg: "bg-amber-50 text-amber-700",
          isFilledAlert: false,
        };
      default:
        return {
          icon: ActivityIcon,
          bg: "bg-slate-100 text-slate-700",
          isFilledAlert: false,
        };
    }
  };

  return (
    <Card
      variant="surface"
      className="w-full h-full min-h-[380px] p-5 flex-col justify-between s"
    >
      {/* Title Header */}
      <div className="w-full flex flex-row items-center justify-between mb-3">
        <Text as="h3" size="base" weight="semibold" className="text-slate-900 leading-tight">
          Recent Care Activity
        </Text>
        <Link
          href="/admin/care-plans/daily-tasks"
          className="flex items-center gap-1 text-md font-medium text-emerald-700 hover:text-emerald-800"
        >
          See All
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* Activities List */}
      <div className="w-full flex-1 flex flex-col justify-start gap-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-2.5 items-center animate-pulse">
              <div className="size-8 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-2.5 bg-slate-200 rounded w-3/4" />
                <div className="h-2 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : displayActivities.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-4">
            <EmptyState
              title="No recent care activity"
              description="Care activity will appear here as they are recorded."
            />
          </div>
        ) : (
          displayActivities.map((act) => {
            const config = getIconConfig(act.type);
            const Icon = config.icon;

            return (
              <div
                key={act.id}
                className="w-full flex flex-row items-start justify-between relative gap-2"
              >
                {/* Left Cluster */}
                <div className="flex flex-row items-start gap-3.5 flex-1 min-w-0">
                  {/* Icon Container */}
                  <div
                    className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${config.bg}`}
                  >
                    <Icon className="size-4" />
                  </div>

                  {/* Content Group (Time + Titles) */}
                  <div className="flex flex-row items-start gap-3.5 flex-1 min-w-0">
                    <Text
                      size="md"
                      variant="muted"
                      weight="medium"
                      className="min-w-[72px] shrink-0 tabular-nums pt-0.5"
                    >
                      {act.time}
                    </Text>

                    <div className="flex flex-col flex-1 min-w-0">
                      <Text size="md" weight="medium" className="text-slate-800 truncate">
                        {act.title}
                      </Text>
                      <Text size="md" variant="muted" className="text-slate-500 truncate">
                        {act.desc}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}