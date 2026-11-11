"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Download,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button, Text, Badge } from "@repo/ui/components/ui";
import { Input } from "@repo/ui/components/ui/Input";
import { useToast } from "@repo/ui/hooks";
import {
  useGetLeaveRequestsQuery,
  useUpdateLeaveRequestStatusMutation,
  type LeaveRequestItem,
} from "../../../../../lib/queries/shifts";
import { useGetStaffQuery } from "../../../../../lib/queries/staff";
import { NewLeaveRequestModal } from "./components/NewLeaveRequestModal";

export function LeaveRequestManagementClient(): React.JSX.Element {
  const { toast } = useToast();
  const { data: requests = [], isLoading } = useGetLeaveRequestsQuery();
  const { data: staffList = [] } = useGetStaffQuery();
  const updateStatusMutation = useUpdateLeaveRequestStatusMutation();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Pending");
  const [search, setSearch] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeTab !== "all" && r.status !== activeTab) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const staffName = r.staff?.fullName?.toLowerCase() || "";
        const ref = r.id.slice(0, 8).toLowerCase();
        return staffName.includes(query) || ref.includes(query) || r.type.toLowerCase().includes(query);
      }
      return true;
    });
  }, [requests, activeTab, search]);

  const counts = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "Pending").length,
      approved: requests.filter((r) => r.status === "Approved").length,
      declined: requests.filter((r) => r.status === "Declined").length,
      cancelled: requests.filter((r) => r.status === "Cancelled").length,
      all: requests.length,
    };
  }, [requests]);

  const handleUpdateStatus = async (id: string, status: "Approved" | "Declined") => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        data: { status },
      });
      toast({
        title: `Request ${status}`,
        description: `Leave request has been marked as ${status.toLowerCase()}.`,
      });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err instanceof Error ? err.message : "Failed to update request status",
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-md font-semibold text-slate-500 mb-1">Rota Management &gt; Leave Request Management</div>
          <Text size="xl" weight="bold" className="tracking-tight text-slate-900">
            Leave Request Management
          </Text>
          <Text variant="subdued" size="md" weight="regular" className="text-slate-500">
            Review annual, sick and training leave, see rota impact and arrange cover before approving.
          </Text>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-10 px-3.5 rounded-xl border-slate-200 text-md font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Download className="size-3.5" />
            Export
          </Button>
          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl h-10 px-4 text-md font-bold flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/60 shadow-xs">
          <div className="flex items-center gap-2 text-amber-800 mb-1">
            <Clock className="size-4" />
            <Text size="md" weight="medium">Awaiting Review</Text>
          </div>
          <div className="text-2xl font-bold text-amber-900">{counts.pending}</div>
          <Text size="md" className="text-amber-700 mt-0.5">Oldest submitted recently</Text>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CheckCircle2 className="size-4 text-emerald-800" />
            <Text size="md" weight="medium">Approved</Text>
          </div>
          <div className="text-2xl font-bold text-slate-900">{counts.approved}</div>
          <Text size="md" variant="subdued" className="text-slate-400 mt-0.5">This month</Text>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <AlertTriangle className="size-4 text-rose-600" />
            <Text size="md" weight="medium">Cover Needed</Text>
          </div>
          <div className="text-2xl font-bold text-slate-900">2</div>
          <Text size="md" variant="subdued" className="text-slate-400 mt-0.5">Pending requests creating gap</Text>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar className="size-4 text-teal-800" />
            <Text size="md" weight="medium">Sick Days (Month)</Text>
          </div>
          <div className="text-2xl font-bold text-slate-900">5</div>
          <Text size="md" variant="subdued" className="text-slate-400 mt-0.5">Return-to-work interviews 1</Text>
        </div>
      </div>

      {/* Filter and Tabs Container */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-4 shadow-xs">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by staff name, reference (LV-...)"
              className="pl-9 h-10 rounded-xl text-md"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="h-10 text-md text-slate-500"
            >
              <RotateCcw className="size-3 mr-1" /> Reset
            </Button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200/80 text-md overflow-x-auto pb-px">
          {[
            { key: "Pending", label: "Pending", count: counts.pending },
            { key: "Approved", label: "Approved", count: counts.approved },
            { key: "Declined", label: "Declined", count: counts.declined },
            { key: "Cancelled", label: "Cancelled", count: counts.cancelled },
            { key: "all", label: "All Requests", count: counts.all },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2.5 transition-colors whitespace-nowrap cursor-pointer font-semibold ${
                activeTab === tab.key
                  ? "border-b-2 border-emerald-800 text-emerald-900 font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              {tab.label} <span className="text-slate-400 font-normal">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-md">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Rota Cover</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRequests.map((req) => {
                const ref = `LV-${req.id.slice(0, 4).toUpperCase()}`;
                const startDateStr = format(new Date(req.startDate), "dd/MM/yyyy");
                const endDateStr = format(new Date(req.endDate), "dd/MM/yyyy");

                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-600">{ref}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-bold text-slate-900">{req.staff?.fullName || "Staff"}</div>
                        <div className="text-md text-slate-400">{req.staff?.role?.name || "Support Worker"}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-md font-semibold bg-slate-100 text-slate-800">
                        {req.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{startDateStr} - {endDateStr}</div>
                      <div className="text-md text-slate-400">{req.reason || "No notes"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                        <AlertTriangle className="size-3 text-amber-600" />
                        Cover needed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-md font-bold ${
                        req.status === "Approved"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                          : req.status === "Declined"
                          ? "bg-rose-50 text-rose-800 border border-rose-200/60"
                          : "bg-amber-50 text-amber-800 border border-amber-200/60"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(req.id, "Approved")}
                            className="h-8 px-2 text-md text-emerald-800 hover:bg-emerald-50 font-bold"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(req.id, "Declined")}
                            className="h-8 px-2 text-md text-rose-700 hover:bg-rose-50 font-bold"
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-md">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      <NewLeaveRequestModal
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        staffList={staffList}
      />
    </div>
  );
}
