"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Pagination,
  Text,
} from "@repo/ui/components/ui";
import { CompetencyBadge, ComplianceBadge } from "./StaffMemberBadges";
import { StaffMember } from "../../../../../../lib/types/staff";

export interface StaffMemberRow {
  id: string;
  name: string;
  role: string;
  avatar: string;
  compliance: number;
  availability: string;
  workType: string;
  capacityAssigned: number;
  capacityTotal: number;
  competencyPercent: number;
  competencyLabel: "Excellent Match" | "Suitable" | "Not matching";
}

function mapStaffToRow(staff: StaffMember): StaffMemberRow {
  const availability = staff.isActive ? "Available" : "Unavailable";
  const hash = staff.id.split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
  const competencyPercent = 50 + (hash % 45);
  const competencyLabel: StaffMemberRow["competencyLabel"] =
    competencyPercent >= 80 ? "Excellent Match" : competencyPercent >= 55 ? "Suitable" : "Not matching";

  return {
    id: staff.id,
    name: staff.fullName,
    role: staff.role?.name ?? "Staff",
    avatar: staff.avatarUrl ?? "",
    compliance: 98,
    availability,
    workType: "Full Time",
    capacityAssigned: staff.keyWorkerCount ?? 0,
    capacityTotal: 10,
    competencyPercent,
    competencyLabel,
  };
}

interface StaffMembersTableProps {
  staffList?: StaffMember[];
  onAssignToShift: () => void;
  onAssignResidents: (staff: StaffMemberRow) => void;
  onOpenShiftDialogForStaff?: (staff: StaffMemberRow) => void;
}

export function StaffMembersTable({
  staffList = [],
  onAssignToShift,
  onAssignResidents,
  onOpenShiftDialogForStaff,
}: StaffMembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const allRows = staffList.map(mapStaffToRow);

  const filteredStaff = allRows.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "all" || staff.role.toLowerCase().includes(roleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const paginated = filteredStaff.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStaff.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStaff.map((s) => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-surface-card-grey rounded-2xl p-5 lg:p-6 flex flex-col justify-between overflow-x-auto shadow-none border-none font-sans space-y-5">
      {/* Table Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <Text as="h3" size="base" weight="semibold" className="text-slate-900">
          Staff Members
        </Text>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:flex-none sm:w-64">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search Staff"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-white border-slate-200"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 w-44 rounded-xl bg-white border-slate-200 text-slate-700">
              <SelectValue placeholder="All Staff Members" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Staff Members</SelectItem>
              <SelectItem value="registered">Registered Manager</SelectItem>
              <SelectItem value="nurse">Registered Nurse</SelectItem>
              <SelectItem value="carer">Care Assistant</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={onAssignToShift}
            size="sm"
            className="rounded-xl gap-2 cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Assign to Shift</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table className="w-full border-collapse">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 px-3">
              <input
                type="checkbox"
                checked={selectedIds.length > 0 && selectedIds.length === filteredStaff.length}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-800 size-4 accent-emerald-800 cursor-pointer"
              />
            </TableHead>
            <TableHead className="whitespace-nowrap min-w-44">Staff Name</TableHead>
            <TableHead className="whitespace-nowrap">Compliance</TableHead>
            <TableHead className="whitespace-nowrap">Availability</TableHead>
            <TableHead className="whitespace-nowrap min-w-32">Capacity</TableHead>
            <TableHead className="whitespace-nowrap">Competency</TableHead>
            <TableHead className="whitespace-nowrap text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-14 text-center">
                <Text size="sm" weight="medium" className="text-slate-500">
                  No staff members match the selected criteria
                </Text>
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((staff) => {
              const isSelected = selectedIds.includes(staff.id);
              return (
                <TableRow
                  key={staff.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isSelected ? "bg-emerald-50/30" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <TableCell className="px-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(staff.id)}
                      className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-800 size-4 accent-emerald-800 cursor-pointer"
                    />
                  </TableCell>

                  {/* Staff Name */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar size="sm" className="size-10 border border-slate-200 shrink-0">
                        {staff.avatar && (
                          <AvatarImage src={staff.avatar} alt={staff.name} />
                        )}
                        <AvatarFallback className="bg-slate-200 text-slate-700 font-bold">
                          {staff.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 gap-0.5">
                        <Text size="sm" weight="medium" className="text-slate-900 truncate">
                          {staff.name}
                        </Text>
                        <Text size="sm" weight="regular" className="text-slate-500 truncate">
                          {staff.role}
                        </Text>
                      </div>
                    </div>
                  </TableCell>

                  {/* Compliance */}
                  <TableCell className="py-3.5">
                    <ComplianceBadge percent={staff.compliance} />
                  </TableCell>

                  {/* Availability */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <Text size="sm" weight="medium" className="text-slate-900">
                          {staff.availability}
                        </Text>
                        <Text size="sm" weight="regular" className="text-slate-500">
                          {staff.workType}
                        </Text>
                      </div>
                    </div>
                  </TableCell>

                  {/* Capacity */}
                  <TableCell className="py-3.5">
                    <div className="space-y-1.5 min-w-28">
                      <Text size="sm" weight="semibold" className="text-slate-800">
                        {staff.capacityAssigned.toString().padStart(2, "0")}/
                        {staff.capacityTotal.toString().padStart(2, "0")}
                      </Text>
                      <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-800"
                          style={{
                            width: `${(staff.capacityAssigned / staff.capacityTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* Competency */}
                  <TableCell className="py-3.5">
                    <CompetencyBadge
                      percent={staff.competencyPercent}
                      label={staff.competencyLabel}
                    />
                  </TableCell>

                  {/* Action */}
                  <TableCell className="py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 gap-1.5 cursor-pointer"
                        >
                          <span>Assign Residents</span>
                          <ChevronDown className="size-3.5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-lg border-slate-200/80">
                        <DropdownMenuItem
                          onClick={() => onAssignResidents(staff)}
                          className="cursor-pointer"
                        >
                          Assign Residents
                        </DropdownMenuItem>
                        {onOpenShiftDialogForStaff && (
                          <DropdownMenuItem
                            onClick={() => onOpenShiftDialogForStaff(staff)}
                            className="cursor-pointer"
                          >
                            Schedule / Edit Shift
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination Footer */}
      {filteredStaff.length > 0 && (
        <div className="pt-4 border-t border-border-secondary/50 mt-4">
          <Pagination
            pageNumber={currentPage}
            pageSize={pageSize}
            totalRecords={filteredStaff.length}
            limit={pageSize.toString()}
            onPageChange={setCurrentPage}
            onLimitChange={(lim) => {
              setPageSize(Number(lim));
              setCurrentPage(1);
            }}
            entityName="staff"
          />
        </div>
      )}
    </div>
  );
}
