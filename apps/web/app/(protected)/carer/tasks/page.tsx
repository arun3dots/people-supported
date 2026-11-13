"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Play } from "lucide-react";
import { Button, Card, Text, EmptyState, toast } from "@repo/ui/components/ui";
import {
  useGetCarerAssignedResidentTasksQuery,
  useUpdateDailyTaskStatusMutation,
  useCreateCareNoteMutation,
  useGetResidentsQuery,
} from "../../../../lib/queries/residents";
import {
  useGetActiveShiftQuery,
  useStartShiftMutation,
  useEndShiftMutation,
} from "../../../../lib/queries/shifts";
import { useGetStaffQuery } from "../../../../lib/queries/staff";
import { useAuth } from "../../../../lib/context/AuthContext";
import { DailyTaskItem, TimeBucket, TaskFilterType } from "./components/types";
import { filterTasks, groupTasksByBucket } from "./components/taskGrouping";
import { TaskShiftBanner } from "./components/TaskShiftBanner";
import { TaskKpiCards } from "./components/TaskKpiCards";
import { TaskFilterBar } from "./components/TaskFilterBar";
import { TaskItemCard } from "./components/TaskItemCard";
import { LogTaskDialog } from "./components/LogTaskDialog";
import { ShiftExecutionModal } from "../../../../lib/components/staff/ShiftExecutionModal";
import { Shift } from "../../../../lib/types/shifts";
import { cn } from "@repo/ui/lib/utils";
import { getShiftClockInEligibility } from "../../../../lib/utils/shift-timing";

export default function CarerTodayShiftPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<TaskFilterType>("all");
  const [selectedResidentId, setSelectedResidentId] = useState<string>("all");
  const [loggingTask, setLoggingTask] = useState<DailyTaskItem | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: rawTasks = [], isLoading: tasksLoading } = useGetCarerAssignedResidentTasksQuery({
    date: todayStr,
  });
  const { data: staffList = [] } = useGetStaffQuery();
  const { data: residents = [] } = useGetResidentsQuery();
  const { data: shiftData } = useGetActiveShiftQuery();

  const startShiftMutation = useStartShiftMutation();
  const endShiftMutation = useEndShiftMutation();
  const updateStatusMutation = useUpdateDailyTaskStatusMutation();
  const createCareNoteMutation = useCreateCareNoteMutation(loggingTask?.residentId || "");

  const currentShift = (shiftData?.active || shiftData?.next) as Shift | null;
  const shiftEligibility = useMemo(
    () => getShiftClockInEligibility(currentShift),
    [currentShift],
  );
  const isShiftStarted = Boolean(shiftData?.active?.isStarted);

  const tasks = (Array.isArray(rawTasks) ? rawTasks : []) as DailyTaskItem[];
  const taskResidentIds = new Set(tasks.map((task) => task.residentId));
  const assignedResidents = residents.filter((resident) =>
    taskResidentIds.has(resident.id),
  );

  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, selectedResidentId, activeFilter);
  }, [tasks, selectedResidentId, activeFilter]);

  // KPI counts
  const myTasksCount = tasks.length;
  const { doneCount, dueNowCount, missedCount, refusedCount } = useMemo(() => {
    let done = 0, due = 0, missed = 0, refused = 0;
    for (const t of tasks) {
      const s = (t.status || "").toLowerCase();
      if (s === "completed" || s === "done") done++;
      else if (s === "pending" || s === "due" || s === "inprogress") due++;
      else if (s === "skipped" || s === "missed") missed++;
      else if (s === "refused") refused++;
    }
    return { doneCount: done, dueNowCount: due, missedCount: missed, refusedCount: refused };
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    return groupTasksByBucket(filteredTasks, activeFilter);
  }, [filteredTasks, activeFilter]);

  const handleClockIn = () => {
    if (!currentShift?.id || !shiftEligibility.isToday) {
      toast({
        title: "No Scheduled Shift Found",
        description: "No active or scheduled shift found for today on the rota.",
        variant: "destructive",
      });
      return;
    }
    if (shiftEligibility.isDraft) {
      toast({
        title: "Draft Shift",
        description: "This shift is in draft status and has not been published yet.",
        variant: "destructive",
      });
      return;
    }
    if (!shiftEligibility.isTimeReached) {
      toast({
        title: "Shift Not Started Yet",
        description: shiftEligibility.reason || "You cannot clock in before your scheduled shift start time.",
        variant: "destructive",
      });
      return;
    }
    startShiftMutation.mutate(
      { shiftId: currentShift.id },
      {
        onSuccess: () => {
          toast({
            title: "Shift Started",
            description: "You have clocked in successfully. Tasks are active.",
          });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to start shift.";
          toast({
            title: "Clock In Error",
            description: msg,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleClockOut = () => {
    setIsShiftModalOpen(true);
  };

  const handleConfirmLog = async (data: {
    status: "Completed" | "Skipped";
    notes?: string;
    skipReason?: string;
  }) => {
    if (!loggingTask) return;
    try {
      await updateStatusMutation.mutateAsync({
        taskId: loggingTask.id,
        data: {
          status: data.status,
          notes: data.notes,
          skipReason: data.skipReason,
        },
      });

      if (data.notes && loggingTask.residentId) {
        await createCareNoteMutation.mutateAsync({
          content: data.notes,
          category: "CarePlan",
        });
      }
      setLoggingTask(null);
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <div className="w-full space-y-5 pb-12 font-sans mx-auto">
      {/* Page Heading & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Text size="xl" weight="bold" className="tracking-tight">
            Today's Shift Tasks
          </Text>
          <Text variant="subdued" size="md" weight="regular">
            Real-time daily schedule, assigned resident care routines, and shift execution tasks.
          </Text>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-md font-semibold text-slate-700 self-start sm:self-auto">
          <Calendar className="size-3.5 text-[#3D5C57]" />
          <span>{format(new Date(), "EEEE, d MMM yyyy")}</span>
        </div>
      </div>

      {/* 1. Shift Banner Strip */}
      <TaskShiftBanner
        userName={user?.fullName || "Care Staff"}
        activeShift={currentShift}
        staffList={staffList}
        unitName="Oak"
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        onOpenShiftOperations={() => setIsShiftModalOpen(true)}
        isClockActionPending={startShiftMutation.isPending || endShiftMutation.isPending}
      />

      {!isShiftStarted ? (
        <Card className="p-8 sm:p-10 rounded-2xl border border-amber-200 bg-white text-center space-y-4 shadow-sm">
          <div className="size-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-800 shadow-2xs">
            <Clock className="size-7" />
          </div>
          <div className="space-y-1.5">
            <Text as="h3" size="lg" weight="bold" className="text-slate-900">
              Shift Not Started
            </Text>
            <Text size="md" className="text-slate-600 max-w-lg mx-auto">
              {!currentShift || !shiftEligibility.isToday
                ? "No active shift is currently scheduled for today on your rota."
                : !shiftEligibility.isTimeReached
                  ? `Your shift starts at ${shiftEligibility.formattedStartTime}. Please clock in once your shift begins.`
                  : "Please clock in to start your shift before accessing today&apos;s task list and resident care routines."}
            </Text>
          </div>
          {currentShift && shiftEligibility.isToday ? (
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={!shiftEligibility.canClockIn || startShiftMutation.isPending}
                onClick={handleClockIn}
                title={shiftEligibility.reason || "Start Shift"}
                className={cn(
                  "rounded-xl font-semibold px-6 shadow-none",
                  shiftEligibility.canClockIn && !startShiftMutation.isPending
                    ? "cursor-pointer"
                    : "opacity-60 cursor-not-allowed",
                )}
              >
                <Play className="size-4 fill-current mr-2" />
                {startShiftMutation.isPending
                  ? "Starting shift…"
                  : !shiftEligibility.isTimeReached && shiftEligibility.formattedStartTime
                    ? `Clock in available at ${shiftEligibility.formattedStartTime}`
                    : "Start Shift / Clock In"}
              </Button>
            </div>
          ) : (
            <div className="pt-2">
              <Button asChild variant="outline" size="lg" className="rounded-xl shadow-none">
                <Link href="/carer/shifts">View Your Shift Rota</Link>
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* 2. KPI Cards Row */}
          <TaskKpiCards
            myTasksCount={myTasksCount}
            doneCount={doneCount}
            dueNowCount={dueNowCount}
            missedCount={missedCount}
            refusedCount={refusedCount}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
          />

          {/* 3. Filter Bar */}
          <TaskFilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            selectedResidentId={selectedResidentId}
            onResidentChange={setSelectedResidentId}
            residents={assignedResidents}
          />

          {/* 4. Grouped Tasks List */}
          {tasksLoading ? (
            <Card variant="surface" className="p-12 text-center">
              <Text size="md" variant="muted">Loading shift tasks...</Text>
            </Card>
          ) : groupedTasks.length === 0 ? (
            <Card variant="surface" className="p-8">
              <EmptyState
                title="No tasks match this filter"
                description="All scheduled care tasks for this view have been completed or none are scheduled."
              />
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedTasks.map((group) => (
                <div key={group.bucket} className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <Text
                      as="h3"
                      size="md"
                      weight="bold"
                      className={
                        group.bucket === "Due now"
                          ? "text-amber-800 font-bold tracking-tight"
                          : "text-text-heading tracking-tight"
                      }
                    >
                      {group.bucket}
                    </Text>
                    <Text size="md" variant="muted">
                      {group.tasks.length} task(s)
                    </Text>
                  </div>

                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <TaskItemCard
                        key={task.id}
                        task={task}
                        staffList={staffList}
                        currentAssigneeId={task.assignedStaffId}
                        currentUserId={user?.userId}
                        canAllocate={false}
                        onOpenLog={(t) => setLoggingTask(t)}
                        onReassign={() => { }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 5. Quick Log Modal Dialog */}
      <LogTaskDialog
        task={loggingTask}
        isOpen={loggingTask !== null}
        onClose={() => setLoggingTask(null)}
        onSubmit={handleConfirmLog}
        isPending={updateStatusMutation.isPending || createCareNoteMutation.isPending}
      />

      {/* 6. Shift Operations Modal */}
      <ShiftExecutionModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shift={currentShift}
      />
    </div>
  );
}
