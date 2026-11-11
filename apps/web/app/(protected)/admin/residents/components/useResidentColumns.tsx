"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { Building2, Calendar } from "lucide-react";
import { Badge, Text } from "@repo/ui/components/ui";
import type { Resident } from "../../../../../lib/types/resident";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../lib/components/shared/tableColumns";

interface UseResidentColumnsProps {
  roleBase?: string;
}

export function calculateResidentAge(dobString?: string): number | string {
  if (!dobString) return "N/A";
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return "N/A";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function formatResidentDOB(dobString?: string): string {
  if (!dobString) return "N/A";
  const date = new Date(dobString);
  return isNaN(date.getTime()) ? "N/A" : format(date, "dd MMM yyyy");
}

export function getResidentStatusBadgeState(
  status: string,
  isDraft?: boolean,
): BadgeState {
  if (status === "Active" || status === "Admitted") return "success";
  if (status === "Draft" || (isDraft && !status)) return "warning";
  switch (status) {
    case "Hospitalized":
      return "danger";
    case "On Leave":
    case "Pending":
      return "info";
    case "Discharged":
      return "inactive";
    default:
      return isDraft ? "warning" : "inactive";
  }
}

export function getResidentCareTypeBadgeState(type: string): BadgeState {
  switch (type) {
    case "Nursing":
    case "Nursing Care":
      return "info";
    case "Dementia":
    case "Dementia Care":
      return "warning";
    case "Residential":
    case "Resident Care":
      return "success";
    case "Respite":
    case "Respite Care":
      return "info";
    default:
      return "inactive";
  }
}

function getInitials(fullName?: string): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return fullName.slice(0, 2).toUpperCase();
}

export function useResidentColumns({
  roleBase = "admin",
}: UseResidentColumnsProps = {}): TableColumn<Resident>[] {
  void roleBase;
  return useMemo<TableColumn<Resident>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        kind: "person",
        id: "resident",
        accessorKey: "fullName",
        header: "Person",
        avatar: true,
        maxWidthClassName: "max-w-60",
        getTitle: (r) => r.fullName || "—",
        getSubtitle: (r) => {
          const ref =
            r.supportedLivingDetails?.referenceCode ||
            `SL-${r.id.slice(0, 5).toUpperCase()}`;
          return `${ref} · NHS ${r.nhsNumber || "N/A"}`;
        },
        getInitials: (r) => getInitials(r.fullName),
        getImageUrl: (r) => r.photoUrl || null,
      },
      {
        id: "propertyRoom",
        header: "Property / Room",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const propName =
            r.bed?.wingName || r.bed?.room?.wing?.name || "Unassigned";
          const roomNum = r.bed?.room?.roomNumber
            ? /^(flat|room)\b/i.test(r.bed.room.roomNumber.trim())
              ? r.bed.room.roomNumber.trim()
              : `Flat ${r.bed.room.roomNumber.trim()}`
            : "No Unit";

          return (
            <div className="flex items-start gap-2">
              <Building2 className="size-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <Text size="sm" weight="medium" className="text-slate-900">
                  {propName}
                </Text>
                <Text size="xs" variant="muted">
                  {roomNum}
                </Text>
              </div>
            </div>
          );
        },
      },
      {
        id: "primaryNeed",
        header: "Primary Need",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const need =
            r.supportedLivingDetails?.primaryNeed ||
            r.careProfile?.primaryCareNeed ||
            r.careProfile?.primaryDiagnosis ||
            r.fundingType ||
            "Supported living";
          return (
            <Badge
              variant="secondary"
              state="inactive"
              className="border font-normal text-xs"
            >
              {need}
            </Badge>
          );
        },
      },
      {
        kind: "person",
        id: "keyworker",
        header: "Key Worker",
        avatar: false,
        getTitle: (r) => r.keyworker?.fullName || "Unassigned",
      },
      {
        id: "supportHours",
        header: "Support Hours",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const totalHrs = r.supportedLivingDetails?.supportHoursPerWeek ?? 28;
          const oneToOne = r.supportedLivingDetails?.oneToOneHoursPerWeek ?? 6;
          return (
            <div className="flex flex-col">
              <Text size="sm" weight="medium" className="text-slate-900">
                {totalHrs} hrs/wk
              </Text>
              <Text size="xs" variant="muted">
                {oneToOne}h 1:1
              </Text>
            </div>
          );
        },
      },
      {
        id: "riskLevel",
        header: "Risk",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const risk =
            r.supportedLivingDetails?.riskLevel ||
            (r.careProfile?.careComplexity === "High"
              ? "High"
              : r.careProfile?.careComplexity === "Low"
                ? "Low"
                : "Medium");
          const riskState =
            risk === "High"
              ? "danger"
              : risk === "Low"
                ? "success"
                : "warning";
          return (
            <Badge
              variant="secondary"
              state={riskState}
              className="border text-xs"
            >
              {risk}
            </Badge>
          );
        },
      },
      {
        id: "supportPlan",
        header: "Support Plan",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const latestPlan = r.carePlans?.[0];
          const planHeader = r.supportedLivingDetails?.supportPlanHeader;
          const rawReviewDate =
            planHeader?.nextReviewDate ||
            latestPlan?.reviewDate ||
            (latestPlan as { nextReviewDate?: string })?.nextReviewDate;
          const parsedDate = rawReviewDate ? new Date(rawReviewDate) : null;
          const dateLabel =
            parsedDate && !isNaN(parsedDate.getTime())
              ? format(parsedDate, "dd/MM/yyyy")
              : "18/02/2027";
          const planStatus = planHeader?.status || "In date";
          const planState =
            planStatus === "Overdue"
              ? "danger"
              : planStatus === "Due soon"
                ? "warning"
                : "success";

          return (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                state={planState}
                className="border text-xs"
              >
                {planStatus}
              </Badge>
              <Text
                as="span"
                size="xs"
                variant="muted"
                className="inline-flex items-center gap-1"
              >
                <Calendar className="size-3 text-slate-400" />
                {dateLabel}
              </Text>
            </div>
          );
        },
      },
      {
        kind: "badge",
        id: "status",
        accessorKey: "status",
        header: "Status",
        getState: (r) =>
          getResidentStatusBadgeState(
            r.status || (r.isDraft ? "Draft" : "Active"),
            r.isDraft,
          ),
        getLabel: (r) => {
          const st = r.status || (r.isDraft ? "Draft" : "Active");
          if (st === "Draft" || st === "Pending") return "In referral";
          if (st === "Hospitalized") return "In hospital";
          return st;
        },
      },
      {
        kind: "person",
        id: "ageDob",
        accessorKey: "dob",
        header: "Age / DOB",
        avatar: false,
        getTitle: (r) => {
          const age = calculateResidentAge(r.dob);
          return age !== "N/A" ? `${age} yrs` : "—";
        },
        getSubtitle: (r) => formatResidentDOB(r.dob),
      },
    ],
    [],
  );
}
