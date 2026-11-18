"use client";

import { useMemo } from "react";
import { format, differenceInDays, isBefore, startOfDay, parseISO } from "date-fns";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Button,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { PlanItem } from "./types";
import type { TableColumn, BadgeState } from "../../../../../lib/components/shared/tableColumns";

export function getCarePlanStatusBadgeState(status?: string): BadgeState {
  switch ((status || "draft").toLowerCase()) {
    case "active":
      return "success";
    case "draft":
      return "warning";
    case "archived":
    case "expired":
      return "inactive";
    case "under_review":
    case "pendingprimaryapproval":
    case "pendingsecondaryapproval":
      return "info";
    case "changesrequested":
      return "danger";
    default:
      return "inactive";
  }
}

function getInitials(name?: string): string {
  if (!name) return "R";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "R";
  if (parts.length === 1 && parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase() || "R";
}

function formatDateSafe(val?: string | Date | null, fmt = "d MMM yyyy"): string {
  if (!val) return "—";
  try {
    const d = typeof val === "string" ? parseISO(val) : val;
    return isNaN(d.getTime()) ? "—" : format(d, fmt);
  } catch {
    return "—";
  }
}

export function useCarePlanColumns({
  onSelectResident,
}: {
  onSelectResident: (residentId: string) => void;
}): TableColumn<PlanItem>[] {
  return useMemo<TableColumn<PlanItem>[]>(
    () => [
      {
        id: "resident",
        header: "Tenant",
        enableSorting: false,
        cell: ({ row }) => {
          const plan = row.original;
          const res = plan.resident;
          const resId = res?.id || plan.id;
          const initials = getInitials(res?.fullName);
          const shortCode = res?.nhsNumber
            ? `NHS-${res.nhsNumber.slice(-4)}`
            : `FH-${resId.slice(0, 4).toUpperCase()}`;

          return (
            <div
              className="flex items-center gap-3 py-1 cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                if (res?.id) onSelectResident(res.id);
              }}
            >
              <Avatar size="default" className="size-9 border border-emerald-200 shrink-0">
                {res?.photoUrl && (
                  <AvatarImage src={res.photoUrl} alt={res?.fullName || "Tenant"} />
                )}
                <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-md">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight min-w-0">
                <Text
                  size="md"
                  weight="bold"
                  className="text-slate-900 group-hover:text-emerald-800 transition truncate"
                >
                  {res?.fullName || "Unassigned Tenant"}
                </Text>
                <Text size="md" variant="muted" className="font-mono text-slate-400">
                  {shortCode}
                </Text>
              </div>
            </div>
          );
        },
      },
      {
        id: "unitRoom",
        header: "Unit · room",
        enableSorting: false,
        cell: ({ row }) => {
          const res = row.original.resident;
          const wing = res?.bed?.room?.wing?.name;
          const room = res?.bed?.room?.roomNumber;
          const text = wing && room ? `${wing} · ${room}` : room ? `Room ${room}` : wing ? wing : "—";

          return (
            <Text size="md" weight="medium" className="text-slate-800">
              {text}
            </Text>
          );
        },
      },
      {
        id: "planStatus",
        header: "Plan status",
        enableSorting: false,
        cell: ({ row }) => {
          const plan = row.original;
          const st = (plan.status || "Draft").toLowerCase();
          const versionStr = `v${plan.versionNumber || 1}`;

          let badgeState: "success" | "danger" | "warning" | "info" | "inactive" = "inactive";
          let label = "Draft";

          if (st === "missing" || !plan.id) {
            badgeState = "danger";
            label = "Missing plan";
          } else if (st === "active") {
            badgeState = "success";
            label = `Active · ${versionStr}`;
          } else if (st.includes("pending") || st.includes("review")) {
            badgeState = "info";
            label = `${versionStr} · Under review`;
          } else if (st.includes("change") || st.includes("returned")) {
            badgeState = "warning";
            label = "Returned";
          } else if (st === "expired") {
            badgeState = "inactive";
            label = "Expired";
          }

          const updatedDateStr = formatDateSafe(
            plan.updatedAt || plan.validFrom,
            "d MMM yyyy HH:mm"
          );
          const author = plan.authorRole;

          return (
            <div className="flex flex-col py-1">
              <div>
                <Badge
                  variant="outline"
                  state={badgeState}
                  className="p-0 px-2 py-0.5 text-md font-semibold rounded-full border shadow-none"
                >
                  {label}
                </Badge>
              </div>
              <Text size="md" variant="muted" className="text-md text-slate-500 mt-1 line-clamp-1">
                Updated {updatedDateStr}{author ? ` · ${author}` : ""}
              </Text>
            </div>
          );
        },
      },
      {
        id: "lastApproved",
        header: "Last approved",
        enableSorting: false,
        cell: ({ row }) => {
          const plan = row.original;
          if (!plan.approvedAt) return <Text size="md" variant="muted" className="text-slate-400">—</Text>;
          const dateStr = formatDateSafe(plan.approvedAt, "d MMM yyyy");
          return (
            <Text size="md" weight="medium" className="text-slate-700">
              {dateStr} · v{plan.versionNumber || 1}
            </Text>
          );
        },
      },
      {
        id: "nextReview",
        header: "Next review",
        enableSorting: false,
        cell: ({ row }) => {
          const plan = row.original;
          const nextDate = plan.nextReviewDate || plan.validTo;
          if (!nextDate) return <Text size="md" variant="muted" className="text-slate-400">—</Text>;

          const d = typeof nextDate === "string" ? parseISO(nextDate) : nextDate;
          if (isNaN(d.getTime())) return <Text size="md" variant="muted" className="text-slate-400">—</Text>;

          const today = startOfDay(new Date());
          const target = startOfDay(d);
          const isOverdue = isBefore(target, today);
          const daysDiff = Math.abs(differenceInDays(target, today));

          if (isOverdue) {
            return (
              <Badge
                variant="outline"
                state="danger"
                className="p-0 px-2.5 py-0.5 text-md font-semibold rounded-full bg-rose-100 text-rose-800 border-rose-200 shadow-none"
              >
                Overdue {daysDiff}d · {format(d, "d MMM yyyy")}
              </Badge>
            );
          }

          if (daysDiff <= 14) {
            return (
              <Badge
                variant="outline"
                state="warning"
                className="p-0 px-2.5 py-0.5 text-md font-semibold rounded-full bg-amber-100 text-amber-900 border-amber-200 shadow-none"
              >
                {format(d, "d MMM yyyy")} · {daysDiff}d
              </Badge>
            );
          }

          return (
            <Text size="md" weight="medium" className="text-slate-700">
              {format(d, "d MMM yyyy")}
            </Text>
          );
        },
      },
      {
        id: "responsible",
        header: "Responsible",
        enableSorting: false,
        cell: ({ row }) => {
          const res = row.original.resident;
          const kw = res?.keyworker?.fullName;
          const role = res?.keyworker?.role?.name;
          if (!kw) {
            return <Text size="md" variant="muted" className="text-slate-400">—</Text>;
          }
          return (
            <Text size="md" weight="medium" className="text-slate-800">
              {kw}{role ? ` (${role})` : ""}
            </Text>
          );
        },
      },
      {
        id: "flags",
        header: "Flags",
        enableSorting: false,
        cell: ({ row }) => {
          const plan = row.original;
          const nextDate = plan.nextReviewDate || plan.validTo;
          let isOverdue = false;
          if (nextDate) {
            const d = typeof nextDate === "string" ? parseISO(nextDate) : nextDate;
            if (!isNaN(d.getTime())) {
              isOverdue = isBefore(startOfDay(d), startOfDay(new Date()));
            }
          }

          if (isOverdue) {
            return (
              <Badge
                variant="outline"
                state="danger"
                className="p-0 px-2 py-0.5 text-md font-semibold rounded-full bg-rose-100 text-rose-800 border-rose-200 shadow-none"
              >
                Review overdue
              </Badge>
            );
          }

          const missingGoals = (plan.goals?.length || 0) === 0;
          if (missingGoals && plan.status?.toLowerCase() === "draft") {
            return (
              <Badge
                variant="outline"
                state="warning"
                className="p-0 px-2 py-0.5 text-md font-semibold rounded-full bg-amber-100 text-amber-800 border-amber-200 shadow-none"
              >
                Goals missing
              </Badge>
            );
          }

          return <Text size="md" variant="muted" className="text-slate-400">—</Text>;
        },
      },
      {
        id: "action",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => {
          const plan = row.original;
          const resId = plan.resident?.id || plan.id;
          const st = (plan.status || "").toLowerCase();
          const needsReview = st.includes("pending") || st.includes("review");

          if (needsReview) {
            return (
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectResident(resId);
                }}
                className="h-7 px-3 text-md cursor-pointer"
              >
                Review
              </Button>
            );
          }

          return (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onSelectResident(resId);
              }}
              className="h-7 px-3 text-md cursor-pointer"
            >
              Open
            </Button>
          );
        },
      },
    ],
    [onSelectResident],
  );
}
