"use client";

import React, { useMemo, useState } from "react";
import { Download, Plus, RotateCcw, Search } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { DataTable } from "../../../../../lib/components/shared/DataTable";
import {
  useGetLeaveRequestsQuery,
  useGetShiftsQuery,
  useUpdateLeaveRequestStatusMutation,
  type LeaveRequestItem,
} from "../../../../../lib/queries/shifts";
import { useGetStaffQuery } from "../../../../../lib/queries/staff";
import { useGetPropertiesQuery } from "../../../../../lib/queries/facility";
import { LeaveRequestDetailModal } from "./components/LeaveRequestDetailModal";
import { LeaveRequestStatCards } from "./components/LeaveRequestStatCards";
import { NewLeaveRequestModal } from "./components/NewLeaveRequestModal";
import { useLeaveRequestColumns } from "./components/useLeaveRequestColumns";
import { AnnualLeaveBalancesCard } from "./components/AnnualLeaveBalancesCard";
import { resolveStaffLocation } from "../rota/components/rotaDataUtils";

const LEAVE_TYPE_OPTIONS = [
  "Annual Leave",
  "Sick Leave",
  "Compassionate",
  "Training",
  "TOIL",
  "Unpaid",
] as const;

export function LeaveRequestManagementClient(): React.JSX.Element {
  const { toast } = useToast();
  const { data: requestsData = [], isLoading } = useGetLeaveRequestsQuery();
  const { data: shiftsData = [] } = useGetShiftsQuery();
  const { data: staffData = [] } = useGetStaffQuery();
  const { data: properties = [] } = useGetPropertiesQuery();
  const updateStatusMutation = useUpdateLeaveRequestStatusMutation();

  const requests = useMemo(
    () => (Array.isArray(requestsData) ? requestsData : []),
    [requestsData],
  );
  const shifts = useMemo(
    () => (Array.isArray(shiftsData) ? shiftsData : []),
    [shiftsData],
  );
  const staffList = useMemo(
    () => (Array.isArray(staffData) ? staffData : []),
    [staffData],
  );

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequestItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Pending");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeTab !== "all" && r.status !== activeTab) return false;
      if (typeFilter !== "All" && r.type !== typeFilter) return false;
      if (propertyFilter !== "all") {
        const staffProp = staffList.find((s) => s.id === (r.staffId || r.staff?.id));
        const loc = staffProp ? resolveStaffLocation(staffProp, [], properties) : null;
        if (!loc?.propertyId || loc.propertyId !== propertyFilter) return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const staffName = r.staff?.fullName?.toLowerCase() ?? "";
        const roleName = r.staff?.role?.name?.toLowerCase() ?? "";
        const reasonText = r.reason?.toLowerCase() ?? "";
        const refId = `LV-${r.id.slice(0, 4)}`.toLowerCase();
        return (
          staffName.includes(query) ||
          roleName.includes(query) ||
          r.type.toLowerCase().includes(query) ||
          reasonText.includes(query) ||
          refId.includes(query)
        );
      }
      return true;
    });
  }, [requests, activeTab, typeFilter, propertyFilter, search, staffList, properties]);

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "Pending").length,
      approved: requests.filter((r) => r.status === "Approved").length,
      declined: requests.filter((r) => r.status === "Declined").length,
      cancelled: requests.filter((r) => r.status === "Cancelled").length,
      all: requests.length,
    }),
    [requests],
  );

  const handleUpdateStatus = async (
    id: string,
    status: "Approved" | "Declined",
    adminNotes?: string,
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        data: { status, adminNotes: adminNotes ?? null },
      });
      toast({
        title: `Request ${status}`,
        description: `Leave request has been marked as ${status.toLowerCase()}.`,
      });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description:
          err instanceof Error
            ? err.message
            : "Failed to update request status",
      });
    }
  };

  const columns = useLeaveRequestColumns({
    shifts,
    onApprove: (id) => handleUpdateStatus(id, "Approved"),
    onDecline: (id) => handleUpdateStatus(id, "Declined"),
    onReview: (req) => setSelectedRequest(req),
    isUpdating: updateStatusMutation.isPending,
  });

  const statusTabs = [
    { key: "Pending", label: "Pending", count: counts.pending },
    { key: "Approved", label: "Approved", count: counts.approved },
    { key: "Declined", label: "Declined", count: counts.declined },
    { key: "Cancelled", label: "Cancelled", count: counts.cancelled },
    { key: "all", label: "All Requests", count: counts.all },
  ];

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setPropertyFilter("all");
    setActiveTab("all");
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Text as="h1" size="2xl" weight="semibold" className="tracking-tight text-slate-900">
            Leave Management
          </Text>
          <Text variant="muted" size="md" className="mt-0.5">
            Review annual, sick and training leave, see rota impact and arrange
            cover before approving.
          </Text>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const escapeCsv = (val: string | number | null | undefined): string => {
                const str = String(val ?? "");
                return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
              };
              const headers = [
                "Staff Member",
                "Role",
                "Leave Type",
                "Start Date",
                "End Date",
                "Status",
                "Reason",
              ];
              const csvRows = [
                headers.join(","),
                ...filteredRequests.map((r) =>
                  [
                    r.staff?.fullName || "Staff",
                    r.staff?.role?.name || "",
                    r.type,
                    r.startDate ? String(r.startDate).slice(0, 10) : "",
                    r.endDate ? String(r.endDate).slice(0, 10) : "",
                    r.status,
                    r.reason || "",
                  ]
                    .map(escapeCsv)
                    .join(","),
                ),
              ];
              const blob = new Blob([csvRows.join("\n")], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `leave-requests-${new Date().toISOString().slice(0, 10)}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            className="h-9 px-3 rounded-xl bg-surface-card-grey hover:bg-slate-200/70 text-md font-medium text-slate-700 flex items-center gap-1.5 shadow-none cursor-pointer"
          >
            <Download className="size-3.5" />
            Export
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="rounded-xl h-9 px-3.5 text-md font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" />
            New Request
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <LeaveRequestStatCards requests={requests} shifts={shifts} />

      {/* Search, Type Filter & Status Tabs */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
          <div className="relative flex-1 min-w-60 [&_[data-slot=input-error]]:hidden">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by staff name, staff ID or reference (LV-...)"
              className="w-full h-10 pl-10 pr-4 bg-white border-slate-200/80 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-primary shadow-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 h-10 bg-white border-slate-200/80 rounded-xl text-md font-medium text-slate-700 cursor-pointer">
                <SelectValue placeholder="All Leave Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Leave Types</SelectItem>
                {LEAVE_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-44 h-10 bg-white border-slate-200/80 rounded-xl text-md font-medium text-slate-700 cursor-pointer">
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

            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-44 h-10 bg-white border-slate-200/80 rounded-xl text-md font-medium text-slate-700 cursor-pointer">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                {statusTabs.map((tab) => (
                  <SelectItem key={tab.key} value={tab.key}>
                    {tab.label} ({tab.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 px-2.5 rounded-xl text-md font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Table Overview Container */}
      <div className="w-full bg-surface-card-grey rounded-2xl p-5 lg:p-6 shadow-none border-none font-sans">
        <div className="flex items-center justify-between pb-4 border-b border-border-secondary/50 mb-4">
          <Text size="base" weight="semibold" className="text-slate-900">
            Leave Requests ({filteredRequests.length} of {requests.length})
          </Text>
        </div>

        <DataTable<LeaveRequestItem>
          columns={columns}
          data={filteredRequests}
          isLoading={isLoading}
          onRowClick={(req) => setSelectedRequest(req)}
          emptyTitle="No leave requests found"
          emptyDescription="No leave requests match your active search or status filter."
        />
      </div>

      {/* Annual leave balances */}
      <AnnualLeaveBalancesCard staffList={staffList} requests={requests} />

      {/* Create Leave Request Modal */}
      <NewLeaveRequestModal
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        staffList={staffList}
      />

      {/* Review / View Leave Request Modal */}
      <LeaveRequestDetailModal
        request={selectedRequest}
        shifts={shifts}
        onClose={() => setSelectedRequest(null)}
        onUpdateStatus={handleUpdateStatus}
        isSubmitting={updateStatusMutation.isPending}
      />
    </div>
  );
}
