"use client";

import React, { useState, useMemo } from "react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { useGetDailyTasksQuery, useUpdateDailyTaskStatusMutation } from "../../../../../../lib/queries/residents";
import { Search, Clock, ChevronLeft, ChevronRight, Check, Ban } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { TaskSkipReasonModal } from "../../../../../shared/components/care-plan/TaskSkipReasonModal";
import { TaskDetailDialog, type TaskHistoryItem } from "./TaskDetailDialog";
import {
  type DailyTaskOccurrence,
  STATUS_FILTERS,
  TIME_SLOTS,
  toTaskHistoryItem,
  renderTaskStatus,
  renderTaskPriority,
} from "./ResidentTasksTab.utils";
import { cn } from "@repo/ui/lib/utils";

interface ResidentTasksTabProps {
  residentId: string;
}

export function ResidentTasksTab({ residentId }: ResidentTasksTabProps): React.JSX.Element {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [timeSlotFilter, setTimeSlotFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");

  const [skippingTask, setSkippingTask] = useState<{ id: string; title: string } | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskHistoryItem | null>(null);

  const pageSize = parseInt(rowsPerPage, 10) || 10;
  const { data: rawTasks, isLoading } = useGetDailyTasksQuery({ residentId, date: selectedDate });
  const updateMutation = useUpdateDailyTaskStatusMutation();

  const taskList: DailyTaskOccurrence[] = useMemo(() => {
    return Array.isArray(rawTasks) ? (rawTasks as DailyTaskOccurrence[]) : [];
  }, [rawTasks]);

  const counts = useMemo(() => {
    const pending = taskList.filter((t) => t.status === "Pending" || t.status === "pending").length;
    const inProgress = taskList.filter((t) => t.status === "InProgress" || t.status === "in_progress").length;
    const completed = taskList.filter((t) => t.status === "Completed" || t.status === "completed").length;
    const skipped = taskList.filter((t) => t.status === "Skipped" || t.status === "skipped").length;
    return { pending, inProgress, completed, skipped, total: taskList.length };
  }, [taskList]);

  const filteredTasks = useMemo(() => {
    return taskList.filter((t) => {
      if (statusFilter !== "ALL") {
        const normStatus = t.status.toLowerCase();
        const normFilter = statusFilter.toLowerCase();
        if (normFilter === "inprogress" ? normStatus !== "inprogress" && normStatus !== "in_progress" : normStatus !== normFilter) {
          return false;
        }
      }
      if (timeSlotFilter && timeSlotFilter !== "All" && (t.timeSlot || "AllDay").toLowerCase() !== timeSlotFilter.toLowerCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(term);
        const matchesCategory = t.category.toLowerCase().includes(term);
        const matchesStaff = t.assignedStaff?.fullName.toLowerCase().includes(term) ?? false;
        if (!matchesTitle && !matchesCategory && !matchesStaff) return false;
      }
      return true;
    });
  }, [taskList, statusFilter, timeSlotFilter, searchTerm]);

  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  const handleDateShift = (direction: -1 | 1) => {
    const current = new Date(selectedDate);
    const updated = direction === 1 ? addDays(current, 1) : subDays(current, 1);
    setSelectedDate(format(updated, "yyyy-MM-dd"));
    setCurrentPage(1);
  };

  const handleMarkComplete = (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateMutation.mutate({ taskId, data: { status: "Completed" } });
  };

  const handleOpenSkipModal = (task: DailyTaskOccurrence, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSkippingTask({ id: task.id, title: task.title });
  };

  const handleConfirmSkip = (skipReason: string, notes?: string) => {
    if (!skippingTask) return;
    updateMutation.mutate(
      { taskId: skippingTask.id, data: { status: "Skipped", skipReason, notes } },
      { onSettled: () => setSkippingTask(null) }
    );
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Controls Bar in One Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Pending & Slot Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[120px]">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-[40px] px-[10px] rounded-xl text-md font-semibold bg-white border-slate-200 text-slate-800">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.id} value={filter.id} className="text-md font-medium">
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[130px]">
            <Select
              value={timeSlotFilter}
              onValueChange={(val) => {
                setTimeSlotFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-[40px] px-[10px] rounded-xl text-md font-semibold bg-white border-slate-200 text-slate-800">
                <SelectValue placeholder="Select Slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot} className="text-md font-medium">
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right: Date Switcher & Search Tasks */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateShift(-1)}
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <ChevronLeft className="size-4 text-slate-700" />
            </Button>
            <div className="px-2 text-md font-semibold text-slate-800 min-w-[90px] text-center">
              {format(parseISO(selectedDate), "dd MMM yyyy")}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateShift(1)}
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <ChevronRight className="size-4 text-slate-700" />
            </Button>
          </div>

          <div className="relative min-w-56 [&_[data-slot=input-error]]:hidden">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 rounded-xl h-[40px] text-md"
            />
          </div>
        </div>
      </div>

      {/* 3. Table Card */}
      <Card className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 hover:bg-transparent bg-transparent h-auto">
                <TableHead className="w-12 whitespace-nowrap pl-4 pb-3 font-semibold text-md text-slate-800">#</TableHead>
                <TableHead className="pb-3 px-4 font-semibold text-md text-slate-800">Date &amp; Time</TableHead>
                <TableHead className="pb-3 px-4 font-semibold text-md text-slate-800">Task / Activity</TableHead>
                <TableHead className="pb-3 px-4 font-semibold text-md text-slate-800">Category</TableHead>
                <TableHead className="pb-3 px-4 font-semibold text-md text-slate-800">Status</TableHead>
                <TableHead className="pb-3 px-4 text-right font-semibold text-md text-slate-800">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-md">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-500 text-md">Loading resident tasks...</TableCell>
                </TableRow>
              ) : paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-500 text-md">
                    No {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} tasks scheduled for this date.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((t, index) => {
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;
                  const canAction = t.status === "Pending" || t.status === "pending" || t.status === "InProgress";

                  return (
                    <TableRow
                      key={t.id}
                      onClick={() => setViewingTask(toTaskHistoryItem(t))}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <TableCell className="pl-4 font-medium text-slate-500 text-md">{rowNumber}</TableCell>
                      <TableCell className="px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-md">{format(new Date(t.scheduledDate), "dd MMM yyyy")}</div>
                        <div className="text-md text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="size-3 text-slate-400" />
                          <span>{t.targetTime || t.timeSlot || "All Day"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 max-w-md min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-md break-words break-all [overflow-wrap:anywhere]">{t.title}</span>
                          {renderTaskPriority(t.priority)}
                        </div>
                        {t.instructions && <div className="text-md text-slate-500 truncate mt-0.5 max-w-sm">{t.instructions}</div>}
                        {t.assignedStaff && <div className="text-md text-slate-400 mt-0.5">Assigned: {t.assignedStaff.fullName}</div>}
                      </TableCell>
                      <TableCell className="px-4 whitespace-nowrap">
                        <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none text-md">{t.category}</Badge>
                      </TableCell>
                      <TableCell className="px-4 whitespace-nowrap">{renderTaskStatus(t.status)}</TableCell>
                      <TableCell className="px-4 whitespace-nowrap text-right">
                        {canAction ? (
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleMarkComplete(t.id, e)}
                              disabled={updateMutation.isPending}
                              className="h-8 px-2.5 text-md font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <Check className="size-3.5" />
                              <span>Complete</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleOpenSkipModal(t, e)}
                              disabled={updateMutation.isPending}
                              className="h-8 px-2 text-md font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <Ban className="size-3" />
                              <span>Skip</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-md text-slate-400 font-medium">Logged</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {filteredTasks.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Pagination
              pageNumber={currentPage}
              pageSize={pageSize}
              totalRecords={filteredTasks.length}
              limit={rowsPerPage}
              onPageChange={(page: number) => setCurrentPage(page)}
              onLimitChange={(lim: string) => { setRowsPerPage(lim); setCurrentPage(1); }}
            />
          </div>
        )}
      </Card>

      {/* Task Modals */}
      <TaskSkipReasonModal
        isOpen={Boolean(skippingTask)}
        onClose={() => setSkippingTask(null)}
        onSubmit={handleConfirmSkip}
        taskTitle={skippingTask?.title || ""}
        isLoading={updateMutation.isPending}
      />
      <TaskDetailDialog open={Boolean(viewingTask)} onOpenChange={(open) => !open && setViewingTask(null)} task={viewingTask} />
    </div>
  );
}
