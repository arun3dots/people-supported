"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  LayoutGrid,
  List,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  Button,
  Card,
  SummaryCardsGrid,
  Text,
  type SummaryCardItem,
} from "@repo/ui/components/ui";
import type { StaffAllocationResponseDTO } from "@repo/schema";
import type { PropertyItem, SchemeItem } from "../../../../../../lib/types/facility";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { StaffAllocationCardGrid } from "./StaffAllocationCardGrid";
import { StaffAllocationTable, type StaffAllocationRow } from "./StaffAllocationTable";
import { getShiftPlannedHours, getShiftStaffIds, resolveStaffLocation } from "./rotaDataUtils";

interface StaffAllocationViewProps {
  schemes: SchemeItem[];
  properties: PropertyItem[];
  staff: StaffMember[];
  shifts: Shift[];
  allocationData?: StaffAllocationResponseDTO;
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
  allocationData,
  schemeFilter = "all",
  propertyFilter = "all",
  staffFilter = "all",
  onReassignStaff,
}: StaffAllocationViewProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const staffById = useMemo(
    () => new Map(staff.map((m) => [m.id, m])),
    [staff],
  );

  const allocationRows: StaffAllocationRow[] = useMemo(() => {
    if (allocationData?.staff && allocationData.staff.length > 0) {
      return allocationData.staff.map((item) => ({
        ...item,
        staffMember: staffById.get(item.id),
      }));
    }

    return staff.map((m) => {
      const loc = resolveStaffLocation(m, schemes, properties);
      const memberShifts = shifts.filter((s) => getShiftStaffIds(s).includes(m.id));
      const scheduledHours = Math.round(
        memberShifts.reduce((acc, s) => acc + getShiftPlannedHours(s), 0) * 10,
      ) / 10;
      const contracted = m.contractedHoursPerWeek ?? 37.5;
      const utilizationPercent =
        contracted > 0 ? Math.round((scheduledHours / contracted) * 100) : 0;

      return {
        id: m.id,
        fullName: m.fullName,
        email: m.email,
        roleName: m.role?.name || "Staff",
        contractType: m.contractType ?? null,
        contractedHoursPerWeek: contracted,
        isActive: m.isActive,
        isOnLeave: Boolean(m.isOnLeave),
        assignedWings: loc.propertyId
          ? [
              {
                id: loc.propertyId,
                name: loc.propertyName || "Assigned Property",
                branchId: loc.schemeId || "",
                branchName: loc.schemeName || null,
              },
            ]
          : [],
        allocatedPropertyNames: loc.propertyName ? [loc.propertyName] : [],
        assignedResidentsCount: 0,
        scheduledShiftsCount: memberShifts.length,
        scheduledHours,
        utilizationPercent,
        careMix: {
          sharedHours: 0,
          oneToOneHours: 0,
          twoToOneHours: 0,
          sleepInHours: 0,
          wakingNightHours: 0,
        },
        assignmentType: loc.propertyName ? "Assigned" : "Unassigned",
        availability: !m.isActive
          ? "Inactive"
          : m.isOnLeave
            ? "On Leave"
            : utilizationPercent >= 100
              ? "Fully Booked"
              : "Available",
        staffMember: m,
      };
    });
  }, [allocationData, staffById, staff, schemes, properties, shifts]);

  const filteredRows = useMemo(() => {
    return allocationRows.filter((row) => {
      if (staffFilter !== "all" && row.id !== staffFilter) return false;
      if (schemeFilter !== "all") {
        const matchesScheme = row.assignedWings.some((w) => w.branchId === schemeFilter);
        if (!matchesScheme) return false;
      }
      if (propertyFilter !== "all") {
        const matchesWing = row.assignedWings.some((w) => w.id === propertyFilter);
        if (!matchesWing) return false;
      }
      return true;
    });
  }, [allocationRows, staffFilter, schemeFilter, propertyFilter]);

  const summary = allocationData?.summary;
  const totalStaff = summary?.totalStaff ?? allocationRows.length;
  const assignedStaffCount =
    summary?.assignedStaffCount ??
    allocationRows.filter((r) => r.scheduledShiftsCount > 0 || r.allocatedPropertyNames.length > 0).length;
  const totalScheduledHours =
    summary?.totalScheduledHours ??
    Math.round(allocationRows.reduce((acc, r) => acc + r.scheduledHours, 0) * 10) / 10;
  const availableStaffCount =
    summary?.availableStaffCount ??
    allocationRows.filter((r) => r.availability === "Available").length;
  const onLeaveCount =
    summary?.onLeaveCount ?? allocationRows.filter((r) => r.isOnLeave).length;
  const unfilledShiftsCount =
    summary?.unfilledShiftsCount ??
    shifts.filter((s) => getShiftStaffIds(s).length === 0).length;

  const kpiCards: SummaryCardItem[] = [
    {
      title: "Allocated Staff",
      value: `${assignedStaffCount}/${totalStaff}`,
      subtitle: "Assigned to properties or shifts this week",
      icon: <UserCheck className="size-5 text-primary" />,
      iconClassName: "bg-surface-primary-light",
    },
    {
      title: "Scheduled Hours",
      value: `${totalScheduledHours} hrs`,
      subtitle: "Total rostered hours this week",
      icon: <Clock className="size-5 text-slate-700" />,
      iconClassName: "bg-slate-100",
    },
    {
      title: "Available Capacity",
      value: availableStaffCount,
      subtitle: `${onLeaveCount} currently on approved leave`,
      icon: <ShieldCheck className="size-5 text-emerald-700" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Unfilled Shifts",
      value: unfilledShiftsCount,
      subtitle: "Shifts without assigned staff",
      subtitleColor:
        unfilledShiftsCount > 0 ? "text-amber-700 font-medium" : "text-slate-500",
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

      <Card variant="surface" border="default" className="p-5 font-sans gap-4 border-none shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-secondary/50">
          <div>
            <Text as="h2" size="md" weight="semibold" className="text-slate-900">
              Staff Allocation ({filteredRows.length} shown of {totalStaff})
            </Text>
            <Text size="md" variant="muted">
              Shift workload, care-type distribution, and resident/property allocation from the rota.
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
            rows={filteredRows}
            totalStaffCount={totalStaff}
            onReassignStaff={onReassignStaff}
          />
        ) : (
          <StaffAllocationCardGrid
            rows={filteredRows}
            onReassignStaff={onReassignStaff}
          />
        )}
      </Card>
    </div>
  );
}
