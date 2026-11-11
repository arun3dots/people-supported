"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Send,
  Save,
  Clock,
  PlayCircle,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  Button,
  Card,
  Text,
  Badge,
  Textarea,
  EmptyState,
  toast,
} from "@repo/ui/components/ui";
import { getShiftClockInEligibility } from "../../../../lib/utils/shift-timing";
import { Shift } from "../../../../lib/types/shifts";
import { cn } from "@repo/ui/lib/utils";
import {
  useGetMyShiftsQuery,
  useGetActiveShiftQuery,
  useGetShiftDetailsQuery,
  useEndShiftMutation,
  useStartShiftMutation,
  useUpdateHandoverNotesMutation,
} from "../../../../lib/queries/shifts";
import { useGetResidentsQuery, useGetDailyTasksQuery } from "../../../../lib/queries/residents";
import { useGetIncidentsQuery } from "../../../../lib/queries/incidents";
import type { Resident } from "../../../../lib/types/resident";
import type { Incident } from "../../../../lib/types/incident";
import { HandoverBriefingCard } from "./components/HandoverBriefingCard";
import {
  HandoverResidentCard,
  type HandoverDailyTaskItem,
} from "./components/HandoverResidentCard";
import { HandoverTasksSection } from "./components/HandoverTasksSection";

export default function CarerHandoverPage() {
  const { data: shifts = [] } = useGetMyShiftsQuery({});
  const { data: activeShiftData } = useGetActiveShiftQuery();
  const { data: residents = [], isLoading: loadingResidents } = useGetResidentsQuery();
  const { data: rawTasks = [], isLoading: loadingTasks } = useGetDailyTasksQuery({
    date: format(new Date(), "yyyy-MM-dd"),
  });
  const { data: rawIncidents = [] } = useGetIncidentsQuery();

  const ongoingShift = (activeShiftData?.active || shifts.find((s) => s.isStarted)) as
    | { id: string; name?: string; wardName?: string; startTime?: string; endTime?: string }
    | undefined;

  const nextScheduledShift = (activeShiftData?.next || shifts.find((s) => !s.isCompleted)) as
    | { id: string; name?: string; wardName?: string; startTime?: string; endTime?: string }
    | undefined;

  const activeShiftId = ongoingShift?.id || nextScheduledShift?.id || "";
  const nextEligibility = getShiftClockInEligibility(nextScheduledShift as Shift | null);

  // Query shift details (includes incoming handover briefing from previous shift)
  const { data: shiftDetails } = useGetShiftDetailsQuery(activeShiftId, {
    enabled: Boolean(activeShiftId),
  });

  const [handoverNotes, setHandoverNotes] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const startShiftMutation = useStartShiftMutation();
  const updateHandoverMutation = useUpdateHandoverNotesMutation();
  const endShiftMutation = useEndShiftMutation();

  // Populate existing handover notes if already saved in shift log
  useEffect(() => {
    if (shiftDetails?.handoverNotes && !generalNotes) {
      setGeneralNotes(shiftDetails.handoverNotes);
    }
  }, [shiftDetails?.handoverNotes, generalNotes]);

  const tasks = (Array.isArray(rawTasks) ? rawTasks : []) as Array<
    HandoverDailyTaskItem & {
      resident?: { id: string; fullName: string } | null;
      priority?: string | null;
    }
  >;
  const incidents = (Array.isArray(rawIncidents) ? rawIncidents : []) as Incident[];

  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const carriedOverTasks = tasks.filter((t) => t.status !== "Completed");
  const openIncidents = incidents.filter((i) => i.status !== "Closed");

  const buildConsolidatedHandover = () => {
    const residentNotesList = Object.entries(handoverNotes)
      .filter(([_, v]) => v.trim())
      .map(([rid, note]) => {
        const res = (residents as Resident[]).find((r) => r.id === rid);
        const name = res?.fullName || rid;
        return `[Resident: ${name}]: ${note.trim()}`;
      });

    return [generalNotes.trim(), ...residentNotesList].filter(Boolean).join("\n\n");
  };

  const handleClockIn = async () => {
    const targetShiftId = ongoingShift?.id || nextScheduledShift?.id;
    if (!targetShiftId || !nextEligibility.canClockIn) {
      toast({
        title: "Cannot Clock In",
        description: nextEligibility.reason || "Shift start time has not been reached.",
        variant: "destructive",
      });
      return;
    }
    await startShiftMutation.mutateAsync({
      shiftId: targetShiftId,
      notes: "Carer clocked in from Handover module",
    });
  };

  const handleSaveDraft = async () => {
    if (!ongoingShift?.id) return;
    const notes = buildConsolidatedHandover();
    await updateHandoverMutation.mutateAsync({
      shiftId: ongoingShift.id,
      handoverNotes: notes || generalNotes,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePublishHandover = async () => {
    if (!ongoingShift?.id) return;
    const fullNotes = buildConsolidatedHandover() || "Shift handover completed.";
    await endShiftMutation.mutateAsync({
      shiftId: ongoingShift.id,
      handoverNotes: fullNotes,
      tasksCompleted: completedTasks.length,
      tasksTotal: tasks.length,
    });
    setPublishSuccess(true);
  };

  return (
    <div className="w-full space-y-6 pb-16 font-['Outfit',sans-serif] mx-auto">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Text size="xl" weight="bold" className="tracking-tight">
              Shift handover
            </Text>
            {ongoingShift ? (
              <Badge variant="outline" state="success" className="p-0 px-2.5 py-0.5 text-md font-semibold rounded-full shadow-none">
                Active shift on duty
              </Badge>
            ) : (
              <Badge variant="outline" state="inactive" className="p-0 px-2.5 py-0.5 text-md font-semibold rounded-full shadow-none">
                Not clocked in
              </Badge>
            )}
          </div>
          <Text variant="subdued" size="md" weight="regular">
            Review incoming briefing notes, monitor task completion, record resident observations, and publish handover to incoming staff.
          </Text>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!ongoingShift && nextScheduledShift && (
            <Button
              size="sm"
              disabled={!nextEligibility.canClockIn || startShiftMutation.isPending}
              onClick={handleClockIn}
              title={nextEligibility.reason}
              className={cn(
                "gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl h-9 px-4 text-md font-semibold shadow-xs",
                !nextEligibility.canClockIn && "opacity-60 cursor-not-allowed",
              )}
            >
              <PlayCircle className="size-3.5" />
              {startShiftMutation.isPending
                ? "Clocking in..."
                : !nextEligibility.isTimeReached && nextEligibility.formattedStartTime
                  ? `Clock in at ${nextEligibility.formattedStartTime}`
                  : "Clock in & Start duty"}
            </Button>
          )}

          {ongoingShift && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={updateHandoverMutation.isPending}
                onClick={handleSaveDraft}
                className="gap-1.5 rounded-xl h-9 px-3.5 text-md font-semibold border-slate-200"
              >
                <Save className="size-3.5 text-slate-600" />
                {saveSuccess ? "Saved!" : updateHandoverMutation.isPending ? "Saving..." : "Save draft notes"}
              </Button>
              <Button
                size="sm"
                disabled={endShiftMutation.isPending || publishSuccess}
                onClick={handlePublishHandover}
                className="gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl h-9 px-4 text-md font-semibold shadow-xs"
              >
                <Send className="size-3.5" />
                {endShiftMutation.isPending ? "Publishing..." : publishSuccess ? "Handover Published" : "Publish & End Shift"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Clock in prompt card when not clocked in */}
      {!ongoingShift && nextScheduledShift && (
        <Card variant="white" className="rounded-2xl border-amber-200 bg-amber-50/40 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="size-4 text-amber-800" />
            </div>
            <div>
              <Text size="md" weight="bold" className="text-amber-950">
                You are currently scheduled for: {nextScheduledShift.name || "Shift"}
              </Text>
              <Text size="md" className="text-amber-800">
                Clock in to start recording clinical logs, medication passes, and prepare your official end-of-shift handover.
              </Text>
            </div>
          </div>
          <Button
            size="sm"
            disabled={!nextEligibility.canClockIn || startShiftMutation.isPending}
            onClick={handleClockIn}
            title={nextEligibility.reason}
            className={cn(
              "bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-md font-semibold h-8 px-3.5 shrink-0",
              !nextEligibility.canClockIn && "opacity-60 cursor-not-allowed",
            )}
          >
            {startShiftMutation.isPending
              ? "Clocking in..."
              : !nextEligibility.isTimeReached && nextEligibility.formattedStartTime
                ? `Clock in at ${nextEligibility.formattedStartTime}`
                : "Clock in now"}
          </Button>
        </Card>
      )}

      {/* Incoming / Previous Shift Handover Briefing */}
      <HandoverBriefingCard previousShiftHandover={shiftDetails?.previousShiftHandover} />

      {/* KPI Counters: Task Execution & Safety Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card variant="white" className="p-4 rounded-2xl border-slate-200/90 shadow-xs flex flex-col justify-between gap-0 min-h-[88px]">
          <Text size="md" weight="semibold" className="text-slate-700 leading-tight">Total shift tasks</Text>
          <Text size="2xl" weight="bold" className="text-slate-900 mt-2">{tasks.length}</Text>
        </Card>
        <Card variant="white" className="p-4 rounded-2xl border-slate-200/90 shadow-xs flex flex-col justify-between gap-0 min-h-[88px]">
          <Text size="md" weight="semibold" className="text-slate-700 leading-tight">Completed on shift</Text>
          <Text size="2xl" weight="bold" className="text-emerald-700 mt-2">{completedTasks.length}</Text>
        </Card>
        <Card variant="white" className="p-4 rounded-2xl border-slate-200/90 shadow-xs flex flex-col justify-between gap-0 min-h-[88px]">
          <Text size="md" weight="semibold" className="text-slate-700 leading-tight">Tasks to hand over</Text>
          <Text size="2xl" weight="bold" className={cn("mt-2", carriedOverTasks.length > 0 ? "text-amber-700" : "text-slate-900")}>
            {carriedOverTasks.length}
          </Text>
        </Card>
        <Card variant="white" className="p-4 rounded-2xl border-slate-200/90 shadow-xs flex flex-col justify-between gap-0 min-h-[88px]">
          <Text size="md" weight="semibold" className="text-slate-700 leading-tight">Active safety incidents</Text>
          <Text size="2xl" weight="bold" className={cn("mt-2", openIncidents.length > 0 ? "text-rose-600" : "text-slate-900")}>
            {openIncidents.length}
          </Text>
        </Card>
      </div>

      {/* General Ward / Wing Handover Summary */}
      <Card variant="white" className="rounded-2xl border-slate-200/90 shadow-xs p-5 space-y-2 gap-0">
        <Text size="md" weight="bold" className="text-slate-900">
          General Ward / Unit Handover Summary
        </Text>
        <Text size="md" variant="subdued">
          Summarize overall wing dynamics, staffing levels, GP visits, or facility maintenance flags for incoming colleagues.
        </Text>
        <Textarea
          placeholder="e.g. Oak Wing calm throughout shift. GP visited at 14:00 and updated Margaret's prescription. Pharmacy delivery received."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
        />
      </Card>

      {/* Grid of Resident Handover Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Text size="md" weight="bold" className="text-slate-900">
            Resident-Specific Status & Handover Observations
          </Text>
          <Text size="md" variant="subdued">
            {residents.length} resident(s) in care
          </Text>
        </div>

        {loadingResidents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : residents.length === 0 ? (
          <Card variant="white" className="p-8 text-center rounded-2xl border-slate-200">
            <EmptyState
              title="No residents registered"
              description="No active residents are currently registered in your care home wing."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(residents as Resident[]).map((resident) => (
              <HandoverResidentCard
                key={resident.id}
                resident={resident}
                tasks={tasks.filter((t) => t.residentId === resident.id)}
                incidents={openIncidents.filter((i) => i.residentId === resident.id)}
                handoverNote={handoverNotes[resident.id] || ""}
                onHandoverNoteChange={(note) =>
                  setHandoverNotes((prev) => ({ ...prev, [resident.id]: note }))
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Carried-Over Shift Tasks Section */}
      <HandoverTasksSection tasks={carriedOverTasks} />
    </div>
  );
}
