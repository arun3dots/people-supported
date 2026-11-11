"use client";

import React from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@repo/ui/components/ui";
import { Pagination } from "@repo/ui/components/ui/Pagination";
import { Plus, ClipboardList, Clock, CheckCircle2 } from "lucide-react";

interface DailyTaskListSectionProps {
  tasks: any[];
  paginatedTasks: any[];
  isLoading: boolean;
  selectedDate: Date;
  canManagePlan: boolean;
  onAddTaskClick: () => void;
  onStatusUpdate: (taskId: string, status: "Completed" | "Skipped") => void;
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: string) => void;
}

export function DailyTaskListSection({
  tasks,
  paginatedTasks,
  isLoading,
  selectedDate,
  canManagePlan,
  onAddTaskClick,
  onStatusUpdate,
  currentPage,
  pageSize,
  totalRecords,
  onPageChange,
  onLimitChange,
}: DailyTaskListSectionProps) {
  return (
    <div className="space-y-6">
      {/* Daily Tasks Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardList className="size-5 text-[#3D5C57]" />
            Daily Tasks
          </h3>
          <p className="text-md text-slate-500 font-medium mt-0.5">
            Tasks scheduled for {format(selectedDate, "EEEE, MMM do")}
          </p>
        </div>
        {canManagePlan && (
          <Button
            onClick={onAddTaskClick}
            className="h-10 px-5 rounded-xl bg-[#3D5C57] hover:bg-[#2D4541] text-white font-bold text-md gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="size-4" /> Add Task
          </Button>
        )}
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {paginatedTasks.map((task: any) => {
              const category = task.carePlanTask?.category || task.category || "General";
              const title = task.carePlanTask?.title || task.title;
              const description = task.carePlanTask?.description || task.description || "Daily care requirement.";
              const isCompleted = task.status === "Completed";
              const priority = task.carePlanTask?.priority || task.priority || "Medium";

              return (
                <Card
                  key={task.id}
                  className="hover:shadow-xs transition-shadow border border-slate-200/80 rounded-2xl overflow-hidden group bg-white flex flex-col justify-between"
                >
                  <div
                    className={`h-1.5 w-full ${isCompleted ? "bg-emerald-600" : "bg-amber-500"}`}
                  />
                  <CardHeader className="p-5 pb-2 flex flex-row items-start justify-between space-y-0 gap-3">
                    <div className="space-y-1 min-w-0">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {category}
                      </span>
                      <CardTitle className="text-base font-bold text-slate-900 group-hover:text-[#3D5C57] transition-colors truncate">
                        {title}
                      </CardTitle>
                    </div>
                    <Badge
                      className={`text-[10px] font-bold shrink-0 ${priority === "High" || priority === "Critical"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                    >
                      {task.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-5 pt-2 space-y-4">
                    <p className="text-md text-slate-600 line-clamp-2 leading-relaxed">
                      {description}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-md font-semibold text-slate-500">
                        <Clock className="size-3.5 text-slate-400" />
                        <span>{task.timeSlot || task.timeOfDay || "Scheduled"}</span>
                      </div>
                      {!isCompleted && (
                        <Button
                          size="sm"
                          className="h-8 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-md gap-1 cursor-pointer"
                          onClick={() => onStatusUpdate(task.id, "Completed")}
                        >
                          <CheckCircle2 className="size-3.5" /> Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Pagination
            pageNumber={currentPage}
            pageSize={pageSize}
            totalRecords={totalRecords}
            limit={pageSize.toString()}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            disabled={isLoading}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
          <ClipboardList className="size-12 text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-800">
            No tasks found for this date
          </h4>
          <p className="text-md text-slate-500 mt-0.5">
            All tasks scheduled for this day will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
