"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, User, Users } from "lucide-react";
import {
  Card,
  Text,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { useGetStaffQuery } from "../../../../../lib/queries/staff/useGetStaffQuery";
import { useGetResidentsQuery } from "../../../../../lib/queries/residents/useGetResidentsQuery";
import type { StaffMember } from "../../../../../lib/types/staff";
import type { Resident } from "../../../../../lib/types/resident";

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.substring(0, 2).toUpperCase() || "";
  const first = parts[0]?.[0] || "";
  const last = parts[parts.length - 1]?.[0] || "";
  return `${first}${last}`.toUpperCase();
}

export function QuickViewCarousel() {
  const [activeTab, setActiveTab] = useState<"staff" | "residents">("staff");

  const { data: staffList = [], isLoading: isLoadingStaff } =
    useGetStaffQuery();
  const { data: residentsList = [], isLoading: isLoadingResidents } =
    useGetResidentsQuery();

  const isLoading = activeTab === "staff" ? isLoadingStaff : isLoadingResidents;

  const items =
    activeTab === "staff"
      ? (staffList as StaffMember[]).map((member) => ({
        id: member.id,
        name: member.fullName,
        avatar: member.avatarUrl,
        href: `/admin/staff/${member.id}`,
      }))
      : (residentsList as Resident[]).map((resident) => ({
        id: resident.id,
        name: resident.fullName,
        avatar: resident.photoUrl,
        href: `/admin/residents/${resident.id}`,
      }));

  const viewAllHref =
    activeTab === "staff" ? "/admin/staff" : "/admin/residents";
  const displayItems = items.slice(0, 10);

  return (
    <Card
      variant="surface"
      border="default"
      className="p-5 rounded-2xl w-full shadow-xs"
    >
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <Text
          as="h3"
          size="md"
          weight="medium"
          className="text-slate-900 leading-tight"
        >
          Quick View
        </Text>

        {/* Toggle Box */}
        <div className="flex items-center p-1 bg-surface-card-grey">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("staff")}
            className={cn(
              "px-3 py-1.5 gap-1.5 rounded-lg font-medium transition-all",
              activeTab === "staff"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "bg-transparent text-slate-500 hover:bg-transparent hover:text-slate-900",
            )}
          >
            <Users className="size-3.5 text-emerald-800" />
            Staff
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("residents")}
            className={cn(
              "px-3 py-1.5 gap-1.5 rounded-lg font-medium transition-all",
              activeTab === "residents"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "bg-transparent text-slate-500 hover:bg-transparent hover:text-slate-900",
            )}
          >
            <User className="size-3.5 text-emerald-800" />
            Residents
          </Button>
        </div>
      </div>

      {/* Avatars Responsive Grid Container (No horizontal scroll, View All at the end) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 2xl:grid-cols-11 gap-4 sm:gap-5 justify-items-center">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2.5 sm:gap-3.5 w-full max-w-[110px]"
            >
              <div className="size-16 sm:size-20 rounded-full bg-slate-200 animate-pulse shrink-0" />
              <div className="w-14 h-3 bg-slate-200 rounded animate-pulse" />
            </div>
          ))
        ) : (
          <>
            {displayItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col items-center gap-2.5 sm:gap-3.5 w-full max-w-[110px] group cursor-pointer"
              >
                {/* Responsive Avatar Circle */}
                <Avatar className="size-16 sm:size-20 shrink-0 group-hover:opacity-90 transition-opacity border border-slate-200 shadow-xs">
                  {item.avatar && (
                    <AvatarImage
                      src={item.avatar}
                      alt={item.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-primary-100 text-slate-700 font-semibold text-md sm:text-md">
                    {getInitials(item.name) || (
                      <User className="size-5 sm:size-6 text-slate-400" />
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* User Name */}
                <Text
                  size="md"
                  className="text-center w-full truncate leading-tight text-slate-800 group-hover:text-emerald-800 transition-colors"
                >
                  {item.name}
                </Text>
              </Link>
            ))}

            {/* View All Circle Card */}
            <Link
              href={viewAllHref}
              className="flex flex-col items-center gap-2.5 sm:gap-3.5 w-full max-w-[110px] group cursor-pointer"
            >
              <div className="size-16 sm:size-20 rounded-full shrink-0 flex items-center justify-center bg-white border-2 border-dashed border-slate-300 group-hover:border-emerald-700 group-hover:bg-emerald-50/50 transition-all shadow-xs">
                <ArrowRight className="size-5 sm:size-6 text-slate-800 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all" />
              </div>
              <Text
                size="md"
                weight="medium"
                className="text-center w-full truncate leading-tight text-slate-700 group-hover:text-emerald-800 transition-colors"
              >
                View all
              </Text>
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
