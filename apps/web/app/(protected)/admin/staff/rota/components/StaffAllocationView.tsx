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
import type { StaffMember } from "../../../../../../lib/types/staff";
import { StaffAllocationCardGrid } from "./StaffAllocationCardGrid";
import { StaffAllocationTable } from "./StaffAllocationTable";

interface StaffAllocationViewProps {
  schemes: SchemeItem[];
  properties: PropertyItem[];
  staff: StaffMember[];
  activeCareType: string;
  onReassignStaff: (staff: StaffMember) => void;
}

export function StaffAllocationView({
  schemes,
  properties,
  staff,
  onReassignStaff,
}: StaffAllocationViewProps): React.JSX.Element {
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const filteredStaff = useMemo(() => {
    return staff.filter((m) => {
      if (schemeFilter !== "all" && m.schemeId !== schemeFilter) return false;
      if (propertyFilter !== "all" && m.propertyId !== propertyFilter)
        return false;
      if (staffFilter !== "all" && m.id !== staffFilter) return false;
      return true;
    });
  }, [staff, schemeFilter, propertyFilter, staffFilter]);

  const kpiCards: SummaryCardItem[] = [
    {
      title: "Total Assigned Staff",
      value: staff.length || 24,
      subtitle: "Across all schemes and properties",
      icon: <UserCheck className="size-5 text-primary" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Active Schemes",
      value: schemes.length || 3,
      subtitle: "Supported living schemes",
      icon: <Building2 className="size-5 text-slate-700" />,
      iconClassName: "bg-slate-100",
    },
    {
      title: "Properties Covered",
      value: properties.length || 6,
      subtitle: "With allocated staff",
      icon: <Home className="size-5 text-primary" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Unfilled Assignments",
      value: 2,
      subtitle: "Properties/shifts needing cover",
      subtitleColor: "text-amber-700 font-medium",
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
        border="secondary"
        className="p-4 flex-col lg:flex-row lg:items-center justify-between gap-3"
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

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            onClick={() => setViewMode("table")}
            size="sm"
            variant={viewMode === "table" ? "primary" : "outline"}
            className="h-9 rounded-xl px-3 font-medium"
          >
            <List className="size-3.5" />
            Table View
          </Button>
          <Button
            type="button"
            onClick={() => setViewMode("card")}
            size="sm"
            variant={viewMode === "card" ? "primary" : "outline"}
            className="h-9 rounded-xl px-3 font-medium"
          >
            <LayoutGrid className="size-3.5" />
            Card View
          </Button>
        </div>
      </Card>

      {filteredStaff.length === 0 ? (
        <Card variant="surface" className="p-0">
          <EmptyState
            title="No staff allocations match your filters"
            description="Try clearing or adjusting the scheme, property, or staff member filter."
          />
        </Card>
      ) : viewMode === "card" ? (
        <StaffAllocationCardGrid
          staffList={filteredStaff}
          onReassignStaff={onReassignStaff}
        />
      ) : (
        <StaffAllocationTable
          filteredStaff={filteredStaff}
          totalStaffCount={staff.length}
          onReassignStaff={onReassignStaff}
        />
      )}
    </div>
  );
}
