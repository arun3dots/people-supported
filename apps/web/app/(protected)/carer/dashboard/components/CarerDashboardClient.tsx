"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../../../../../lib/context/AuthContext";
import { useGetMyTasksQuery } from "../../../../../lib/queries/dashboard/useGetMyTasksQuery";
import { useGetActiveShiftQuery } from "../../../../../lib/queries/shifts";
import { useUpdateDailyTaskStatusMutation } from "../../../../../lib/queries/residents/useUpdateDailyTaskStatusMutation";
import { CarerWelcomeCard } from "./CarerWelcomeCard";
import { CarerStatsGrid } from "./CarerStatsGrid";
import { ShiftBriefing } from "./ShiftBriefing";
import { UpcomingTasksList, type CarerTaskItem } from "./UpcomingTasksList";
import { Calendar, Clock } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";

export function CarerDashboardClient() {
  const { user } = useAuth();
  const isCarer = user?.roleName?.toLowerCase() === "carer";
  const { data, isLoading } = useGetMyTasksQuery();
  const { data: shiftData } = useGetActiveShiftQuery({ enabled: isCarer });
  const updateTaskStatus = useUpdateDailyTaskStatusMutation();

  const dailyTasks = (data?.dailyTasks ?? []) as CarerTaskItem[];
  const isShiftStarted = !isCarer || Boolean(shiftData?.active?.isStarted);

  const handleCompleteTask = (taskId: string) => {
    if (!isShiftStarted) return;
    updateTaskStatus.mutate({
      taskId,
      data: { status: "Completed" },
    });
  };

  const handleSkipTask = (taskId: string, skipReason: string) => {
    if (!isShiftStarted) return;
    updateTaskStatus.mutate({
      taskId,
      data: { status: "Skipped", skipReason },
    });
  };

  const pendingTasksCount = dailyTasks.filter(
    (t: { status?: string }) => t.status === "Pending"
  ).length;

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full space-y-6 pb-12 font-sans mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Text size="xl" weight="bold" className="tracking-tight">
            Carer Dashboard
          </Text>
          <Text variant="subdued" size="sm" weight="regular">
            Real-time daily schedule, assigned residents, and shift updates.
          </Text>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-md font-semibold text-slate-700 self-start sm:self-auto">
          <Calendar className="size-3.5 text-[#3D5C57]" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {!isShiftStarted && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-amber-700" />
            <span className="font-medium">
              Your shift is not started. Start your shift on the Shift Tasks tab to view and complete active care tasks.
            </span>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl shadow-none shrink-0 self-start sm:self-auto">
            <Link href="/carer/tasks">Go to Today&apos;s Shift</Link>
          </Button>
        </div>
      )}

      {/* 1. Welcome Card */}
      <CarerWelcomeCard user={user} pendingTasksCount={pendingTasksCount} />

      {/* 2. Key Metrics Row */}
      <CarerStatsGrid tasks={dailyTasks} />

      {/* 3. Main Tasks & Briefing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        <div className="lg:col-span-8 w-full">
          {isShiftStarted ? (
            <UpcomingTasksList
              tasks={dailyTasks}
              isLoading={isLoading}
              onCompleteTask={handleCompleteTask}
              onSkipTask={handleSkipTask}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
              <Clock className="size-8 mx-auto text-amber-600" />
              <p className="text-md font-semibold text-slate-800">
                Tasks locked until shift start
              </p>
              <p className="text-sm text-slate-600">
                Clock in to view scheduled care tasks for your assigned residents.
              </p>
            </div>
          )}
        </div>
        <div className="lg:col-span-4 w-full">
          <ShiftBriefing />
        </div>
      </div>
    </div>
  );
}
