"use client";

import { useState } from "react";
import Link from "next/link";
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
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SummaryCardsGrid, type SummaryCardItem } from "@repo/ui/components/ui";
import { useGetDailyTasksQuery } from "../../../../../lib/queries/residents";
import { useUpdateDailyTaskStatusMutation } from "../../../../../lib/queries/care-plan";
import { TaskSkipReasonModal } from "../../../../shared/components/care-plan/TaskSkipReasonModal";
import { DailyTaskCard, TaskItem } from "./components/DailyTaskCard";

export default function FacilityDailyTasksPage() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isPastDate = Boolean(selectedDate && selectedDate < todayStr);
  const [timeSlotFilter, setTimeSlotFilter] = useState("ALL");
  const [skippingTask, setSkippingTask] = useState<{ id: string; title: string } | null>(null);

  const { data: rawTasks = [], isLoading } = useGetDailyTasksQuery({
    date: selectedDate,
  });

  const tasks: TaskItem[] = Array.isArray(rawTasks) ? (rawTasks as TaskItem[]) : [];
  const updateStatusMutation = useUpdateDailyTaskStatusMutation();

  const filteredTasks = tasks.filter((t) => {
    if (timeSlotFilter !== "ALL" && t.timeSlot !== timeSlotFilter) {
      return false;
    }
    return true;
  });

  const pendingTasks = filteredTasks.filter(
    (t) => t.status === "Pending" || t.status === "pending"
  );
  const completedTasks = filteredTasks.filter(
    (t) => t.status === "Completed" || t.status === "completed"
  );
  const skippedTasks = filteredTasks.filter(
    (t) => t.status === "Skipped" || t.status === "skipped"
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
      subtitle: `${completionPct}% task completion rate`,
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
          <Text size="sm" weight="regular" variant="muted">
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

          <Select value={timeSlotFilter} onValueChange={setTimeSlotFilter}>
            <SelectTrigger className="w-35 h-11 bg-white border-slate-200">
              <SelectValue placeholder="Time Slot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Slots</SelectItem>
              <SelectItem value="Morning">Morning</SelectItem>
              <SelectItem value="Afternoon">Afternoon</SelectItem>
              <SelectItem value="Evening">Evening</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <SummaryCardsGrid cards={statCards} className="grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6" />

      {/* Historical Date Notice */}
      {isPastDate && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200/80 text-amber-900 text-sm rounded-xl font-medium">
          <AlertCircle className="size-4 shrink-0 text-amber-700" />
          <span>Historical daily tasks record for {selectedDate}. Tasks from elapsed dates cannot be marked as completed.</span>
        </div>
      )}

      {/* 3. Kanban Columns */}
      {isLoading ? (
        <div className="p-16 text-center bg-surface-card-grey rounded-2xl">
          <div className="animate-spin size-8 border-4 border-emerald-800 border-t-transparent rounded-full mx-auto mb-3" />
          <Text size="sm" weight="medium" variant="muted">Loading daily tasks...</Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* Column 1: Pending */}
          <div className="bg-surface-card-grey rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Text size="sm" weight="bold" className="text-slate-900">
                Pending ({pendingTasks.length})
              </Text>
              <Badge variant="secondary" state="warning" className="px-2 py-0.5 shadow-none">
              </Badge>
            </div>
            <div className="space-y-3">
              {pendingTasks.length === 0 ? (
                <div className="p-8 text-center bg-white/60 rounded-xl border border-dashed border-slate-200">
                  <Text size="sm" variant="muted">No pending tasks</Text>
                </div>
              ) : (
                pendingTasks.map((t) => (
                  <DailyTaskCard
                    key={t.id}
                    task={t}
                    showActions={!isPastDate}
                    onComplete={(id) =>
                      updateStatusMutation.mutate({
                        taskId: id,
                        data: { status: "Completed" },
                      })
                    }
                    onSkip={(id, title) => setSkippingTask({ id, title })}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: Completed */}
          <div className="bg-surface-card-grey rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Text size="sm" weight="bold" className="text-slate-900">
                Completed ({completedTasks.length})
              </Text>
              <Badge variant="secondary" state="success" className="px-2 py-0.5 shadow-none">
                Done
              </Badge>
            </div>
            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <div className="p-8 text-center bg-white/60 rounded-xl border border-dashed border-slate-200">
                  <Text size="sm" variant="muted">No completed tasks yet</Text>
                </div>
              ) : (
                completedTasks.map((t) => (
                  <DailyTaskCard
                    key={t.id}
                    task={t}
                    showActions={false}
                    onComplete={() => { }}
                    onSkip={() => { }}
                  />
                ))
              )}
            </div>
          </div>
          {/* Column 3: Skipped */}
          <div className="bg-surface-card-grey rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Text size="sm" weight="bold" className="text-slate-900">
                Skipped ({skippedTasks.length})
              </Text>
              <Badge variant="secondary" state="danger" className="px-2 py-0.5 shadow-none">
                Exceptions
              </Badge>
            </div>
            {skippedTasks.length === 0 ? (
              <div className="p-8 text-center bg-white/60 rounded-xl border border-dashed border-slate-200">
                <Text size="sm" variant="muted">No skipped tasks</Text>
              </div>
            ) : (
              skippedTasks.map((t) => (
                <DailyTaskCard
                  key={t.id}
                  task={t}
                  showActions={false}
                  onComplete={() => { }}
                  onSkip={() => { }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. Skip Reason Modal */}
      {skippingTask && (
        <TaskSkipReasonModal
          isOpen={true}
          onClose={() => setSkippingTask(null)}
          taskTitle={skippingTask.title}
          onSubmit={(reason: string) => {
            updateStatusMutation.mutate({
              taskId: skippingTask.id,
              data: {
                status: "Skipped",
                skipReason: reason,
              },
            });
            setSkippingTask(null);
          }}
        />
      )}
    </div>
  );
}
