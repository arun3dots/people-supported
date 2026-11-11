"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Timer,
  AlertCircle,
  MapPin,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  Text,
  EmptyState,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { useGetShiftRequestsQuery, useGetMyShiftsQuery } from "../../queries/shifts";
import { ShiftRequestDialog } from "./ShiftRequestDialog";
import { type ShiftRequest } from "../../types/shifts";
import { formatUkDate, formatUkTime } from "../../utils/uk-date-time";

type RequestFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export function StaffRequestsView() {
  const { data: rawRequests = [], isLoading } = useGetShiftRequestsQuery();
  const { data: myShifts = [] } = useGetMyShiftsQuery();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<RequestFilter>("ALL");

  const requests = Array.isArray(rawRequests) ? rawRequests : [];

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const r of requests) {
      if (r.status === "Approved") approved++;
      else if (r.status === "Rejected") rejected++;
      else pending++;
    }
    return { all: requests.length, pending, approved, rejected };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (filter === "ALL") return requests;
    if (filter === "PENDING") return requests.filter((r) => r.status === "Pending");
    if (filter === "APPROVED") return requests.filter((r) => r.status === "Approved");
    if (filter === "REJECTED") return requests.filter((r) => r.status === "Rejected");
    return requests;
  }, [requests, filter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge variant="outline" state="success" className="p-0 px-2 py-0.5 text-md font-semibold rounded-md shadow-none">
            Approved
          </Badge>
        );
      case "Rejected":
        return (
          <Badge variant="outline" state="danger" className="p-0 px-2 py-0.5 text-md font-semibold rounded-md shadow-none">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" state="warning" className="p-0 px-2 py-0.5 text-md font-semibold rounded-md shadow-none">
            Pending
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 className="size-4 text-emerald-600" />;
      case "Rejected":
        return <XCircle className="size-4 text-rose-600" />;
      default:
        return <Timer className="size-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 font-['Outfit',sans-serif] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Text size="xl" weight="bold" className="tracking-tight">
            Leave Management
          </Text>
          <Text variant="subdued" size="md" weight="regular">
            Submit and manage annual leave requests, shift swaps, and coverage requests with senior management sign-off.
          </Text>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="size-4" /> New request
        </Button>
      </div>

      {/* KPI / Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: "ALL" as const, label: "All requests", count: counts.all, color: "text-slate-900" },
          { id: "PENDING" as const, label: "Pending sign-off", count: counts.pending, color: "text-amber-700" },
          { id: "APPROVED" as const, label: "Approved", count: counts.approved, color: "text-emerald-700" },
          { id: "REJECTED" as const, label: "Rejected / Withdrawn", count: counts.rejected, color: "text-rose-600" },
        ].map((tab) => {
          const isSelected = filter === tab.id;
          return (
            <Card
              key={tab.id}
              variant="white"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "p-4 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between min-h-[88px] text-left gap-0",
                isSelected
                  ? "ring-2 ring-emerald-800 border-emerald-800 shadow-sm"
                  : "border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm"
              )}
            >
              <Text size="md" weight="semibold" className="text-slate-700 leading-tight">
                {tab.label}
              </Text>
              <Text size="2xl" weight="bold" className={cn("tracking-tight leading-none mt-2", tab.color)}>
                {tab.count}
              </Text>
            </Card>
          );
        })}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card variant="white" className="rounded-2xl border-dashed border-2 border-slate-200 p-12 text-center">
            <EmptyState
              title={filter === "ALL" ? "No shift requests" : `No ${filter.toLowerCase()} requests`}
              description="Submit a request for upcoming leave, swap an assigned shift with a colleague, or request cover."
              className="py-2"
            />
          </Card>
        ) : (
          filteredRequests.map((request: ShiftRequest) => {
            const startD = new Date(request.startTime);
            const endD = new Date(request.endTime);
            const isValidDates = !isNaN(startD.getTime()) && !isNaN(endD.getTime());

            return (
              <Card
                key={request.id}
                variant="white"
                className="rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-slate-300 transition-colors gap-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 flex items-center justify-center shrink-0">
                      <Calendar className="size-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Text size="md" weight="bold" className="text-slate-900">
                          {request.type === "Leave" ? "Annual Leave" : request.type === "Change" ? "Shift Swap" : "Cover Request"}
                        </Text>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-md text-slate-500">
                        {isValidDates && (
                          <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Clock className="size-3.5 text-slate-400" />
                            {formatUkDate(startD, { day: "numeric", month: "short", year: "numeric" })}, {formatUkTime(startD)} – {formatUkDate(endD, { day: "numeric", month: "short", year: "numeric" })}, {formatUkTime(endD)}
                          </span>
                        )}

                        {request.shift && (
                          <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-md">
                            <MapPin className="size-3 text-slate-400" />
                            {request.shift.type?.name || "Shift"}
                          </span>
                        )}

                        {request.reason && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <AlertCircle className="size-3.5 text-slate-400" />
                            {request.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <Text size="md" variant="muted" className="text-md uppercase font-bold tracking-wider text-slate-400">
                        Submitted
                      </Text>
                      <Text size="md" weight="semibold" className="text-slate-800">
                        {formatUkDate(new Date(request.createdAt), { day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                    </div>
                    <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                      {getStatusIcon(request.status)}
                    </div>
                  </div>
                </div>

                {request.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-md text-slate-600">
                      <Text size="md" weight="bold" className="text-slate-800 uppercase text-md tracking-wider mb-0.5">
                        Notes
                      </Text>
                      <Text size="md" className="text-slate-600 leading-relaxed">
                        {request.notes}
                      </Text>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Request Modal */}
      <ShiftRequestDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        myShifts={myShifts}
      />
    </div>
  );
}
