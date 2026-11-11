"use client";

import React, { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button, Card, Text } from "@repo/ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import type { SchemeItem, PropertyItem } from "../../../../../../lib/types/facility";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { HoursSummaryTable } from "./HoursSummaryTable";

interface HoursSummaryViewProps {
  shifts: Shift[];
  schemes: SchemeItem[];
  properties: PropertyItem[];
  staff: StaffMember[];
  activeCareType: string;
}

export function HoursSummaryView({
  shifts,
  schemes,
  properties,
  staff,
  activeCareType,
}: HoursSummaryViewProps): React.JSX.Element {
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"both" | "scheme" | "property">("both");

  const filteredProperties = useMemo(() => {
    if (schemeFilter === "all") return properties;
    return properties.filter((p) => p.schemeId === schemeFilter);
  }, [properties, schemeFilter]);

  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (activeCareType !== "All Care Types" && s.careType !== activeCareType) return false;
      if (propertyFilter !== "all" && s.wingId !== propertyFilter) return false;
      if (staffFilter !== "all" && !s.assignments?.some((a) => a.userId === staffFilter)) return false;
      return true;
    });
  }, [shifts, activeCareType, propertyFilter, staffFilter]);

  const metrics = useMemo(() => {
    const required = 320;
    const planned = filteredShifts.reduce((acc, s) => acc + (s.durationHours || 8), 0) || 298;
    const delivered = Math.round(planned * 0.985);
    const gap = Math.max(0, required - planned);
    const overtime = 12;

    return {
      required,
      planned,
      delivered,
      gap,
      overtime,
      gapPercent: ((gap / required) * 100).toFixed(1),
      coveragePercent: ((delivered / required) * 100).toFixed(1),
    };
  }, [filteredShifts]);

  const days = [
    { day: "Mon", req: 48, plan: 44, del: 44 },
    { day: "Tue", req: 48, plan: 42, del: 42 },
    { day: "Wed", req: 46, plan: 44, del: 43 },
    { day: "Thu", req: 46, plan: 44, del: 44 },
    { day: "Fri", req: 46, plan: 42, del: 42 },
    { day: "Sat", req: 44, plan: 41, del: 40 },
    { day: "Sun", req: 44, plan: 41, del: 40 },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Filters row */}
      <Card variant="white" border="secondary" className="p-4 flex-row flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={schemeFilter} onValueChange={(val) => { setSchemeFilter(val); setPropertyFilter("all"); }}>
            <SelectTrigger className="w-44 h-10 rounded-xl text-md bg-slate-50 border-slate-200">
              <SelectValue placeholder="All Schemes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schemes</SelectItem>
              {schemes.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-44 h-10 rounded-xl text-md bg-slate-50 border-slate-200">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties ({filteredProperties.length})</SelectItem>
              {filteredProperties.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-40 h-10 rounded-xl text-md bg-slate-50 border-slate-200">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff ({staff.length})</SelectItem>
              {staff.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSchemeFilter("all"); setPropertyFilter("all"); setStaffFilter("all"); }}
            className="h-10 px-2.5 text-md text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="size-3 mr-1" /> Reset
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <Button
            type="button"
            onClick={() => setViewMode("both")}
            size="sm"
            variant={viewMode === "both" ? "primary" : "ghost"}
            className="h-9 rounded-lg px-3 transition-all"
          >
            By Scheme & Property
          </Button>
          <Button
            type="button"
            onClick={() => setViewMode("scheme")}
            size="sm"
            variant={viewMode === "scheme" ? "primary" : "ghost"}
            className="h-9 rounded-lg px-3 transition-all"
          >
            By Scheme
          </Button>
          <Button
            type="button"
            onClick={() => setViewMode("property")}
            size="sm"
            variant={viewMode === "property" ? "primary" : "ghost"}
            className="h-9 rounded-lg px-3 transition-all"
          >
            By Property
          </Button>
        </div>
      </Card>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card variant="white" border="secondary" className="p-4 gap-1 shadow-xs">
          <Text size="md" weight="medium" variant="subdued">Required Support Hours</Text>
          <Text size="2xl" weight="semibold" className="mt-1">{metrics.required} hrs</Text>
          <Text size="md" variant="subdued">Commissioned / Week</Text>
        </Card>

        <Card variant="white" border="secondary" className="p-4 gap-1 shadow-xs">
          <Text size="md" weight="medium" variant="subdued">Planned Staff Hours</Text>
          <Text size="2xl" weight="semibold" className="mt-1">{metrics.planned} hrs</Text>
          <Text size="md" variant="subdued">Scheduled / Week</Text>
        </Card>

        <Card variant="white" border="secondary" className="p-4 gap-1 shadow-xs">
          <Text size="md" weight="medium" variant="subdued">Delivered Support Hours</Text>
          <Text size="2xl" weight="semibold" className="mt-1">{metrics.delivered} hrs</Text>
          <Text size="md" variant="subdued">Actual / Week</Text>
        </Card>

        <Card variant="white" border="secondary" className="bg-amber-50/50 p-4 gap-1 shadow-xs">
          <Text size="md" weight="medium" className="text-amber-800">Coverage Gap</Text>
          <Text size="2xl" weight="semibold" className="text-amber-900 mt-1">{metrics.gap} hrs</Text>
          <Text size="md" className="text-amber-700">{metrics.gapPercent}% below required</Text>
        </Card>

        <Card variant="white" border="secondary" className="bg-purple-50/50 p-4 gap-1 shadow-xs">
          <Text size="md" weight="medium" className="text-purple-800">Overtime</Text>
          <Text size="2xl" weight="semibold" className="text-purple-900 mt-1">{metrics.overtime} hrs</Text>
          <Text size="md" className="text-purple-700">4.0% of planned hours</Text>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card variant="white" border="secondary" className="lg:col-span-2 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Text as="h2" size="md" weight="semibold">Weekly Hours Comparison</Text>
              <Text size="md" variant="subdued" className="text-slate-500">
                Daily commissioned (required), planned (staff) and delivered (actual) hours
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Text as="span" size="md" weight="medium" className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-600 inline-block" /> Commissioned</Text>
              <Text as="span" size="md" weight="medium" className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary inline-block" /> Planned</Text>
              <Text as="span" size="md" weight="medium" className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-blue-600 inline-block" /> Delivered</Text>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-4 border-b border-slate-100">
            {days.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-36">
                  <div style={{ height: `${(d.req / 50) * 100}%` }} className="w-3 bg-emerald-600 rounded-t-sm" />
                  <div style={{ height: `${(d.plan / 50) * 100}%` }} className="w-3 bg-primary rounded-t-sm" />
                  <div style={{ height: `${(d.del / 50) * 100}%` }} className="w-3 bg-blue-600 rounded-t-sm" />
                </div>
                <Text as="span" size="md" weight="medium" variant="subdued" className="mt-2">{d.day}</Text>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="white" border="secondary" className="p-5 shadow-xs justify-between">
          <div>
            <Text as="h2" size="md" weight="semibold">Overall Coverage</Text>
            <Text size="md" variant="subdued" className="text-slate-500">Delivered support hours vs target</Text>
          </div>

          <div className="flex items-center justify-center my-4">
            <div className="relative size-36 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-700"
                  strokeDasharray={`${metrics.coveragePercent}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <Text as="span" size="2xl" weight="semibold">{metrics.coveragePercent}%</Text>
                <Text as="span" size="md" weight="medium" variant="subdued">Coverage</Text>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <div className="flex justify-between"><Text as="span" size="md" variant="subdued">Delivered Hours</Text><Text as="span" size="md" weight="semibold">{metrics.delivered} hrs</Text></div>
            <div className="flex justify-between"><Text as="span" size="md" variant="subdued">Variance (Gap)</Text><Text as="span" size="md" weight="semibold" className="text-amber-600">{metrics.gap} hrs</Text></div>
            <div className="flex justify-between"><Text as="span" size="md" variant="subdued">Required Hours</Text><Text as="span" size="md" weight="semibold">{metrics.required} hrs</Text></div>
          </div>
        </Card>
      </div>

      <HoursSummaryTable viewMode={viewMode} metrics={metrics} />
    </div>
  );
}
