"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, differenceInMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Button, Badge, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  useGetMyShiftsQuery,
  useGetShiftRequestsQuery,
  useGetActiveShiftQuery,
} from "../../queries/shifts";
import { useAuth } from "../../context/AuthContext";
import { type Shift } from "../../types/shifts";
import { ShiftExecutionModal } from "./ShiftExecutionModal";
import { ShiftRequestDialog } from "./ShiftRequestDialog";
import { RotaBottomCards } from "./RotaBottomCards";
import {
  formatUkTime,
  getLocalCalendarDateString,
  getUkCalendarDate,
  getUkDateString,
  getUkDayEnd,
  getUkDayStart,
  normalizeLocalCalendarDate,
} from "../../utils/uk-date-time";

export function StaffRotaView() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(() => getUkCalendarDate(new Date()));
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Dialog state for Request Swap / Request Leave
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestDialogType, setRequestDialogType] = useState<"Leave" | "Change" | "Cover" | undefined>("Leave");
  const [targetShiftForRequest, setTargetShiftForRequest] = useState<Shift | null>(null);

  const calendarStartDate = normalizeLocalCalendarDate(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const calendarEndDate = normalizeLocalCalendarDate(endOfWeek(currentDate, { weekStartsOn: 1 }));
  const startDate = getUkDayStart(calendarStartDate);
  const endDate = getUkDayEnd(calendarEndDate);

  const { data: shifts, isLoading: isShiftsLoading } = useGetMyShiftsQuery({
    from: startDate.toISOString(),
    to: endDate.toISOString(),
  });

  const cycleStart = getUkDayStart(normalizeLocalCalendarDate(startOfWeek(currentDate, { weekStartsOn: 1 })));
  const cycleEnd = getUkDayEnd(normalizeLocalCalendarDate(endOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 })));
  const { data: cycleShifts } = useGetMyShiftsQuery({
    from: cycleStart.toISOString(),
    to: cycleEnd.toISOString(),
  });

  const { data: requests = [] } = useGetShiftRequestsQuery();
  const { data: activeShiftData } = useGetActiveShiftQuery();
  const now = new Date();
  const days = eachDayOfInterval({ start: calendarStartDate, end: calendarEndDate });
  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const calcMinutes = (list?: Shift[]) => {
    let mins = 0, count = 0;
    (list ?? []).forEach((s) => {
      const start = new Date(s.startTime || s.rawStartTime || "");
      const end = new Date(s.endTime || s.rawEndTime || "");
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        mins += differenceInMinutes(end, start);
        count++;
      }
    });
    return { hours: Math.round((mins / 60) * 10) / 10, count };
  };

  const { hours: weekHours, count: shiftCount } = useMemo(() => calcMinutes(shifts), [shifts]);
  const cycleHours = useMemo(() => calcMinutes(cycleShifts).hours, [cycleShifts]);

  // Derive active clock-in status
  const clockInStatus = useMemo(() => {
    if (activeShiftData?.active) {
      const act = activeShiftData.active;
      const start = new Date(act.startTime || act.rawStartTime || "");
      const timeStr = !isNaN(start.getTime()) ? formatUkTime(start) : "";
      return `Clocked in ${timeStr ? `since ${timeStr}` : ""}`.trim();
    }
    return "Not clocked in";
  }, [activeShiftData]);

  // Handle open Request Swap dialog for a specific shift
  const handleOpenSwapDialog = (shift: Shift) => {
    setTargetShiftForRequest(shift);
    setRequestDialogType("Change");
    setIsRequestDialogOpen(true);
  };

  // Handle open Request Leave dialog
  const handleOpenLeaveDialog = () => {
    setTargetShiftForRequest(null);
    setRequestDialogType(undefined);
    setIsRequestDialogOpen(true);
  };

  // Find primary wing from shifts or fallback
  const primaryWingName = useMemo(() => {
    const withWing = (shifts ?? []).find((s) => s.wing?.name);
    return withWing?.wing?.name || "";
  }, [shifts]);

  return (
    <div className="space-y-6 font-['Outfit',sans-serif]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text size="xl" weight="bold" className="tracking-tight">
            My rota
          </Text>
          <Text variant="subdued" size="xs" weight="regular">
            <span className="font-semibold text-slate-800">
              {user?.fullName || "Care assistant"}
            </span>{" "}
            · {user?.roleName || "Care assistant"}{primaryWingName ? ` · ${primaryWingName}` : ""} · contracted{" "}
            <span className="font-semibold text-slate-800">40.25 h/week (2-week rotation)</span>. Published weeks only; the rota is the plan, clock-in records actual hours.
          </Text>
        </div>

        {/* Week navigation control */}
        <div className="inline-flex items-center gap-1 self-start md:self-auto bg-white p-1 rounded-xl border border-slate-200/90 shadow-xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevWeek}
            className="size-8 cursor-pointer text-slate-600 hover:text-slate-900"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Text size="xs" weight="semibold" className="px-3 text-slate-800 whitespace-nowrap select-none">
            Week of {format(calendarStartDate, "d MMM")}
          </Text>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextWeek}
            className="size-8 cursor-pointer text-slate-600 hover:text-slate-900"
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* 7-Day Week Calendar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
        {days.map((day) => {
          const dayShifts =
            shifts?.filter((s) => {
              const dateVal = s.startTime || s.rawStartTime;
              if (!dateVal) return false;
              const d = new Date(dateVal);
              return (
                !isNaN(d.getTime()) &&
                getUkDateString(d) === getLocalCalendarDateString(day)
              );
            }) || [];

          const isToday = getLocalCalendarDateString(day) === getUkDateString(now);
          const hasShifts = dayShifts.length > 0;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "rounded-2xl border p-3 sm:p-3.5 flex flex-col justify-between min-h-[175px] transition-all gap-0",
                isToday
                  ? "border-emerald-700/80 bg-emerald-50/40 ring-1 ring-emerald-700/30 shadow-xs"
                  : "border-slate-200/80 bg-slate-50/70 shadow-2xs hover:border-slate-300 hover:bg-slate-50/90"
              )}
            >
              <div className="space-y-2">
                {/* Day Header */}
                <Text size="xs" weight="bold" className="text-slate-900">
                  {format(day, "EEE d MMM")}
                </Text>

                {/* Day Shifts */}
                {isShiftsLoading ? (
                  <div className="h-16 animate-pulse bg-slate-100 rounded-xl" />
                ) : hasShifts ? (
                  dayShifts.map((shift) => {
                    const timeDisplay = (() => {
                      const sStart = new Date(shift.startTime || shift.rawStartTime || "");
                      const sEnd = new Date(shift.endTime || shift.rawEndTime || "");
                      if (!isNaN(sStart.getTime()) && !isNaN(sEnd.getTime())) {
                        return `${formatUkTime(sStart)}–${formatUkTime(sEnd)}`;
                      }
                      if (shift.formattedStartTime && shift.formattedEndTime) {
                        return `${shift.formattedStartTime}–${shift.formattedEndTime}`.replace(/\s*(AM|PM|am|pm)/g, "");
                      }
                      return shift.timingFormatted ? shift.timingFormatted.replace(/\s*(AM|PM|am|pm)/g, "") : "07:45–20:15";
                    })();

                    const shiftTypeName = shift.type?.name || (shift as { name?: string })?.name || "Shift";
                    const locationName = (shift as { location?: string | null })?.location || shift.wing?.name || (shift as { wardName?: string | null })?.wardName || "";
                    const shiftStart = new Date(shift.startTime || shift.rawStartTime || "");
                    const shiftEnd = new Date(shift.endTime || shift.rawEndTime || "");
                    const isPastDay = getLocalCalendarDateString(day) < getUkDateString(now);
                    const isPastShift = (!isNaN(shiftEnd.getTime()) && shiftEnd.getTime() < now.getTime()) || isPastDay;
                    const isDraft = shift.status === "Draft";
                    const isCancelled = shift.status === "Cancelled";
                    const isAbsent = shift.status === "Absent";
                    const isCompleted = shift.status === "Completed" || Boolean(shift.currentLog?.status === "Completed");

                    const displayShiftStatus = (() => {
                      if (isDraft) return "Draft";
                      if (isCancelled) return "Cancelled";
                      if (isAbsent) return "Absent";
                      if (isPastShift) {
                        if (isCompleted) {
                          let hw = (shift as { actualHoursWorked?: number | null })?.actualHoursWorked;
                          if (hw === undefined || hw === null) {
                            const logStart = shift.currentLog?.actualStartTime ? new Date(shift.currentLog.actualStartTime).getTime() : shiftStart.getTime();
                            const logEnd = shift.currentLog?.actualEndTime ? new Date(shift.currentLog.actualEndTime).getTime() : shiftEnd.getTime();
                            hw = Math.max(0, Math.round((((logEnd - logStart) / (1000 * 60 * 60))) * 10) / 10);
                          }
                          return `Completed (${hw === 1 ? "1 hr" : `${hw} hrs`})`;
                        }
                        return shift.status === "Missed" || !shift.isStarted ? "Missed" : shift.status || "Missed";
                      }
                      if (shift.isStarted) return "In Progress";
                      return "Scheduled";
                    })();

                    const statusBadgeClass = isDraft ? "bg-amber-50 text-amber-800 border-amber-200"
                      : displayShiftStatus.startsWith("Completed") ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                      : displayShiftStatus === "Missed" ? "bg-rose-50 text-rose-700 border-rose-200"
                      : displayShiftStatus === "Absent" ? "bg-amber-50 text-amber-800 border-amber-200"
                      : displayShiftStatus === "Cancelled" ? "bg-slate-100 text-slate-600 border-slate-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200/80";

                    return (
                      <div
                        key={shift.id}
                        onClick={() => setSelectedShift(shift)}
                        role="button"
                        tabIndex={0}
                        className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer space-y-1.5 overflow-hidden min-w-0 group"
                      >
                        {/* Badges Header with Wrap & Overflow Prevention */}
                        <div className="flex items-center justify-between gap-1 flex-wrap min-w-0">
                          <Badge
                            variant="outline"
                            state="info"
                            className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 text-emerald-800 border-emerald-200 truncate max-w-[85px] shadow-none"
                            title={shiftTypeName}
                          >
                            {shiftTypeName}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("px-1.5 py-0.5 text-[10px] font-semibold rounded-md shrink-0 shadow-none", statusBadgeClass)}
                          >
                            {displayShiftStatus}
                          </Badge>
                        </div>

                        {/* Timing */}
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 min-w-0">
                          <Clock className="size-3 text-emerald-700 shrink-0" />
                          <span className="truncate">{timeDisplay}</span>
                        </div>

                        {/* Wing / Room / Facility Location - left blank if none assigned */}
                        {locationName ? (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 min-w-0">
                            <MapPin className="size-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{locationName}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  /* Off day badge */
                  <div className="pt-0.5">
                    <Badge
                      variant="outline"
                      state="inactive"
                      className="p-0 px-2 py-0.5 text-xs font-medium rounded-md shadow-none"
                    >
                      Off
                    </Badge>
                  </div>
                )}
              </div>

              {/* Bottom Request swap button (hidden for past dates) */}
              {(() => {
                const isPastDay = getLocalCalendarDateString(day) < getUkDateString(now);
                if (isPastDay) return null;
                const swappable = dayShifts.find((s) => s.status !== "Draft" && s.status !== "Cancelled");
                return swappable ? (
                  <div className="pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSwapDialog(swappable)}
                      className="w-full h-7 text-[11px] font-medium rounded-xl border-slate-200/90 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-none"
                    >
                      Request swap
                    </Button>
                  </div>
                ) : null;
              })()}
            </div>
          );
        })}
      </div>

      {/* Two-Column Bottom Section: Hours & My Requests */}
      <RotaBottomCards
        weekHours={weekHours}
        shiftCount={shiftCount}
        cycleHours={cycleHours}
        clockInStatus={clockInStatus}
        requests={requests}
        onRequestLeave={handleOpenLeaveDialog}
      />

      {/* Interactive Shift Details & Clock-in/Clock-out Modal */}
      <ShiftExecutionModal
        isOpen={Boolean(selectedShift)}
        onClose={() => setSelectedShift(null)}
        shift={selectedShift}
      />

      {/* Shift Request / Swap Modal */}
      <ShiftRequestDialog
        isOpen={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        defaultType={requestDialogType}
        selectedShift={targetShiftForRequest}
        myShifts={shifts ?? []}
      />
    </div>
  );
}
