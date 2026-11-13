"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  SummaryCardsGrid,
  Tabs,
  TabsList,
  TabsTrigger,
  type SummaryCardItem,
} from "@repo/ui/components/ui";
import type {
  SchemeItem,
  PropertyItem,
} from "../../../../../../lib/types/facility";
import type { Resident } from "../../../../../../lib/types/resident";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { HoursSummaryCharts } from "./HoursSummaryCharts";
import { HoursSummaryTable } from "./HoursSummaryTable";
import type { DayColumnInfo } from "./WeeklyRotaScheduleTable";
import { getShiftStaffIds, resolveShiftLocation } from "./rotaDataUtils";
import {
  buildDailyHoursPoints,
  buildHoursBreakdownRows,
  buildHoursSummaryMetrics,
  getScopedCommissionedHours,
} from "./hoursSummaryUtils";

interface HoursSummaryViewProps {
  shifts: Shift[];
  schemes: SchemeItem[];
  properties: PropertyItem[];
  staff: StaffMember[];
  residents: Resident[];
  days: DayColumnInfo[];
  activeCareType?: string;
  schemeFilter?: string;
  propertyFilter?: string;
  staffFilter?: string;
}

export function HoursSummaryView({
  shifts,
  schemes,
  properties,
  staff,
  residents,
  days,
  activeCareType = "All Care Types",
  schemeFilter = "all",
  propertyFilter = "all",
  staffFilter = "all",
}: HoursSummaryViewProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<"both" | "scheme" | "property">(
    "both",
  );

  const filteredProperties = useMemo(() => {
    if (schemeFilter === "all") return properties;
    return properties.filter((p) => p.schemeId === schemeFilter);
  }, [properties, schemeFilter]);

  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (activeCareType !== "All Care Types" && s.careType !== activeCareType) {
        return false;
      }
      const loc = resolveShiftLocation(s, properties, schemes, residents);
      if (schemeFilter !== "all" && loc.schemeId !== schemeFilter) return false;
      if (propertyFilter !== "all" && loc.propertyId !== propertyFilter) {
        return false;
      }
      if (staffFilter !== "all" && !getShiftStaffIds(s).includes(staffFilter)) {
        return false;
      }
      return true;
    });
  }, [
    shifts,
    activeCareType,
    schemeFilter,
    propertyFilter,
    staffFilter,
    properties,
    schemes,
    residents,
  ]);

  const scopedCommissioned = useMemo(
    () =>
      getScopedCommissionedHours(
        schemes,
        properties,
        residents,
        schemeFilter,
        propertyFilter,
      ),
    [schemes, properties, residents, schemeFilter, propertyFilter],
  );

  const metrics = useMemo(
    () => buildHoursSummaryMetrics(scopedCommissioned, filteredShifts, staff),
    [scopedCommissioned, filteredShifts, staff],
  );

  const dayPoints = useMemo(
    () => buildDailyHoursPoints(days, filteredShifts, metrics.required),
    [days, filteredShifts, metrics.required],
  );

  const breakdownRows = useMemo(
    () =>
      buildHoursBreakdownRows({
        viewMode,
        schemeFilter,
        propertyFilter,
        schemes,
        properties,
        filteredProperties,
        filteredShifts,
        residents,
      }),
    [
      viewMode,
      schemeFilter,
      propertyFilter,
      schemes,
      properties,
      filteredProperties,
      filteredShifts,
      residents,
    ],
  );

  const kpiCards: SummaryCardItem[] = [
    {
      title: "Required Support Hours",
      value: `${metrics.required} hrs`,
      subtitle: "Commissioned / Week",
      icon: <Clock className="size-5 text-slate-700" />,
      iconClassName: "bg-slate-100",
    },
    {
      title: "Planned Staff Hours",
      value: `${metrics.planned} hrs`,
      subtitle: "Scheduled / Week",
      icon: <Calendar className="size-5 text-primary" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Delivered Support Hours",
      value: `${metrics.delivered} hrs`,
      subtitle: "Actual / Week",
      subtitleColor: "text-emerald-800 font-medium",
      icon: <CheckCircle2 className="size-5 text-emerald-700" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Coverage Gap",
      value: `${metrics.gap} hrs`,
      subtitle:
        metrics.required > 0
          ? `${metrics.gapPercent}% below required`
          : "No commissioned target set",
      subtitleColor:
        metrics.gap > 0 ? "text-amber-700 font-medium" : "text-slate-500",
      icon: <AlertTriangle className="size-5 text-amber-600" />,
      iconClassName: "bg-amber-50",
    },
    {
      title: "Overtime",
      value: `${metrics.overtime} hrs`,
      subtitle: `${metrics.overtimePercent}% of planned hours`,
      subtitleColor: "text-purple-700 font-medium",
      icon: <TrendingUp className="size-5 text-purple-700" />,
      iconClassName: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* 5 KPI Stat Cards (Image 2) */}
      <SummaryCardsGrid
        cards={kpiCards}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      />

      {/* Weekly Hours Comparison + Overall Coverage Donut */}
      <HoursSummaryCharts days={dayPoints} metrics={metrics} />

      {/* Hours Summary Table with View Mode Switcher */}
      <div className="space-y-3">
        <div className="flex justify-end">
          <Tabs
            value={viewMode}
            onValueChange={(v) =>
              setViewMode(v as "both" | "scheme" | "property")
            }
            className="gap-0"
          >
            <TabsList className="bg-slate-150 p-1 rounded-xl gap-1">
              <TabsTrigger value="both" className="px-3 py-1 text-sm rounded-lg">
                By Scheme &amp; Property
              </TabsTrigger>
              <TabsTrigger value="scheme" className="px-3 py-1 text-sm rounded-lg">
                By Scheme
              </TabsTrigger>
              <TabsTrigger value="property" className="px-3 py-1 text-sm rounded-lg">
                By Property
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <HoursSummaryTable
          viewMode={viewMode}
          rows={breakdownRows}
          metrics={metrics}
        />
      </div>
    </div>
  );
}
