"use client";

import React from "react";
import {
  Building2,
  FolderKanban,
  DoorOpen,
  BedDouble,
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
  const totalCapacity = properties.reduce(
    (acc, p) => acc + (p.totalBeds || 0),
    0,
  );
  const occupiedCount = properties.reduce(
    (acc, p) => acc + (p.occupiedBeds || 0),
    0,
  );
  const vacantCount = properties.reduce(
    (acc, p) => acc + (p.vacantBeds || 0),
    0,
  );

  const occupiedPct =
    totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;
  const vacantPct =
    totalCapacity > 0 ? Math.round((vacantCount / totalCapacity) * 100) : 0;

  return (
    <FacilityStatCards
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
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
          title: "Total Capacity",
          value: String(totalCapacity),
          subtitle: "Beds available",
          icon: <BedDouble className="size-5 text-emerald-800" />,
          iconClassName: "bg-slate-100",
          subtitleColor: "text-slate-500",
        },
        {
          title: "Occupied",
          value: `${occupiedPct}%`,
          subtitle: `${occupiedCount} of ${totalCapacity} beds occupied`,
          icon: <UserCheck className="size-5 text-emerald-800" />,
          iconClassName: "bg-emerald-50",
          subtitleColor: "text-emerald-800",
        },
        {
          title: "Vacant",
          value: `${vacantPct}%`,
          subtitle: `${vacantCount} beds ready for referral`,
          icon: <Sparkles className="size-5 text-amber-600" />,
          iconClassName: "bg-amber-50",
          subtitleColor: "text-amber-700",
        },
      ]}
    />
  );
}
