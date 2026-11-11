"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Home,
  LayoutGrid,
  List,
  RotateCcw,
  UserCheck,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui";
import type {
  SchemeItem,
  PropertyItem,
} from "../../../../../../lib/types/facility";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { StaffAllocationCardGrid } from "./StaffAllocationCardGrid";
import { StaffAllocationTable } from "./StaffAllocationTable";
import { getShiftStaffIds, resolveStaffLocation } from "./rotaDataUtils";

interface StaffAllocationViewProps {
  schemes: SchemeItem[];
  properties: PropertyItem[];
  staff: StaffMember[];
  shifts: Shift[];
  activeCareType: string;
  onReassignStaff: (staff: StaffMember) => void;
}

export function StaffAllocationView({
  schemes,
  properties,
  staff,
  shifts,
  onReassignStaff,
}: StaffAllocationViewProps): React.JSX.Element {
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const filteredStaff = useMemo(() => {
    return staff.filter((m) => {
      const loc = resolveStaffLocation(m, schemes, properties);
      if (schemeFilter !== "all" && loc.schemeId !== schemeFilter) return false;
      if (propertyFilter !== "all" && loc.propertyId !== propertyFilter) {
        return false;
      }
      if (staffFilter !== "all" && m.id !== staffFilter) return false;
      return true;
    });
  }, [staff, schemes, properties, schemeFilter, propertyFilter, staffFilter]);

  const metrics = useMemo(() => {
    const coveredPropertyIds = new Set<string>();
    let assignedStaffCount = 0;

    staff.forEach((m) => {
      const loc = resolveStaffLocation(m, schemes, properties);
      if (loc.propertyId) coveredPropertyIds.add(loc.propertyId);
      if (loc.propertyId || loc.schemeId) assignedStaffCount += 1;
    });

    const uncoveredPropertiesCount = properties.filter(
      (p) => !coveredPropertyIds.has(p.id),
    ).length;
    const unassignedShiftsCount = shifts.filter(
      (s) => getShiftStaffIds(s).length === 0,
    ).length;

    return {
      totalStaff: staff.length,
      assignedStaffCount,
      activeSchemes: schemes.length,
      coveredProperties: coveredPropertyIds.size,
      unfilledCount: uncoveredPropertiesCount + unassignedShiftsCount,
    };
  }, [staff, schemes, properties, shifts]);

  const kpiCards: SummaryCardItem[] = [
    {
      title: "Total Staff",
      value: metrics.totalStaff,
      subtitle: `${metrics.assignedStaffCount} assigned to scheme/property`,
      icon: <UserCheck className="size-5 text-primary" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Active Schemes",
      value: metrics.activeSchemes,
      subtitle: "Supported living schemes",
      icon: <Building2 className="size-5 text-slate-700" />,
      iconClassName: "bg-slate-100",
    },
    {
      title: "Properties Covered",
      value: metrics.coveredProperties,
      subtitle: `of ${properties.length} registered properties`,
      icon: <Home className="size-5 text-primary" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Unfilled Assignments",
      value: metrics.unfilledCount,
      subtitle: "Properties & shifts needing cover",
      subtitleColor:
        metrics.unfilledCount > 0
          ? "text-amber-700 font-medium"
          : "text-slate-500",
      icon: <AlertTriangle className="size-5 text-amber-600" />,
      iconClassName: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <SummaryCardsGrid
        cards={kpiCards}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      />

      <Card
        variant="surface"
        border="default"
        className="p-4 flex-col lg:flex-row lg:items-center justify-between gap-3 border-none shadow-none"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={schemeFilter} onValueChange={setSchemeFilter}>
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
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((p) => (
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
            className="h-10 px-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
            <RotateCcw className="size-3.5 mr-1" /> Reset
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl">
          <Button
            type="button"
            onClick={() => setViewMode("table")}
            size="sm"
            variant={viewMode === "table" ? "primary" : "ghost"}
            className="h-8 rounded-lg px-3 font-medium"
          >
            <List className="size-3.5" />
            Table View
          </Button>
          <Button
            type="button"
            onClick={() => setViewMode("card")}
            size="sm"
            variant={viewMode === "card" ? "primary" : "ghost"}
            className="h-8 rounded-lg px-3 font-medium"
          >
            <LayoutGrid className="size-3.5" />
            Card View
          </Button>
        </div>
      </Card>

      {filteredStaff.length === 0 ? (
        <Card variant="surface" border="default" className="p-0 border-none shadow-none">
          <EmptyState
            title="No staff members found"
            description="Add staff members in the Staff Directory or clear your filters to see allocations."
          />
        </Card>
      ) : viewMode === "card" ? (
        <StaffAllocationCardGrid
          staffList={filteredStaff}
          schemes={schemes}
          properties={properties}
          onReassignStaff={onReassignStaff}
        />
      ) : (
        <StaffAllocationTable
          filteredStaff={filteredStaff}
          schemes={schemes}
          properties={properties}
          totalStaffCount={staff.length}
          onReassignStaff={onReassignStaff}
        />
      )}
    </div>
  );
}
