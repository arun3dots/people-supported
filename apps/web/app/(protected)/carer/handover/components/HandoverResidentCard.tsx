"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  Text,
  Badge,
  Input,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { Resident } from "../../../../../lib/types/resident";
import type { Incident } from "../../../../../lib/types/incident";

export interface HandoverDailyTaskItem {
  id: string;
  residentId: string;
  title: string;
  status: string;
  timeSlot?: string | null;
  scheduledTime?: string | null;
  targetTime?: string | null;
}

interface HandoverResidentCardProps {
  resident: Resident;
  tasks: HandoverDailyTaskItem[];
  incidents: Incident[];
  handoverNote: string;
  onHandoverNoteChange: (note: string) => void;
}

export function HandoverResidentCard({
  resident,
  tasks,
  incidents,
  handoverNote,
  onHandoverNoteChange,
}: HandoverResidentCardProps) {
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const pendingTasks = tasks.filter((t) => t.status !== "Completed");

  const roomDisplay = resident.bed?.room?.roomNumber
    ? `Room ${resident.bed.room.roomNumber}`
    : "Room —";

  const initials = resident.fullName
    ? resident.fullName
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "R";

  return (
    <Card
      variant="white"
      className="rounded-2xl border-slate-200/90 shadow-xs p-5 flex flex-col justify-between gap-3.5 transition-all hover:border-slate-300"
    >
      <div className="space-y-3">
        {/* Top Header: Avatar, Name, Room, DNACPR */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-md shrink-0">
              {initials}
            </div>
            <div>
              <Text size="md" weight="bold" className="text-slate-900 leading-tight">
                {resident.fullName}
              </Text>
              <Text size="md" variant="muted" className="text-slate-500 font-medium">
                {roomDisplay} · {tasks.length > 0 ? `${completedTasks.length}/${tasks.length} tasks done` : "No shift tasks"}
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {resident.dnarStatus && (
              <Badge
                variant="outline"
                state="danger"
                className="p-0 px-2 py-0.5 text-md font-bold rounded-md shadow-none"
              >
                DNACPR
              </Badge>
            )}
          </div>
        </div>

        {/* Safety Incidents Alert */}
        {incidents.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 space-y-1">
            {incidents.map((inc) => (
              <div key={inc.id} className="flex items-center gap-1.5 text-md text-rose-800 font-medium">
                <AlertTriangle className="size-3.5 text-rose-600 shrink-0" />
                <span className="line-clamp-1">
                  {inc.incidentNumber ? `${inc.incidentNumber}: ` : ""}{inc.category || inc.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Task execution metrics */}
        <div className="grid grid-cols-2 gap-2 text-md bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <div>
            <span className="text-slate-500 block text-md">Tasks completed</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="size-3" />
              {completedTasks.length} done
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-md">Pending follow-up</span>
            <span className={cn("font-semibold block mt-0.5", pendingTasks.length > 0 ? "text-amber-700" : "text-slate-700")}>
              {pendingTasks.length} pending
            </span>
          </div>
        </div>
      </div>

      {/* Handover Observation Input & Care Plan Link */}
      <div className="pt-3 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between">
          <label >
            Handover note for incoming staff
          </label>
          <Link
            href={`/carer/residents/${resident.id}?tab=care-plan`}
            className="inline-flex items-center gap-1 text-md font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <span>Care plan</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
        <Input
          placeholder="e.g. Slept well, low fluid intake at lunch"
          value={handoverNote}
          onChange={(e) => onHandoverNoteChange(e.target.value)}
        />
      </div>
    </Card>
  );
}
