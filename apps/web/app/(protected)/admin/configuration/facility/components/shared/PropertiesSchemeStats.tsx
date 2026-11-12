"use client";

import React from "react";
import {
  Building2,
  FolderKanban,
  DoorOpen,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { FacilityStatCards } from "./FacilityStatCards";
import type { PropertyItem, SchemeItem } from "../../../../../../../lib/types/facility";

interface PropertiesSchemeStatsProps {
  properties: PropertyItem[];
  schemes: SchemeItem[];
}

export function PropertiesSchemeStats({
  properties,
  schemes,
}: PropertiesSchemeStatsProps) {
  const totalProperties = properties.length;
  const totalSchemes = schemes.length;
  const totalRooms = properties.reduce((acc, p) => acc + (p.totalRooms || 0), 0);
  const occupiedRooms = properties.reduce((acc, p) => {
    if (p.roomTenancies && p.roomTenancies.length > 0) {
      return acc + p.roomTenancies.filter((r) => r.tenancyStatus === "In tenancy").length;
    }
    return acc + (p.occupiedBeds || 0);
  }, 0);
  const vacantRooms = properties.reduce((acc, p) => {
    if (p.roomTenancies && p.roomTenancies.length > 0) {
      return acc + p.roomTenancies.filter((r) => r.tenancyStatus === "Void").length;
    }
    return acc + (p.vacantBeds || 0);
  }, 0);

  const occupiedPct =
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const vacantPct =
    totalRooms > 0 ? Math.round((vacantRooms / totalRooms) * 100) : 0;

  return (
    <FacilityStatCards
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      cards={[
        {
          title: "Total Properties",
          value: String(totalProperties),
          subtitle: "All registered properties",
          icon: <Building2 className="size-5 text-emerald-800" />,
          iconClassName: "bg-emerald-50",
          subtitleColor: "text-slate-500",
        },
        {
          title: "Total Schemes",
          value: String(totalSchemes),
          subtitle: "Support schemes",
          icon: <FolderKanban className="size-5 text-emerald-800" />,
          iconClassName: "bg-emerald-50",
          subtitleColor: "text-slate-500",
        },
        {
          title: "Total Rooms",
          value: String(totalRooms),
          subtitle: "Across all properties",
          icon: <DoorOpen className="size-5 text-emerald-800" />,
          iconClassName: "bg-slate-100",
          subtitleColor: "text-slate-500",
        },
        {
          title: "Occupied",
          value: `${occupiedPct}%`,
          subtitle: `${occupiedRooms} of ${totalRooms} rooms occupied`,
          icon: <UserCheck className="size-5 text-emerald-800" />,
          iconClassName: "bg-emerald-50",
          subtitleColor: "text-emerald-800",
        },
        {
          title: "Vacant",
          value: `${vacantPct}%`,
          subtitle: `${vacantRooms} rooms ready for referral`,
          icon: <Sparkles className="size-5 text-amber-600" />,
          iconClassName: "bg-amber-50",
          subtitleColor: "text-amber-700",
        },
      ]}
    />
  );
}
