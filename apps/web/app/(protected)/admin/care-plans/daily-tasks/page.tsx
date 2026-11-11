"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SummaryCardsGrid, type SummaryCardItem } from "@repo/ui/components/ui";
import type { CareTaskBoardItemDTO, CareTaskShift } from "@repo/schema";
import {
  useGetCareTaskBoardQuery,
  useRecordCareTaskFromBoardMutation,
} from "../../../../../lib/queries/care-journey";
import { TaskSkipReasonModal } from "../../../../shared/components/care-plan/TaskSkipReasonModal";
import { DailyTaskCard } from "./components/DailyTaskCard";

const getUkCalendarDate = (): string => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: "year" | "month" | "day") =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

export default function FacilityDailyTasksPage() {
  const [selectedDate, setSelectedDate] = useState(
    getUkCalendarDate()
  );
  const todayStr = getUkCalendarDate();
  const boardDate = selectedDate || todayStr;
  const isPastDate = Boolean(selectedDate && selectedDate < todayStr);
  const isFutureDate = Boolean(selectedDate && selectedDate > todayStr);
  const isReadOnlyDate = isPastDate || isFutureDate;
  const [timeSlotFilter, setTimeSlotFilter] = useState<"ALL" | CareTaskShift>("ALL");
  const [skippingTask, setSkippingTask] = useState<CareTaskBoardItemDTO | null>(null);

  const { data: board, isLoading, isError, refetch } =
    useGetCareTaskBoardQuery(boardDate);

  const tasks = board?.items ?? [];
  const recordTaskMutation = useRecordCareTaskFromBoardMutation();

  const filteredTasks = tasks.filter((t) => {
    if (timeSlotFilter !== "ALL" && t.timeSlot !== timeSlotFilter) {
      return false;
    }
    return true;
  });

  const pendingTasks = filteredTasks.filter(
    (t) => t.status === "Pending"
  );
  const completedTasks = filteredTasks.filter(
    (t) => t.status === "Completed"
  );
  const skippedTasks = filteredTasks.filter(
    (t) => t.status === "Skipped"
  );

  const totalCount = filteredTasks.length;
  const completionPct = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;

  const statCards: SummaryCardItem[] = [
    {
      title: "Pending Tasks",
      value: String(pendingTasks.length),
      subtitle: "Awaiting execution",
      icon: <Clock className="size-5 text-amber-700" />,
      subtitleColor: "text-amber-700 font-medium",
    },
    {
      title: "Completed Today",
      value: String(completedTasks.length),
      subtitle: `${completionPct}% of selected-date tasks`,
      icon: <CheckCircle2 className="size-5 text-emerald-800" />,
      subtitleColor: "text-emerald-800 font-medium",
    },
    {
      title: "Skipped Tasks",
      value: String(skippedTasks.length),
      subtitle: "Clinical exceptions logged",
      icon: <AlertCircle className="size-5 text-rose-600" />,
      subtitleColor: "text-rose-600 font-medium",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Text as="h1" size="xl" weight="bold">
            Daily Tasks Board
          </Text>
          <Text size="md" weight="regular" variant="muted">
            Live floor execution tracking, routine completion verification, and clinical skip logging.
          </Text>
        </div>

        {/* Date and Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <DatePicker
            value={selectedDate}
            onChange={(date) =>
              setSelectedDate(date ? format(date, "yyyy-MM-dd") : "")
            }
            formatString="dd MMM yyyy"
            className="w-40"
          />

          <Select
            value={timeSlotFilter}
            onValueChange={(value) =>
              setTimeSlotFilter(value === "Day" || value === "Night" ? value : "ALL")
            }
          >
            <SelectTrigger className="w-35 h-11 bg-white border-slate-200">
              <SelectValue placeholder="Time Slot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Shifts</SelectItem>
              <SelectItem value="Day">Day shift</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <SummaryCardsGrid cards={statCards} className="grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6" />

      {/* Historical Date Notice */}
      {isPastDate && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200/80 text-amber-900 text-md rounded-xl font-medium">
          <AlertCircle className="size-4 shrink-0 text-amber-700" />
          <span>Historical daily tasks record for {selectedDate}. Tasks from elapsed dates cannot be marked as completed.</span>
        </div>
      )}
      {isFutureDate && (
        <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200 text-slate-700 text-md rounded-xl font-medium">
          <Clock className="size-4 shrink-0 text-slate-500" />
          <span>Future daily tasks for {selectedDate}. Tasks cannot be recorded before that date.</span>
        </div>
      )}

      {/* 3. Kanban Columns */}
      {isError ? (
        <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 space-y-3">
          <Text size="md" weight="medium" className="text-rose-800">
            Could not load daily tasks from residents’ current care plans.
          </Text>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="p-16 text-center bg-surface-card-grey rounded-2xl">
          <div className="animate-spin size-8 border-4 border-emerald-800 border-t-transparent rounded-full mx-auto mb-3" />
          <Text size="md" weight="medium" variant="muted">Loading daily tasks...</Text>
        </div>
      ) : (
        <>
        {tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
            <Text size="md" weight="medium" className="text-slate-800">
              No care tasks are due for this date and shift.
            </Text>
            <Text size="md" variant="muted" className="mt-1">
              Active tasks from current agreed care plans appear here when their schedule matches the selected date.
            </Text>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* Column 1: Pending */}
          <div className="bg-surface-card-grey rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Text size="md" weight="bold" className="text-slate-900">
                Pending ({pendingTasks.length})
              </Text>
              <Badge variant="secondary" state="warning" className="px-2 py-0.5 shadow-none">
                To do
              </Badge>
            </div>
            <div className="space-y-3">
              {pendingTasks.length === 0 ? (
                <div className="p-8 text-center bg-white/60 rounded-xl border border-dashed border-slate-200">
                  <Text size="md" variant="muted">No pending tasks</Text>
                </div>
              ) : (
                pendingTasks.map((t) => (
                  <DailyTaskCard
                    key={t.taskId}
                    task={t}
                    showActions={!isReadOnlyDate && !recordTaskMutation.isPending}
                    onComplete={(task) =>
                      recordTaskMutation.mutate({
                        residentId: task.residentId,
                        taskId: task.taskId,
                        data: { outcome: "Done", date: boardDate },
                      })
                    }
                    onSkip={setSkippingTask}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: Completed */}
          <div className="bg-surface-card-grey rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Text size="md" weight="bold" className="text-slate-900">
                Completed ({completedTasks.length})
              </Text>
              <Badge variant="secondary" state="success" className="px-2 py-0.5 shadow-none">
                Done
              </Badge>
            </div>
            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <div className="p-8 text-center bg-white/60 rounded-xl border border-dashed border-slate-200">
                  <Text size="md" variant="muted">No completed tasks yet</Text>
                </div>
              ) : (
                completedTasks.map((t) => (
                  <DailyTaskCard
                    key={t.taskId}
                    task={t}
                    showActions={false}
                    onComplete={() => undefined}
                    onSkip={() => undefined}
                  />
                ))
              )}
            </div>
          </div>
          {/* Column 3: Skipped */}
          <div className="bg-surface-card-grey rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Text size="md" weight="bold" className="text-slate-900">
                Skipped ({skippedTasks.length})
              </Text>
              <Badge variant="secondary" state="danger" className="px-2 py-0.5 shadow-none">
                Exceptions
              </Badge>
            </div>
            {skippedTasks.length === 0 ? (
              <div className="p-8 text-center bg-white/60 rounded-xl border border-dashed border-slate-200">
                <Text size="md" variant="muted">No skipped tasks</Text>
              </div>
            ) : (
              skippedTasks.map((t) => (
                <DailyTaskCard
                  key={t.taskId}
                  task={t}
                  showActions={false}
                  onComplete={() => undefined}
                  onSkip={() => undefined}
                />
              ))
            )}
          </div>
        </div>
        </>
      )}

      {/* 4. Skip Reason Modal */}
      {skippingTask && (
        <TaskSkipReasonModal
          isOpen={true}
          onClose={() => setSkippingTask(null)}
          taskTitle={skippingTask.title}
          isLoading={recordTaskMutation.isPending}
          onSubmit={(reason: string, notes?: string) => {
            recordTaskMutation.mutate({
              residentId: skippingTask.residentId,
              taskId: skippingTask.taskId,
              data: {
                outcome: "Declined",
                note: [reason, notes].filter(Boolean).join(" — "),
                date: boardDate,
              },
            }, {
              onSuccess: () => setSkippingTask(null),
            });
          }}
        />
      )}
    </div>
  );
}
