"use client";

import React, { useMemo, useState } from "react";
import { Building2, Home, RotateCcw, UserCheck, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Button, Card, Text, Badge } from "@repo/ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import type { SchemeItem, PropertyItem } from "../../../../../../lib/types/facility";
import type { StaffMember } from "../../../../../../lib/types/staff";

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
  activeCareType,
  onReassignStaff,
}: StaffAllocationViewProps): React.JSX.Element {
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const filteredStaff = useMemo(() => {
    return staff.filter((m) => {
      if (schemeFilter !== "all" && m.schemeId !== schemeFilter) return false;
      if (propertyFilter !== "all" && m.propertyId !== propertyFilter) return false;
      if (staffFilter !== "all" && m.id !== staffFilter) return false;
      return true;
    });
  }, [staff, schemeFilter, propertyFilter, staffFilter]);

  return (
    <div className="space-y-6 font-sans">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card variant="white" border="secondary" className="p-4 gap-1 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <UserCheck className="size-4 text-primary" />
            <Text size="md" weight="medium">Total Assigned Staff</Text>
          </div>
          <Text size="2xl" weight="semibold">{staff.length || 24}</Text>
          <Text size="md" variant="subdued" className="text-slate-400 mt-0.5">Across all schemes and properties</Text>
        </Card>

        <Card variant="white" border="secondary" className="p-4 gap-1 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Building2 className="size-4 text-primary" />
            <Text size="md" weight="medium">Active Schemes</Text>
          </div>
          <Text size="2xl" weight="semibold">{schemes.length || 3}</Text>
          <Text size="md" variant="subdued" className="text-slate-400 mt-0.5">Supported living schemes</Text>
        </Card>

        <Card variant="white" border="secondary" className="p-4 gap-1 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Home className="size-4 text-primary" />
            <Text size="md" weight="medium">Properties Covered</Text>
          </div>
          <Text size="2xl" weight="semibold">{properties.length || 6}</Text>
          <Text size="md" variant="subdued" className="text-slate-400 mt-0.5">With allocated staff</Text>
        </Card>

        <Card variant="white" border="secondary" className="bg-amber-50/50 p-4 gap-1 shadow-xs">
          <div className="flex items-center gap-2 text-amber-800 mb-1">
            <AlertTriangle className="size-4 text-amber-600" />
            <Text size="md" weight="medium" className="text-amber-800">Unfilled Assignments</Text>
          </div>
          <Text size="2xl" weight="semibold" className="text-amber-900">2</Text>
          <Text size="md" className="text-amber-700 mt-0.5">Properties/shifts needing cover</Text>
        </Card>
      </div>

      {/* Filter Row */}
      <Card variant="white" border="secondary" className="p-4 flex-row flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={schemeFilter} onValueChange={setSchemeFilter}>
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
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((p) => (
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

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-md font-semibold">
          <Button
            type="button"
            onClick={() => setViewMode("table")}
            size="sm"
            variant={viewMode === "table" ? "primary" : "ghost"}
            className="h-9 rounded-lg px-3 transition-all"
          >
            Table View
          </Button>
          <Button
            type="button"
            onClick={() => setViewMode("card")}
            size="sm"
            variant={viewMode === "card" ? "primary" : "ghost"}
            className="h-9 rounded-lg px-3 transition-all"
          >
            Card View
          </Button>
        </div>
      </Card>

      {/* Allocations Table */}
      <Card variant="white" border="secondary" className="gap-0 overflow-hidden p-0 shadow-xs">
        <div className="p-4 border-b border-slate-100">
          <Text as="h2" size="md" weight="semibold">
            Staff Allocation ({filteredStaff.length} shown of {staff.length})
          </Text>
          <Text size="md" variant="subdued">
            Manage primary, secondary and night cover allocations across homes
          </Text>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-md">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Scheme</th>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Assignment Type</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStaff.map((m, idx) => {
                const initials = m.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                const schemeName = m.scheme?.name || "North Yorkshire Supported Living";
                const propName = m.property?.name || "Oak House";
                const isNight = m.role?.name?.toLowerCase().includes("night");

                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-primary text-primary-foreground font-semibold text-md flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <Text size="md" weight="semibold">{m.fullName}</Text>
                          <Text size="md" variant="subdued">STA-{m.id.slice(0, 3).toUpperCase()}</Text>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={isNight ? "warning" : "success"}
                        className={`border p-0 px-2 py-0.5 text-md font-medium ${isNight ? "border-amber-200/60" : "border-emerald-200/60"}`}
                      >
                        {m.role?.name || "Support Worker"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 max-w-[180px] truncate text-slate-700">
                        <Building2 className="size-3 text-slate-400 shrink-0" />
                        <span className="truncate">{schemeName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 max-w-[140px] truncate text-slate-700">
                        <Home className="size-3 text-slate-400 shrink-0" />
                        <span className="truncate">{propName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="rounded-md border-0 bg-slate-100 p-0 px-2 py-0.5 text-md font-medium text-slate-700">
                        {isNight ? "Night Cover" : "Primary"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Text as="span" size="md" weight="medium" variant="primary" className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-primary" />
                        Available
                      </Text>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success" className="border border-emerald-200/60 p-0 px-2 py-0.5 text-md font-medium">
                        Active
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="default"
                          onClick={() => onReassignStaff(m)}
                          className="h-10 px-3 text-md text-slate-600 hover:text-primary"
                        >
                          <ArrowRightLeft className="size-4" /> Reassign
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
