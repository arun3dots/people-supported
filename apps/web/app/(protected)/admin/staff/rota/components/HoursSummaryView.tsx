"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import {
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  activeCareType: string;
}

export function HoursSummaryView({
  shifts,
  schemes,
  properties,
  staff,
  residents,
  days,
  activeCareType,
}: HoursSummaryViewProps): React.JSX.Element {
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
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
      <Card
        variant="surface"
        border="default"
        className="p-4 flex-col lg:flex-row lg:items-center justify-between gap-4 border-none shadow-none"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={schemeFilter}
            onValueChange={(val) => {
              setSchemeFilter(val);
              setPropertyFilter("all");
            }}
          >
            <SelectTrigger className="w-44 h-10 rounded-xl bg-white">
              <SelectValue placeholder="All Schemes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schemes</SelectItem>
              {schemes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-44 h-10 rounded-xl bg-white">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Properties ({filteredProperties.length})
              </SelectItem>
              {filteredProperties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-40 h-10 rounded-xl bg-white">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff ({staff.length})</SelectItem>
              {staff.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSchemeFilter("all");
              setPropertyFilter("all");
              setStaffFilter("all");
            }}
            className="h-10 px-2.5 text-md text-slate-600 hover:text-slate-900 font-medium"
          >
            <RotateCcw className="size-3.5 mr-1" /> Reset
          </Button>
        </div>

        <Tabs
          value={viewMode}
          onValueChange={(v) =>
            setViewMode(v as "both" | "scheme" | "property")
          }
          className="gap-0 border-b border-slate-200 lg:border-b-0"
        >
          <TabsList className="justify-start bg-transparent p-0 h-auto rounded-none gap-5">
            <TabsTrigger value="both" className="px-0 py-1.5 text-md">
              By Scheme &amp; Property
            </TabsTrigger>
            <TabsTrigger value="scheme" className="px-0 py-1.5 text-md">
              By Scheme
            </TabsTrigger>
            <TabsTrigger value="property" className="px-0 py-1.5 text-md">
              By Property
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>

      <SummaryCardsGrid
        cards={kpiCards}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      />

      <HoursSummaryCharts days={dayPoints} metrics={metrics} />

      <HoursSummaryTable
        viewMode={viewMode}
        rows={breakdownRows}
        metrics={metrics}
      />
    </div>
  );
}
