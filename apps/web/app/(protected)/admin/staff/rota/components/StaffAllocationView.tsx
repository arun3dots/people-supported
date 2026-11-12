"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Home,
  LayoutGrid,
  List,
  UserCheck,
} from "lucide-react";
import {
  Button,
  Card,
  SummaryCardsGrid,
  Text,
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
  activeCareType?: string;
  schemeFilter?: string;
  propertyFilter?: string;
  staffFilter?: string;
  onReassignStaff: (staff: StaffMember) => void;
}

export function StaffAllocationView({
  schemes,
  properties,
  staff,
  shifts,
  schemeFilter = "all",
  propertyFilter = "all",
  staffFilter = "all",
  onReassignStaff,
}: StaffAllocationViewProps): React.JSX.Element {
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
      iconClassName: "bg-surface-primary-light",
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
      {/* 4 KPI Stat Cards */}
      <SummaryCardsGrid
        cards={kpiCards}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      />

      {/* Staff Allocation Table or Card View */}
      <Card variant="surface" border="default" className="p-5 font-sans gap-4 border-none shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-secondary/50">
          <div>
            <Text as="h2" size="md" weight="semibold" className="text-slate-900">
              Staff Allocation ({filteredStaff.length} shown of {staff.length})
            </Text>
            <Text size="md" variant="muted">
              Manage primary, secondary and night cover allocations across homes.
            </Text>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shrink-0">
            <Button
              type="button"
              onClick={() => setViewMode("table")}
              size="sm"
              variant={viewMode === "table" ? "primary" : "ghost"}
              className="h-8 rounded-lg px-3 font-medium text-xs gap-1"
            >
              <List className="size-3.5" />
              Table View
            </Button>
            <Button
              type="button"
              onClick={() => setViewMode("card")}
              size="sm"
              variant={viewMode === "card" ? "primary" : "ghost"}
              className="h-8 rounded-lg px-3 font-medium text-xs gap-1"
            >
              <LayoutGrid className="size-3.5" />
              Card View
            </Button>
          </div>
        </div>

        {viewMode === "table" ? (
          <StaffAllocationTable
            filteredStaff={filteredStaff}
            schemes={schemes}
            properties={properties}
            totalStaffCount={staff.length}
            onReassignStaff={onReassignStaff}
          />
        ) : (
          <StaffAllocationCardGrid
            staffList={filteredStaff}
            schemes={schemes}
            properties={properties}
            onReassignStaff={onReassignStaff}
          />
        )}
      </Card>
    </div>
  );
}
