"use client";

import React from "react";
import Link from "next/link";
import { Card, Text, Badge, Button } from "@repo/ui/components/ui";
import { DailyTaskItem } from "./types";
import { StaffMember } from "../../../../../lib/types/staff";

interface TaskItemCardProps {
  task: DailyTaskItem;
  staffList: StaffMember[];
  currentAssigneeId?: string | null;
  currentUserId?: string;
  canAllocate?: boolean;
  onOpenLog: (task: DailyTaskItem) => void;
  onReassign: (taskId: string, staffId: string) => void;
}

export function TaskItemCard({
  task,
  staffList,
  currentAssigneeId,
  currentUserId,
  canAllocate = false,
  onOpenLog,
  onReassign,
}: TaskItemCardProps) {
  const isCompleted =
    task.status?.toLowerCase() === "completed" || task.status?.toLowerCase() === "done";
  const isSkipped = task.status?.toLowerCase() === "skipped";
  const isDueNow =
    !isCompleted &&
    !isSkipped &&
    (task.status?.toLowerCase() === "pending" ||
      task.status?.toLowerCase() === "due" ||
      task.status?.toLowerCase() === "inprogress");

  const isHighPriority =
    task.priority === "High" || task.carePlanTask?.priority === "High";

  const residentName = task.resident?.fullName || "Resident";
  const roomDisplay = task.resident?.bed?.room?.roomNumber
    ? `Room ${task.resident.bed.room.roomNumber}`
    : task.resident?.bed?.number
      ? `Bed ${task.resident.bed.number}`
      : "Room unassigned";

  const targetTime = task.carePlanTask?.targetTime || "10:00";
  const dueBy = task.timeSlot === "AllDay" ? "continuous" : `by ${task.timeSlot || "12:00"}`;

  const isAssignedToMe = Boolean(currentUserId && currentAssigneeId === currentUserId);
  const assignedStaffMember = staffList.find((s) => s.id === currentAssigneeId);

  return (
    <Card
      variant="surface"
      border={isDueNow ? "primary" : "secondary"}
      className={`p-3.5 flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${isDueNow ? "border-amber-300/80 bg-amber-50/20" : ""
        }`}
    >
      {/* Left Column: Time box + Task details */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Time Box */}
        <div className="text-center shrink-0 w-16 pt-0.5">
          <Text as="span" size="sm" weight="bold" className="block leading-tight text-text-heading">
            {targetTime}
          </Text>
          <Text as="span" size="sm" variant="muted" className="block text-[11px]">
            {dueBy}
          </Text>
        </div>

        {/* Task Title & Metadata */}
        <div className="space-y-1 flex-1 min-w-0">
          <Text as="h4" size="sm" weight="bold" className="text-text-heading leading-snug">
            {task.title}
          </Text>

          {/* Meta Line: Resident · Room · Plan · Assignee · Badges */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Text as="span" size="sm" weight="medium" className="text-text-heading">
              {residentName} · {roomDisplay}
            </Text>
            <span className="text-border-secondary">·</span>
            <Text as="span" size="sm" variant="muted">
              {task.carePlanTask?.category || "Plan v1"}
              {task.carePlanTask?.goal?.title ? ` · ${task.carePlanTask.goal.title}` : ""}
            </Text>

            {/* Assignee indicator */}
            {isAssignedToMe ? (
              <>
                <span className="text-border-secondary">·</span>
                <Text as="span" size="sm" variant="muted">
                  → You (me)
                </Text>
              </>
            ) : assignedStaffMember ? (
              <>
                <span className="text-border-secondary">·</span>
                <Text as="span" size="sm" variant="muted">
                  → {assignedStaffMember.fullName.split(" ")[0]}
                </Text>
              </>
            ) : null}

            {/* Status Badge */}
            {isCompleted ? (
              <Badge state="success">Done</Badge>
            ) : isDueNow ? (
              <Badge state="warning">Due now</Badge>
            ) : isSkipped ? (
              <Badge state="danger">Skipped</Badge>
            ) : (
              <Badge state="inactive">Scheduled</Badge>
            )}

            {/* Senior sign-off or priority badges */}
            {task.carePlanTask?.escalateIfSkipped && (
              <Badge state="warning">Senior sign-off needed</Badge>
            )}
            {isHighPriority && <Badge state="danger">High priority</Badge>}
            {!currentAssigneeId && <Badge state="warning">Unallocated</Badge>}
          </div>

          {/* Log / Completed Notes */}
          {(task.notes || task.completedBy) && (
            <div className="mt-1">
              <Text size="sm" variant="muted" className="italic text-text-description">
                Done {task.completedAt ? `at ${task.completedAt.slice(11, 16)}` : ""}{" "}
                {task.completedBy ? `by ${task.completedBy.fullName}` : ""}{" "}
                {task.notes ? `· ${task.notes}` : ""}
              </Text>
            </div>
          )}

          {/* Instructions if available */}
          {task.carePlanTask?.instructions && !task.notes && (
            <Text size="sm" variant="muted" className="line-clamp-1 text-text-description">
              {task.carePlanTask.instructions}
            </Text>
          )}
        </div>
      </div>

      {/* Right Column: Actions (Log / Add entry & Resident) */}
      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
        {canAllocate && staffList.length > 0 && (
          <div className="flex items-center gap-1 bg-surface-primary-light/60 p-1 rounded-xl border border-border-secondary/40 mr-2">
            <Text as="span" size="sm" variant="muted" className="px-1 text-[11px] uppercase font-semibold">
              Assign:
            </Text>
            {staffList.slice(0, 3).map((s) => {
              const isAssigned = currentAssigneeId === s.id;
              const firstName = s.fullName.split(" ")[0];
              return (
                <Button
                  key={s.id}
                  type="button"
                  variant={isAssigned ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => onReassign(task.id, s.id)}
                  title={`Assign to ${s.fullName}`}
                  className="h-7 px-2.5 rounded-lg text-sm font-medium cursor-pointer"
                >
                  {firstName}
                </Button>
              );
            })}
          </div>
        )}

        <Button
          type="button"
          variant={isCompleted ? "outline" : "primary"}
          size="sm"
          onClick={() => onOpenLog(task)}
        >
          {isCompleted ? "Add entry" : "Log"}
        </Button>

        <Link href={`/carer/residents/${task.residentId || task.resident?.id || ""}`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
          >
            Resident
          </Button>
        </Link>
      </div>
    </Card>
  );
}
