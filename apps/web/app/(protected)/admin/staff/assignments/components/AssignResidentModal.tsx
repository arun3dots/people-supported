"use client";

import React, { useState } from "react";
import { Search, X, ChevronLeft, CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/Dialog";
import { Input } from "@repo/ui/components/ui/Input";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { useGetResidentsQuery } from "../../../../../../lib/queries/residents";
import { Resident } from "../../../../../../lib/types/resident";

export interface SelectedResidentItem {
  id: string;
  name: string;
  roomBed: string;
  dependency: "Low" | "Medium" | "High";
  conditions: string[];
  status: string;
  competencyPercent: number;
  competencyLabel: "Excellent Match" | "Suitable" | "Not matching";
  overview: "Recommended" | "Assign Anyway" | "Risk Involved";
  avatar?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function mapResidentToItem(resident: Resident, staffRole?: string): SelectedResidentItem {
  // Derive real dependency from careProfile careComplexity or careCategory
  const rawComplexity = (
    resident.careProfile?.careComplexity ||
    resident.careProfile?.careCategory ||
    ((resident as unknown as Record<string, unknown>).careLevel as string) ||
    ""
  ).toLowerCase();

  let dependency: SelectedResidentItem["dependency"] = "Medium";
  if (rawComplexity.includes("high") || rawComplexity.includes("complex") || rawComplexity.includes("nursing")) {
    dependency = "High";
  } else if (rawComplexity.includes("low") || rawComplexity.includes("independent") || rawComplexity.includes("residential")) {
    dependency = "Low";
  }

  // Competency matching against staff role & resident complexity
  const isNurse = staffRole?.toLowerCase().includes("nurse");
  const isSenior = staffRole?.toLowerCase().includes("senior");

  let competencyPercent = 88;
  if (dependency === "High" && !isNurse && !isSenior) {
    competencyPercent = 65; // Suitable with oversight
  } else if (dependency === "High" && (isNurse || isSenior)) {
    competencyPercent = 95;
  } else if (dependency === "Low") {
    competencyPercent = 92;
  }

  const competencyLabel: SelectedResidentItem["competencyLabel"] =
    competencyPercent >= 80 ? "Excellent Match" : competencyPercent >= 55 ? "Suitable" : "Not matching";

  const overview: SelectedResidentItem["overview"] =
    competencyLabel === "Excellent Match"
      ? "Recommended"
      : competencyLabel === "Suitable"
        ? "Assign Anyway"
        : "Risk Involved";

  // Build room/bed display string
  const room = resident.bed?.room?.roomNumber
    ? `Room: ${resident.bed.room.roomNumber}`
    : "No Room Assigned";
  const bed = resident.bed?.number ? `Bed No: ${resident.bed.number}` : "No Bed";
  const roomBed = `${bed} | ${room}`;

  // Derive real conditions from clinical profile
  const conditions: string[] = [];
  if (resident.careProfile?.chronicConditions && Array.isArray(resident.careProfile.chronicConditions)) {
    conditions.push(...resident.careProfile.chronicConditions.slice(0, 3));
  }
  if (resident.dnarStatus) conditions.push("DNAR");
  if (resident.careProfile?.mobility) conditions.push(resident.careProfile.mobility);
  if (conditions.length === 0) conditions.push(resident.fundingType || "General Care");

  return {
    id: resident.id,
    name: resident.fullName,
    roomBed,
    dependency,
    conditions,
    status: resident.status === "Active" ? "Active" : resident.status,
    competencyPercent,
    competencyLabel,
    overview,
    avatar: resident.photoUrl,
  };
}

interface AssignResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName?: string;
  staffRole?: string;
  staffAvatar?: string;
  compliancePercent?: number;
  maxCapacity?: number;
  currentResidents?: number;
  remainingCapacity?: number;
  onProceedToReview: (selectedResidents: SelectedResidentItem[]) => void;
}

export function AssignResidentModal({
  isOpen,
  onClose,
  staffName = "Staff Member",
  staffRole = "Care Assistant",
  staffAvatar,
  compliancePercent = 93,
  maxCapacity = 7,
  currentResidents = 0,
  remainingCapacity = 7,
  onProceedToReview,
}: AssignResidentModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dependencyFilter, setDependencyFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: residents = [], isLoading } = useGetResidentsQuery({ enabled: isOpen });

  const allItems: SelectedResidentItem[] = residents
    .filter((r: Resident) => r.status === "Active")
    .map((r: Resident) => mapResidentToItem(r, staffRole));

  const filteredItems = allItems.filter((res) => {
    const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDep = dependencyFilter === "all" || res.dependency === dependencyFilter;
    return matchesSearch && matchesDep;
  });

  if (!isOpen) return null;

  const toggleSelectResident = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedResidents = allItems.filter((r) => selectedIds.includes(r.id));

  const renderDependencyBadge = (dep: "Low" | "Medium" | "High") => {
    if (dep === "High") {
      return (
        <span className="px-3 py-1 rounded-full border border-red-300 text-red-500 bg-red-50/50 text-md font-semibold">
          High
        </span>
      );
    }
    if (dep === "Medium") {
      return (
        <span className="px-3 py-1 rounded-full border border-amber-300 text-amber-600 bg-amber-50/50 text-md font-semibold">
          Medium
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full border border-emerald-300 text-emerald-600 bg-emerald-50/50 text-md font-semibold">
        Low
      </span>
    );
  };

  const renderOverviewTag = (overview: "Recommended" | "Assign Anyway" | "Risk Involved") => {
    if (overview === "Recommended") {
      return (
        <div className="flex items-center gap-1.5 text-md font-bold text-[#3D5C57]">
          <CheckCircle2 className="size-4 text-[#3D5C57]" />
          <span>Recommended</span>
        </div>
      );
    }
    if (overview === "Assign Anyway") {
      return (
        <div className="flex items-center gap-1.5 text-md font-bold text-amber-600">
          <AlertTriangle className="size-4 text-amber-600" />
          <span>Assign Anyway</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-md font-bold text-red-500">
        <AlertCircle className="size-4 text-red-500" />
        <span>Risk Involved</span>
      </div>
    );
  };

  const renderCompetencyGauge = (percent: number, label: string) => {
    let strokeColor = "stroke-[#3D5C57]";
    let textColor = "text-[#3D5C57]";
    if (percent <= 35) {
      strokeColor = "stroke-red-500";
      textColor = "text-red-500";
    } else if (percent <= 70) {
      strokeColor = "stroke-amber-500";
      textColor = "text-amber-600";
    }

    const radius = 15;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative size-10 flex items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r={radius} className="stroke-slate-200/80" strokeWidth="3.5" fill="transparent" />
            <circle
              cx="18"
              cy="18"
              r={radius}
              className={`${strokeColor} transition-all duration-500`}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-slate-800">
            {percent}%
          </span>
        </div>
        <span className={`text-[10px] font-semibold mt-0.5 ${textColor}`}>{label}</span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="3xl" className="flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b pb-4 border-slate-100 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Assign Resident to {staffName}
            </DialogTitle>
            <p className="text-md text-slate-500 font-medium mt-0.5">
              Assign staff to shift or residents based on skills, competencies, and availability
            </p>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-5 py-4 pr-1">
          {/* Staff Profile Header Card */}
          <div className="bg-[#F9FAFB] border border-slate-100 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-600 shrink-0 border border-slate-200 flex items-center justify-center text-white font-bold text-md">
                {staffAvatar ? (

                  <img src={staffAvatar} alt={staffName} className="object-cover size-full" />
                ) : (
                  getInitials(staffName)
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{staffName}</h4>
                <p className="text-md text-slate-500 font-medium">{staffRole}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-6 border-l border-slate-200 pl-6">
              <div className="flex items-center gap-2">
                <div className="relative size-10 flex items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" className="stroke-slate-200" strokeWidth="3" fill="transparent" />
                    <circle cx="18" cy="18" r="14" className="stroke-[#3D5C57]" strokeWidth="3"
                      strokeDasharray={`${(compliancePercent / 100) * 87.96} 87.96`}
                      strokeLinecap="round" fill="transparent" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800">{compliancePercent}%</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-600">Compliance</div>
              </div>

              <div className="text-center border-l border-slate-200 pl-6">
                <div className="text-[11px] font-medium text-slate-500">Max Capacity</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{maxCapacity.toString().padStart(2, '0')}</div>
              </div>

              <div className="text-center border-l border-slate-200 pl-6">
                <div className="text-[11px] font-medium text-slate-500">Current Residents</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{currentResidents.toString().padStart(2, '0')}</div>
              </div>

              <div className="text-center border-l border-slate-200 pl-6">
                <div className="text-[11px] font-medium text-slate-500">Remaining Capacity</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{remainingCapacity.toString().padStart(2, '0')}</div>
              </div>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search Residents"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-full bg-white border-slate-200 text-md shadow-2xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={dependencyFilter} onValueChange={setDependencyFilter}>
                <SelectTrigger className="h-10 w-36 rounded-full bg-white border-slate-200 text-md font-medium px-4">
                  <SelectValue placeholder="All Dependency" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Dependency</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <button
                type="button"
                className="text-md font-semibold text-slate-500 hover:text-slate-700 px-2"
                onClick={() => { setSearchTerm(""); setDependencyFilter("all"); }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Residents Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-[#F9FAFB]/50 p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-slate-400">
                <Loader2 className="size-5 animate-spin mr-2" />
                <span className="text-md font-medium">Loading residents…</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-md font-medium">
                No active residents found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-600  border-b border-slate-200/80">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                        onChange={() => {
                          if (selectedIds.length === filteredItems.length) setSelectedIds([]);
                          else setSelectedIds(filteredItems.map(r => r.id));
                        }}
                        className="rounded border-slate-300 text-[#3D5C57] focus:ring-[#3D5C57] size-4 accent-[#3D5C57]"
                      />
                    </th>
                    <th className="py-3 px-4">Resident Name</th>
                    <th className="py-3 px-4">Dependency</th>
                    <th className="py-3 px-4">Conditions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Competency</th>
                    <th className="py-3 px-4">Overview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-md bg-white rounded-xl">
                  {filteredItems.map((res) => {
                    const isSelected = selectedIds.includes(res.id);
                    return (
                      <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectResident(res.id)}
                            className="rounded border-slate-300 text-[#3D5C57] focus:ring-[#3D5C57] size-4 accent-[#3D5C57] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full overflow-hidden bg-gradient-to-br from-violet-400 to-purple-600 shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                              {res.avatar ? (

                                <img src={res.avatar} alt={res.name} className="object-cover size-full" />
                              ) : (
                                getInitials(res.name)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{res.name}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{res.roomBed}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{renderDependencyBadge(res.dependency)}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[210px]">
                            {res.conditions.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600 text-[10px] font-medium shadow-2xs">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-md font-semibold text-emerald-600">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span>{res.status}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderCompetencyGauge(res.competencyPercent, res.competencyLabel)}
                        </td>
                        <td className="py-3.5 px-4">{renderOverviewTag(res.overview)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 bg-white text-md font-bold hover:bg-slate-50 flex items-center gap-1.5"
          >
            <ChevronLeft className="size-4 text-slate-500" />
            <span>Back to Staff Assignment</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-md font-bold text-slate-700">
              {selectedIds.length} Residents Selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-md font-bold text-red-600 hover:text-red-700 underline"
            >
              Clear Selection
            </button>
          </div>

          <Button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={() => onProceedToReview(selectedResidents)}
            className="px-7 py-2.5 rounded-xl bg-[#3D5C57] hover:bg-[#2D4541] text-white text-md font-bold shadow-md"
          >
            Assign Residents
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
