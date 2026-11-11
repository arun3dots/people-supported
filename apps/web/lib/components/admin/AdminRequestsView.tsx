"use client";

import React, { useState } from "react";
import { LeaveRequestHeader } from "../../../app/(protected)/admin/staff/requests/components/LeaveRequestHeader";
import { LeaveRequestTable } from "../../../app/(protected)/admin/staff/requests/components/LeaveRequestTable";
import { ReviewLeaveModal } from "../../../app/(protected)/admin/staff/requests/components/ReviewLeaveModal";
import { useGetShiftRequestsQuery } from "../../queries/shifts";
import { useUpdateShiftRequestStatusMutation } from "../../queries/shifts";
import { ShiftRequest } from "../../types/shifts";

export function AdminRequestsView() {
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(null);

  const { data: requests = [], isLoading } = useGetShiftRequestsQuery();
  const updateStatusMutation = useUpdateShiftRequestStatusMutation();

  const pending = requests.filter((r) => r.status === "Pending");
  const approved = requests.filter((r) => r.status === "Approved");
  const rejected = requests.filter((r) => r.status === "Rejected");

  const handleApprove = (id: string, adminNotes?: string) => {
    updateStatusMutation.mutate(
      { id, status: "Approved", adminNotes: adminNotes ?? null },
      {
        onSuccess: () => {
          setSelectedRequest(null);
        },
      }
    );
  };

  const handleReject = (id: string, adminNotes: string) => {
    updateStatusMutation.mutate(
      { id, status: "Rejected", adminNotes },
      {
        onSuccess: () => {
          setSelectedRequest(null);
        },
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header & Stats Cards */}
      <LeaveRequestHeader
        pendingCount={pending.length}
        approvedCount={approved.length}
        rejectedCount={rejected.length}
      />

      {/* Leave Request Table */}
      <LeaveRequestTable
        requests={requests}
        isLoading={isLoading}
        onReviewRequest={(req) => setSelectedRequest(req)}
      />

      {/* Review Request Modal */}
      <ReviewLeaveModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        isPending={updateStatusMutation.isPending}
      />
    </div>
  );
}
