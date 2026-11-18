"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { ShiftSummaryCard } from "./components/ShiftSummaryCard";
import { ShiftRequirementsCard } from "./components/ShiftRequirementsCard";
import { StaffMembersTable, StaffMemberRow } from "./components/StaffMembersTable";
import { AssignResidentModal, SelectedResidentItem } from "./components/AssignResidentModal";
import { ReviewResidentAssignmentModal } from "./components/ReviewResidentAssignmentModal";
import { ShiftDialog } from "../rota/components/ShiftDialog";
import { useGetWingsQuery } from "../../../../../lib/queries/facility";
import { useGetStaffQuery } from "../../../../../lib/queries/staff";
import { useAssignCarerMutation, useGetResidentsQuery } from "../../../../../lib/queries/residents";
import { useGetShiftsQuery, useUpdateShiftMutation } from "../../../../../lib/queries/shifts";
import { format } from "date-fns";

interface StaffAssignmentsProps {
  onBackToPlanner?: () => void;
}

export function StaffAssignments({ onBackToPlanner }: StaffAssignmentsProps) {
  const router = useRouter();
  const [selectedShift, setSelectedShift] = useState("morning");
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [editingShiftData, setEditingShiftData] = useState<unknown>(null);

  // Flow State
  const [activeStepStaff, setActiveStepStaff] = useState<StaffMemberRow | null>(null);
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<SelectedResidentItem[]>([]);

  // The Unit hierarchy level was removed in favor of Branch; the rota's
  // unit-based shift filter (ShiftDialog) is stale until that's rebuilt.
  const units = [] as never[];
  const { data: wings = [] } = useGetWingsQuery();
  const { data: staffList = [] } = useGetStaffQuery();
  const { data: rawResidents = [] } = useGetResidentsQuery();
  const residents = useMemo(
    () => rawResidents.filter((r) => r.status === "Active"),
    [rawResidents],
  );
  const { data: shifts = [] } = useGetShiftsQuery();
  const assignCarerMutation = useAssignCarerMutation();
  const updateShiftMutation = useUpdateShiftMutation();

  const handleBack = () => {
    if (onBackToPlanner) {
      onBackToPlanner();
    } else {
      router.push("/admin/staff/rota");
    }
  };

  const handleOpenNewShiftDialog = () => {
    setEditingShiftData(null);
    setIsShiftDialogOpen(true);
  };

  const handleOpenShiftDialogForStaff = (staff: StaffMemberRow) => {
    setEditingShiftData({
      assignments: [{ userId: staff.id }],
    });
    setIsShiftDialogOpen(true);
  };

  const handleStartResidentAssignment = (staff: StaffMemberRow) => {
    setActiveStepStaff(staff);
    setIsResidentModalOpen(true);
  };

  const handleProceedToReview = (selectedResidents: SelectedResidentItem[]) => {
    setPendingSelection(selectedResidents);
    setIsResidentModalOpen(false);
    setIsReviewModalOpen(true);
  };

  const handleBackToResidentSelection = () => {
    setIsReviewModalOpen(false);
    setIsResidentModalOpen(true);
  };

  const handleFinalOverrideConfirm = (
    _reason: string,
    _notifyManager: boolean,
    _flagCompliance: boolean
  ) => {
    if (!activeStepStaff) return;
    const selectedResIds = pendingSelection.map((r) => r.id);

    // 1. Update the matching active shift for this staff member so shift-level assignment contains these residents
    const staffShift = shifts.find((s) =>
      s.assignments?.some((a) => a.userId === activeStepStaff.id)
    );

    if (staffShift) {
      const existingRes = staffShift.assignments?.flatMap(
        (assignment) => assignment.assignedResidentIds || [],
      ) || [];
      const updatedResIds = Array.from(new Set([...existingRes, ...selectedResIds]));
      updateShiftMutation.mutate({
        id: staffShift.id,
        startTime: staffShift.startTime,
        endTime: staffShift.endTime,
        status: (staffShift.status as "Draft" | "Published") || "Draft",
        userIds: staffShift.assignments?.map((assignment) => assignment.userId) || [],
        residentIds: updatedResIds,
      });
    }

    // 2. Also record keyworker assignment for continuity
    pendingSelection.forEach((res) => {
      assignCarerMutation.mutate({
        residentId: res.id,
        carerId: activeStepStaff.id,
      });
    });

    setIsReviewModalOpen(false);
    setActiveStepStaff(null);
    setPendingSelection([]);
  };

  const totalResidentsCount = residents.length;
  const assignedResidentsCount = residents.filter((r) => Boolean(r.keyworkerId)).length;
  const unassignedResidentsCount = Math.max(0, totalResidentsCount - assignedResidentsCount);
  const staffScheduledCount = staffList.length;
  const safeStaffRequired = Math.max(1, Math.ceil(totalResidentsCount / 4));
  const coveragePercent = Math.min(
    100,
    safeStaffRequired > 0 ? Math.round((staffScheduledCount / safeStaffRequired) * 100) : 100
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-md font-semibold text-[#3D5C57] hover:text-[#2D4541] transition-colors"
            >
              <ChevronLeft className="size-4" />
              <span>Back to Rota Planner</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Assignment</h1>
          <p className="text-md text-slate-500 mt-0.5 font-medium">
            Assign staff to shift or residents based on skills, competencies, and availability
          </p>
        </div>

        {/* Top Controls: Date and Shift Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 px-4 rounded-xl bg-white border-slate-200 text-md font-semibold text-slate-800 shadow-2xs gap-2"
          >
            <span>Today</span>
            <CalendarIcon className="size-4 text-slate-400" />
          </Button>

          <Select value={selectedShift} onValueChange={setSelectedShift}>
            <SelectTrigger className="h-11 w-full sm:w-[220px] rounded-xl bg-white border-slate-200 text-md font-semibold text-slate-800 shadow-2xs">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-slate-400 shrink-0" />
                <SelectValue placeholder="Morning shift (06:00 - 15:00)" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="morning">Morning shift (06:00 - 15:00)</SelectItem>
              <SelectItem value="noon">Noon shift (15:00 - 00:00)</SelectItem>
              <SelectItem value="night">Night shift (21:00 - 06:00)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 1. Shift Summary Banner Card */}
      <ShiftSummaryCard
        shiftName={
          selectedShift === "morning"
            ? "Morning Shift"
            : selectedShift === "noon"
              ? "Noon Shift"
              : "Night Shift"
        }
        dateStr={format(new Date(), "EEEE, d MMMM yyyy")}
        timeRange={
          selectedShift === "morning"
            ? "06:00 - 15:00"
            : selectedShift === "noon"
              ? "15:00 - 00:00"
              : "21:00 - 06:00"
        }
        coveragePercent={coveragePercent}
        totalResidents={totalResidentsCount}
        assignedResidents={assignedResidentsCount}
        unassignedResidents={unassignedResidentsCount}
        staffsRequired={safeStaffRequired}
        staffScheduled={staffScheduledCount}
      />

      {/* 2. Skills Required & Mandatory Certifications Cards */}
      <ShiftRequirementsCard />

      {/* 3. Staff Members Table with filters and actions */}
      <StaffMembersTable
        staffList={staffList}
        onAssignToShift={handleOpenNewShiftDialog}
        onAssignResidents={handleStartResidentAssignment}
        onOpenShiftDialogForStaff={handleOpenShiftDialogForStaff}
      />

      {/* MODALS */}
      {/* Shift Dialog */}
      <ShiftDialog
        isOpen={isShiftDialogOpen}
        onClose={() => setIsShiftDialogOpen(false)}
        shift={editingShiftData}
        units={units}
        wings={wings}
        staff={staffList}
      />

      {/* Step 2 Modal: Assign Resident to Staff */}
      <AssignResidentModal
        isOpen={isResidentModalOpen}
        onClose={() => setIsResidentModalOpen(false)}
        staffName={activeStepStaff?.name}
        staffRole={activeStepStaff?.role}
        staffAvatar={activeStepStaff?.avatar}
        compliancePercent={activeStepStaff?.compliance}
        maxCapacity={activeStepStaff?.capacityTotal || 7}
        currentResidents={activeStepStaff?.capacityAssigned || 4}
        remainingCapacity={(activeStepStaff?.capacityTotal || 7) - (activeStepStaff?.capacityAssigned || 4)}
        onProceedToReview={handleProceedToReview}
      />

      {/* Step 3 Modal: Review Resident Assignment & Override */}
      <ReviewResidentAssignmentModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        staffName={activeStepStaff?.name}
        staffRole={activeStepStaff?.role}
        staffAvatar={activeStepStaff?.avatar}
        compliancePercent={activeStepStaff?.compliance}
        maxCapacity={activeStepStaff?.capacityTotal || 7}
        currentResidents={activeStepStaff?.capacityAssigned || 0}
        remainingCapacity={(activeStepStaff?.capacityTotal || 7) - (activeStepStaff?.capacityAssigned || 0)}
        selectedResidents={pendingSelection}
        onBackToSelection={handleBackToResidentSelection}
        onConfirmOverride={handleFinalOverrideConfirm}
        isPending={assignCarerMutation.isPending}
      />
    </div>
  );
}
