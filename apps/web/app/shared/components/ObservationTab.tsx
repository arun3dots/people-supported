"use client";

import React, { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetFoodFluidLogsQuery, useGetResidentObservationsQuery } from "../../../lib/queries/residents";
import { format } from "date-fns";
import {
  Plus, Eye, AlertTriangle, ClipboardCheck,
  TrendingUp, Loader2, Clock, Search,
} from "lucide-react";
import {
  Button, Badge, Table, TableBody,
  TableCell, TableHead, TableHeader, TableRow, Text,
} from "@repo/ui/components/ui";
import { AddObservationDialog } from "./AddObservationDialog";
import { ObservationDetailModal } from "./ObservationDetailModal";
import { usePagination } from "@repo/ui/hooks";
import { Pagination } from "@repo/ui/components/ui/Pagination";

interface ObservationTabProps {
  residentId: string;
  selectedDate?: Date;
  residentStatus?: string;
  isDraft?: boolean;
}

export function ObservationTab({
  residentId,
  selectedDate,
  residentStatus,
  isDraft = false,
}: ObservationTabProps) {
  const isDischarged = residentStatus === "Discharged" || isDraft;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAddModalOpen = searchParams.get("isAddModalOpen") === "true";
  const [detailObs, setDetailObs] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const updateAddModal = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (open) params.set("isAddModalOpen", "true");
    else params.delete("isAddModalOpen");
    router.replace(pathname + "?" + params.toString());
  };

  const { data: allObservations, isLoading } = useGetResidentObservationsQuery(residentId);
  const { data: fluidLogs = [] } = useGetFoodFluidLogsQuery(residentId, selectedDate);

  const observations = useMemo(() => {
    if (!allObservations) return [];
    if (!selectedDate) return allObservations;
    return allObservations.filter(
      (obs: any) => new Date(obs.timestamp).toDateString() === selectedDate.toDateString(),
    );
  }, [allObservations, selectedDate]);

  const filteredObservations = useMemo(() => {
    if (!searchTerm.trim()) return observations;
    const term = searchTerm.toLowerCase().trim();
    return observations.filter((obs: any) => {
      const dateStr = obs.timestamp ? format(new Date(obs.timestamp), "dd MMM yyyy h:mm a").toLowerCase() : "";
      const notes = (obs.notes || "").toLowerCase();
      const newsScore = obs.news2Score !== null && obs.news2Score !== undefined ? String(obs.news2Score) : "";
      const temp = obs.temp ? `${obs.temp}` : "";
      const pulse = obs.pulse ? `${obs.pulse}` : "";
      const bp = `${obs.bpSystolic || ""}/${obs.bpDiastolic || ""}`;
      const spo2 = obs.spo2 ? `${obs.spo2}` : "";
      const staff = (obs.recordedBy?.fullName || obs.carer?.fullName || "").toLowerCase();

      return [dateStr, notes, newsScore, temp, pulse, bp, spo2, staff].some((val) =>
        val.includes(term),
      );
    });
  }, [observations, searchTerm]);

  const {
    currentPage,
    pageSize,
    paginatedData: paginatedObservations,
    totalRecords,
    handlePageChange,
    handleLimitChange,
  } = usePagination(filteredObservations);

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <Badge state="info">N/A</Badge>;
    if (score === 0) return <Badge className="bg-[#4A706A] text-white border-none">0 - Normal</Badge>;
    if (score <= 4) return <Badge state="warning">{score} - Low Risk</Badge>;
    if (score <= 6) return <Badge state="warning" className="bg-amber-100 text-amber-900 border-amber-300">{score} - Medium Risk</Badge>;
    return <Badge state="danger">{score} - High Risk</Badge>;
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center font-sans">
        <Loader2 className="size-8 animate-spin text-[#4A706A] mb-3" />
        <Text size="sm" weight="medium" className="text-slate-500">Loading clinical history...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      {/* 1. Main Observations Table Container */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-4 shadow-none border-none">
        {/* Top Bar: Search on Left + Record Obs on Right */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full sm:w-80 flex items-center">
            <Search className="absolute left-3.5 size-4 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search observations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#4A706A] focus:ring-1 focus:ring-[#4A706A]/20 transition-all shadow-2xs"
            />
          </div>

          <Button
            type="button"
            onClick={() => updateAddModal(true)}
            className="h-10 rounded-xl px-4 flex items-center gap-1.5 bg-[#4A706A] hover:bg-[#3D5E59] text-white font-semibold text-sm shadow-xs cursor-pointer"
          >
            <Plus className="size-4 text-white" />
            Record Obs
          </Button>
        </div>

        {!observations || observations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xl border border-slate-200/80">
            <div className="text-center space-y-1">
              <Text as="h3" size="base" weight="semibold" className="text-base font-semibold text-slate-900">
                No observations recorded yet
              </Text>
              <Text size="sm" className="text-sm font-normal text-slate-500">
                Record the first set of vitals for this resident.
              </Text>
            </div>
            {!isDischarged && (
              <Button
                type="button"
                onClick={() => updateAddModal(true)}
                className="h-10 rounded-xl px-5 text-sm font-medium flex items-center gap-2 mt-2 bg-[#4A706A] hover:bg-[#3D5E59] text-white cursor-pointer"
              >
                <Plus className="size-4" />
                Take First Observation
              </Button>
            )}
          </div>
        ) : filteredObservations.length === 0 ? (
          <div className="py-12 text-center space-y-1 bg-white rounded-xl border border-slate-200/80">
            <Text as="h4" size="base" weight="semibold" className="text-base font-semibold text-slate-900">
              No matching observations
            </Text>
            <Text size="sm" className="text-sm font-normal text-slate-500">
              No records found matching &ldquo;{searchTerm}&rdquo;.
            </Text>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 bg-slate-50/80">
                  <TableHead className="w-12 whitespace-nowrap pl-4 pb-3 font-semibold text-[12px] text-slate-700">#</TableHead>
                  <TableHead className="pb-3 px-4 font-semibold text-[12px] text-slate-700">Date &amp; Time</TableHead>
                  <TableHead className="pb-3 px-4 font-semibold text-[12px] text-slate-700">NEWS2 Score</TableHead>
                  <TableHead className="pb-3 px-4 font-semibold text-[12px] text-slate-700">Temp</TableHead>
                  <TableHead className="pb-3 px-4 font-semibold text-[12px] text-slate-700">Pulse</TableHead>
                  <TableHead className="pb-3 px-4 font-semibold text-[12px] text-slate-700">BP</TableHead>
                  <TableHead className="pb-3 px-4 font-semibold text-[12px] text-slate-700">SpO2</TableHead>
                  <TableHead className="pb-3 px-4 text-right font-semibold text-[12px] text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-[12px]">
                {paginatedObservations.map((obs: any, index: number) => {
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <TableRow
                      key={obs.id}
                      onClick={() => setDetailObs(obs)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <TableCell className="pl-4 font-medium text-slate-500 text-[12px]">{rowNumber}</TableCell>
                      <TableCell className="px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-[12px]">
                          {format(new Date(obs.timestamp), "dd MMM yyyy")}
                        </div>
                        <div className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="size-3 text-slate-400" />
                          <span>{format(new Date(obs.timestamp), "h:mm a")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 whitespace-nowrap">{getScoreBadge(obs.news2Score)}</TableCell>
                      <TableCell className="px-4 whitespace-nowrap font-medium text-slate-700 text-[12px]">{obs.temp ? `${obs.temp}°C` : "—"}</TableCell>
                      <TableCell className="px-4 whitespace-nowrap font-medium text-slate-700 text-[12px]">{obs.pulse ? `${obs.pulse} bpm` : "—"}</TableCell>
                      <TableCell className="px-4 whitespace-nowrap font-medium text-slate-700 text-[12px]">{obs.bpSystolic ? `${obs.bpSystolic}/${obs.bpDiastolic || "?"}` : "—"}</TableCell>
                      <TableCell className="px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 text-[12px]">
                          <span>{obs.spo2 ? `${obs.spo2}%` : "—"}</span>
                          {obs.airOrOxygen === "Air" ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-300 bg-slate-50 text-slate-700">Air</Badge>
                          ) : (
                            obs.spo2 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-300 text-blue-700 bg-blue-50">O₂</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title="View Details"
                            className="hover:text-slate-900 transition-colors cursor-pointer text-slate-500 hover:bg-slate-100 p-1.5 rounded-md"
                            onClick={() => setDetailObs(obs)}
                          >
                            <Eye className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredObservations.length > 0 && (
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <Pagination
              pageNumber={currentPage}
              pageSize={pageSize}
              totalRecords={totalRecords}
              limit={pageSize.toString()}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              disabled={isLoading}
            />
          </div>
        )}
      </div>


      {/* 2. Analytics & Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pulse Trend Card */}
        <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-4 shadow-none border-none">
          <div className="flex items-center justify-between border-b border-border-secondary/80 pb-3">
            <Text as="h3" size="base" weight="semibold" className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="size-4 text-[#4A706A]" />
              Pulse Trend (Last 5)
            </Text>
          </div>
          <div className="h-[120px] flex items-end justify-between gap-2 py-2">
            {observations?.slice(0, 5).reverse().map((obs, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-[#4A706A]/20 rounded-t-md transition-all group-hover:bg-[#4A706A]/40 relative"
                  style={{ height: `${(obs.pulse || 60) * 0.8}px`, maxHeight: "80px" }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-slate-700">
                    {obs.pulse}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 truncate w-full text-center">
                  {format(new Date(obs.timestamp), "d/M")}
                </span>
              </div>
            ))}
            {!observations?.length && (
              <p className="text-sm font-normal text-slate-500 italic w-full text-center self-center">
                No trend data available
              </p>
            )}
          </div>
        </div>

        {/* Clinical Alerts Card */}
        <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-4 shadow-none border-none">
          <div className="flex items-center justify-between border-b border-border-secondary/80 pb-3">
            <Text as="h3" size="base" weight="semibold" className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Clinical Alerts
            </Text>
          </div>
          <div className="pt-1">
            {observations?.some((o) => o.isAbnormal || (o.news2Score && o.news2Score >= 5)) ? (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="size-5 text-red-600 shrink-0" />
                <div>
                  <Text size="sm" weight="bold" className="text-red-900 leading-none">Abnormal Observations Detected</Text>
                  <Text size="sm" className="text-sm font-normal text-red-700 mt-1">Review the latest high-risk scoring entries immediately.</Text>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl">
                <ClipboardCheck className="size-5 text-[#4A706A] shrink-0" />
                <div>
                  <Text size="sm" weight="bold" className="text-slate-900 leading-none">Vitals Stable</Text>
                  <Text size="sm" className="text-sm font-normal text-slate-500 mt-1">Latest parameters are within normal clinical thresholds.</Text>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddObservationDialog residentId={residentId} open={isAddModalOpen && !isDischarged} onOpenChange={(open) => !open && updateAddModal(false)} />
      <ObservationDetailModal observation={detailObs} onClose={() => setDetailObs(null)} />
    </div>
  );
}
/*  */