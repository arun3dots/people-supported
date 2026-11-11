"use client";

import React, { useState } from "react";
import {
  useGetDailyTasksQuery,
  useUpdateDailyTaskStatusMutation,
} from "../../../lib/queries/residents";
import { useGetStaffQuery } from "../../../lib/queries/staff";
import { useAuth } from "../../../lib/context/AuthContext";
import { AddCarePlanTaskDialog } from "./AddCarePlanTaskDialog";
import { EditCarePlanMasterDialog } from "./EditCarePlanMasterDialog";
import { usePagination } from "@repo/ui/hooks";
import { MasterCarePlanSummaryCard } from "./care-plan/MasterCarePlanSummaryCard";
import { DailyTaskListSection } from "./care-plan/DailyTaskListSection";

interface CarePlanTabProps {
  residentId: string;
  selectedDate: Date;
  resident?: any;
}

export function CarePlanTab({ residentId, selectedDate, resident }: CarePlanTabProps) {
  const { user } = useAuth();
  const isCarer = user?.roleName?.toLowerCase() === "carer";
  const canManagePlan = !isCarer;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditMasterOpen, setIsEditMasterOpen] = useState(false);
  const dateString = selectedDate.toISOString().split("T")[0];

  const { data: tasks, isLoading } = useGetDailyTasksQuery({
    residentId,
    date: dateString,
  });

  const { data: staffList = [] } = useGetStaffQuery();

  const {
    currentPage,
    pageSize,
    paginatedData: paginatedTasks,
    totalRecords,
    handlePageChange,
    handleLimitChange,
  } = usePagination(tasks || []);

  const updateStatusMutation = useUpdateDailyTaskStatusMutation();

  const handleStatusUpdate = (
    taskId: string,
    status: "Skipped" | "Completed",
  ) => {
    updateStatusMutation.mutate({
      taskId,
      data: { status },
    });
  };

  const activeCarePlan =
    resident?.carePlans?.find((cp: any) => cp.status === "Active") ||
    resident?.carePlans?.[0];

  if (isLoading) {
    return (
      <div className="space-y-4 py-12 text-center">
        <div className="animate-spin size-8 border-3 border-[#3D5C57] border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Master Care Plan Card */}
      <MasterCarePlanSummaryCard
        activeCarePlan={activeCarePlan}
        staffList={staffList}
        canManagePlan={canManagePlan}
        onEditMasterClick={() => setIsEditMasterOpen(true)}
      />

      {/* Daily Tasks List */}
      <DailyTaskListSection
        tasks={tasks || []}
        paginatedTasks={paginatedTasks}
        isLoading={isLoading}
        selectedDate={selectedDate}
        canManagePlan={canManagePlan}
        onAddTaskClick={() => setIsAddDialogOpen(true)}
        onStatusUpdate={handleStatusUpdate}
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      {/* Add Task Dialog */}
      {canManagePlan && (
        <AddCarePlanTaskDialog
          residentId={residentId}
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />
      )}

      {/* Edit Master Dialog */}
      {canManagePlan && (
        <EditCarePlanMasterDialog
          residentId={residentId}
          carePlan={activeCarePlan}
          open={isEditMasterOpen}
          onOpenChange={setIsEditMasterOpen}
        />
      )}
    </div>
  );
}
