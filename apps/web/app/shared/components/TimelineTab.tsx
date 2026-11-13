"use client";

import React from "react";
import { useGetResidentTimelineQuery } from "../../../lib/queries/residents";
import { format } from "date-fns";
import {
  Activity,
  UserPlus,
  UserMinus,
  ClipboardList,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Card, CardContent, Badge } from "@repo/ui/components/ui";
import { usePagination } from "@repo/ui/hooks";
import { Pagination } from "@repo/ui/components/ui/Pagination";

interface TimelineTabProps {
  residentId: string;
  selectedDate?: Date;
}

const getIcon = (eventType: string) => {
  switch (eventType) {
    case "RESIDENT_ADMITTED":
      return <UserPlus className="w-4 h-4 text-green-500" />;
    case "RESIDENT_DISCHARGED":
      return <UserMinus className="w-4 h-4 text-red-500" />;
    case "OBSERVATION":
      return <Activity className="w-4 h-4 text-blue-500" />;
    case "CARE_PLAN_UPDATED":
      return <ClipboardList className="w-4 h-4 text-purple-500" />;
    default:
      return <MessageSquare className="w-4 h-4 text-gray-500" />;
  }
};

export function TimelineTab({ residentId, selectedDate }: TimelineTabProps) {
  const { data: allTimeline, isLoading } =
    useGetResidentTimelineQuery(residentId);

  const timeline = React.useMemo(() => {
    if (!allTimeline) return [];
    if (!selectedDate) return allTimeline;

    return allTimeline.filter(
      (event: any) =>
        new Date(event.timestamp).toDateString() ===
        selectedDate.toDateString(),
    );
  }, [allTimeline, selectedDate]);

  const {
    currentPage,
    pageSize,
    paginatedData: paginatedTimeline,
    totalRecords,
    handlePageChange,
    handleLimitChange,
  } = usePagination(timeline);

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-border shadow-sm">
        <Clock className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">No timeline events found.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pb-8">
      {/* Vertical line */}
      <div className="absolute left-[24px] top-4 bottom-4 w-0.5 bg-border hidden sm:block" />

      {paginatedTimeline.map((event: any, idx: number) => (
        <div
          key={event.id}
          className="relative flex items-start gap-4 sm:gap-6 group"
        >
          {/* Dot/Icon */}
          <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full border border-border bg-white shadow-sm shrink-0 transition-all group-hover:border-primary/30 group-hover:shadow-md">
            {getIcon(event.eventType)}
          </div>

          <Card className="flex-1 shadow-sm border-border hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-foreground text-md">
                  {event.summary}
                </span>
                <span className="text-md text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1 w-fit whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {format(new Date(event.timestamp), "MMM d, yyyy · h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-md text-muted-foreground">
                <span className="font-medium text-foreground/70">
                  {event.carer?.fullName || "System Admin"}
                </span>
                <span>•</span>
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-md uppercase font-bold tracking-wider"
                >
                  {event.eventType.replace(/_/g, " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
      <Pagination
        pageNumber={currentPage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        limit={pageSize.toString()}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        disabled={isLoading}
      />
    </div>
  );
}
