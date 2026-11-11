"use client";

import React, { useState, useMemo } from "react";
import { format, isValid, startOfDay, endOfDay } from "date-fns";
import { useGetResidentTimelineQuery } from "../../../../../../lib/queries/residents";
import { Search, CheckCircle2, Clock4, XCircle, UserCheck } from "lucide-react";
import {
  Badge,
  Card,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DatePicker,
  DateRange,
} from "@repo/ui/components/ui";
import { TaskDetailDialog, type TaskHistoryItem } from "./TaskDetailDialog";
import { cn } from "@repo/ui/lib/utils";

interface ResidentTimelineTabProps {
  residentId: string;
}

interface RawTimelineEvent {
  id?: string;
  eventType?: string;
  title?: string;
  action?: string;
  summary?: string;
  description?: string;
  details?: string;
  notes?: string;
  instructions?: string | null;
  precautions?: string | null;
  skipReason?: string | null;
  category?: string;
  type?: string;
  status?: string;
  timestamp?: string | Date;
  performedBy?: string;
  role?: string;
  userFullName?: string;
  userRoleName?: string;
  carer?: { fullName?: string; role?: { name?: string } };
}

const CATEGORIES = ["All", "Clinical", "Medication", "Care Plan", "Personal Care"] as const;

export function ResidentTimelineTab({ residentId }: ResidentTimelineTabProps): React.JSX.Element {
  const { data: realTimeline, isLoading } = useGetResidentTimelineQuery(residentId);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [viewingEvent, setViewingEvent] = useState<TaskHistoryItem | null>(null);

  const pageSize = parseInt(rowsPerPage, 10) || 10;

  const toIso = (d?: string | Date | null): string => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    return isValid(date) ? format(date, "yyyy-MM-dd") : "";
  };

  const dataList: TaskHistoryItem[] = useMemo(() => {
    if (!realTimeline || !Array.isArray(realTimeline) || realTimeline.length === 0) return [];

    return (realTimeline as RawTimelineEvent[])
      .filter((item) => item.eventType !== "RECORD_VIEWED")
      .map((item, idx) => {
        const dateObj = item.timestamp ? new Date(item.timestamp) : null;
        const isValidDate = Boolean(dateObj && isValid(dateObj));
        const dateValue = isValidDate && dateObj ? toIso(dateObj) : "";
        const performer = item.carer?.fullName || item.performedBy || item.userFullName || "Staff Member";
        const role = item.carer?.role?.name || item.role || item.userRoleName || "Staff";

        let eventTitle = item.title || item.action;
        if (!eventTitle) {
          if (item.eventType === "BODY_MAP") eventTitle = item.summary?.includes("Resolved") ? "Body Map: Finding Resolved" : "Body Map Finding";
          else if (item.eventType?.startsWith("OBSERVATION")) eventTitle = "Clinical Observation Logged";
          else if (item.eventType === "MEDICATION_ADMINISTERED") eventTitle = "Medication Administered";
          else if (item.eventType === "RESIDENT_ADMITTED") eventTitle = "Resident Admission Finalized";
          else if (item.eventType) eventTitle = item.eventType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
          else eventTitle = "Clinical Activity";
        }

        let category = item.category || "Clinical";
        if (!item.category) {
          if (item.eventType?.includes("CARE_PLAN")) category = "Care Plan";
          else if (item.eventType?.includes("MEDICATION")) category = "Medication";
          else if (/nutrition|food|fluid|personal/i.test(item.eventType || "")) category = "Personal Care";
          else if (item.type) category = item.type;
        }

        return {
          id: item.id || `timeline-${idx}`,
          dateTime: isValidDate && dateObj ? format(dateObj, "dd MMM yyyy") : "Today",
          timeDisplay: isValidDate && dateObj ? format(dateObj, "HH:mm") : "",
          dateValue,
          nurseName: performer,
          taskTitle: eventTitle,
          taskSubtitle: item.description || item.summary || item.details || "-",
          category,
          completedBy: performer,
          completedByRole: role,
          completedByInitials: performer.split(" ").map((n) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2),
          status: item.status || "Completed",
          notes: item.notes || item.summary || "-",
          instructions: item.instructions || null,
          precautions: item.precautions || null,
          skipReason: item.skipReason || null,
        };
      });
  }, [realTimeline]);

  const filtered = useMemo(() => {
    return dataList.filter((item) => {
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
      const matchesSearch =
        item.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.taskSubtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.completedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesRange = true;
      if (dateRange?.from || dateRange?.to) {
        const from = dateRange.from ? startOfDay(dateRange.from) : null;
        const to = dateRange.to ? endOfDay(dateRange.to) : null;
        const eventDate = item.dateValue ? new Date(item.dateValue) : null;
        if (eventDate && isValid(eventDate)) {
          if (from && eventDate < from) matchesRange = false;
          if (to && eventDate > to) matchesRange = false;
        }
      }
      return matchesSearch && matchesRange;
    });
  }, [dataList, selectedCategory, searchTerm, dateRange]);

  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  const renderCategoryBadge = (category: string) => {
    const isSuccess = /medication|taken|personal care/i.test(category);
    const isDanger = /care note|missed/i.test(category);
    const isWarning = /care plan/i.test(category);
    const isInfo = /therapy|clinical/i.test(category);
    const state = isSuccess ? "success" : isDanger ? "danger" : isWarning ? "warning" : isInfo ? "info" : "inactive";
    return <Badge variant="secondary" state={state} className="px-2.5 py-0.5 shadow-none text-md font-normal">{category}</Badge>;
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pending") return <div className="flex items-center gap-1.5 font-normal text-amber-800 text-md"><Clock4 className="size-4 text-amber-600 shrink-0" /><span>Pending</span></div>;
    if (/skipped|missed|refused/.test(s)) return <div className="flex items-center gap-1.5 font-normal text-rose-800 text-md"><XCircle className="size-4 text-rose-600 shrink-0" /><span>{status}</span></div>;
    return <div className="flex items-center gap-1.5 font-normal text-emerald-800 text-md"><CheckCircle2 className="size-4 text-emerald-600 shrink-0" /><span>Completed</span></div>;
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Category Filter Pills & Controls Bar in One Line */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-md font-semibold transition-all border cursor-pointer",
                  isSelected
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Timeline & Select Date Range */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 [&_[data-slot=input-error]]:hidden">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
            <Input
              placeholder="Search Timeline..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 rounded-xl h-[44px] text-md"
            />
          </div>

          <DatePicker
            variant="date-range"
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              setCurrentPage(1);
            }}
            showPresets
            placeholder="Select date range"
            className="w-64"
          />
        </div>
      </div>

      {/* 2. Main Table Card */}
      <Card className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 hover:bg-transparent bg-transparent h-auto">
                <TableHead className="w-12 whitespace-nowrap pl-4 pb-3 font-semibold text-md text-slate-800">#</TableHead>
                <TableHead className="pb-3 px-4 font-semibold text-md text-slate-800">Date &amp; Time</TableHead>
                <TableHead className="pb-3 px-4 font-semibold text-md text-slate-800">Event / Activity</TableHead>
                <TableHead className="pb-3 px-4 font-semibold text-md text-slate-800">Category</TableHead>
                <TableHead className="pb-3 px-4 font-semibold text-md text-slate-800">Logged By</TableHead>
                <TableHead className="pb-3 px-4 font-semibold text-md text-slate-800">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-md">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-500 text-md">
                    Loading timeline events...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-500 text-md">
                    No timeline records found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item, index) => {
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => setViewingEvent(item)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <TableCell className="pl-4 font-normal text-slate-500 text-md">{rowNumber}</TableCell>
                      <TableCell className="px-4 whitespace-nowrap">
                        <div className="font-normal text-slate-700 text-md">{item.dateTime}</div>
                        {item.timeDisplay && (
                          <div className="text-sm sm:text-md text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock4 className="size-3 text-slate-400" />
                            <span>{item.timeDisplay}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 max-w-md min-w-0">
                        <div className="font-normal text-slate-800 break-words break-all [overflow-wrap:anywhere] text-md">{item.taskTitle}</div>
                        <div className="text-sm sm:text-md text-slate-500 truncate mt-0.5">{item.taskSubtitle}</div>
                      </TableCell>
                      <TableCell className="px-4 whitespace-nowrap">{renderCategoryBadge(item.category)}</TableCell>
                      <TableCell className="px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="size-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-normal text-slate-700 text-md">{item.completedBy}</div>
                            {item.completedByRole && (
                              <div className="text-sm sm:text-md text-slate-400">{item.completedByRole}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 whitespace-nowrap">{renderStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Pagination
              pageNumber={currentPage}
              pageSize={pageSize}
              totalRecords={filtered.length}
              limit={rowsPerPage}
              onPageChange={(page: number) => setCurrentPage(page)}
              onLimitChange={(lim: string) => {
                setRowsPerPage(lim);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </Card>

      {/* Event Details Dialog */}
      <TaskDetailDialog open={Boolean(viewingEvent)} onOpenChange={(open) => !open && setViewingEvent(null)} task={viewingEvent} />
    </div>
  );
}
