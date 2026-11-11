"use client";

import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "@repo/ui/components/ui/Input";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";

interface StaffFilterSectionProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  schemeFilter?: string;
  setSchemeFilter?: (val: string) => void;
  propertyFilter?: string;
  setPropertyFilter?: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  roles?: { id: string; name: string }[];
  schemes?: { id: string; name: string }[];
  properties?: { id: string; name: string }[];
  onReset: () => void;
}

export function StaffFilterSection({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  schemeFilter = "All Schemes",
  setSchemeFilter,
  propertyFilter = "All Properties",
  setPropertyFilter,
  statusFilter,
  setStatusFilter,
  roles = [],
  schemes = [],
  properties = [],
  onReset,
}: StaffFilterSectionProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between font-sans">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px] [&_[data-slot=input-error]]:hidden">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search by name, staff ID, mobile or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-800 shadow-none"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Roles Filter */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[130px] h-10 bg-white border-slate-200 rounded-xl text-md font-medium text-slate-700">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Roles">All Roles</SelectItem>
            {roles
              .filter((r) => r.name.toLowerCase() !== "resident")
              .map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Scheme Filter */}
        {setSchemeFilter && (
          <Select value={schemeFilter} onValueChange={setSchemeFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 rounded-xl text-md font-medium text-slate-700">
              <SelectValue placeholder="All Schemes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Schemes">All Schemes</SelectItem>
              {schemes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Property Filter */}
        {setPropertyFilter && (
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 rounded-xl text-md font-medium text-slate-700">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Properties">All Properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[125px] h-10 bg-white border-slate-200 rounded-xl text-md font-medium text-slate-700">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="h-10 px-3 rounded-xl border-slate-200 text-md font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
