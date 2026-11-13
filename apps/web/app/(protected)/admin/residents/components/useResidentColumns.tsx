"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { Building2 } from "lucide-react";
import { Badge, Text } from "@repo/ui/components/ui";
import {
  useGetPropertiesQuery,
  useGetRoomsQuery,
} from "../../../../../lib/queries/facility";
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
    case "Supported Living":
    case "Supported living":
      return "success";
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
  const { data: properties = [] } = useGetPropertiesQuery();
  const { data: rooms = [] } = useGetRoomsQuery();

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
          const preAlloc = (
            r.preAdmissions?.[0] as {
              roomAllocation?: {
                roomNumber?: string | null;
                landlord?: string | null;
              } | null;
            }
          )?.roomAllocation;

          const residentObj = r as unknown as {
            room?: string | null;
            supportedLivingDetails?: { property?: string | null };
          };

          const rawRoom =
            r.bed?.room?.roomNumber ||
            preAlloc?.roomNumber ||
            residentObj.room ||
            null;

          const matchedRoom =
            !r.bed?.room?.wing && rawRoom
              ? rooms.find(
                  (rm) =>
                    rm.roomNumber.trim().toLowerCase() ===
                    rawRoom.trim().toLowerCase(),
                )
              : undefined;

          const matchedProp =
            !r.bed?.room?.wing && matchedRoom
              ? properties.find((p) => p.id === matchedRoom.wingId)
              : undefined;

          const propName =
            r.bed?.wingName ||
            r.bed?.room?.wing?.name ||
            matchedProp?.name ||
            preAlloc?.landlord ||
            residentObj.supportedLivingDetails?.property ||
            "Unassigned";

          const roomNum = rawRoom
            ? /^(flat|room)\b/i.test(rawRoom.trim())
              ? rawRoom.trim()
              : `Flat ${rawRoom.trim()}`
            : "No Unit";

          return (
            <div className="flex items-start gap-2">
              <Building2 className="size-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <Text size="md" weight="medium" className="text-slate-900">
                  {propName}
                </Text>
                <Text size="md" variant="muted">
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
          const partC = r.preAdmissions?.[0]?.partC;
          const need =
            partC?.primaryDiagnosis?.trim() ||
            partC?.diagnoses?.[0]?.trim() ||
            r.supportedLivingDetails?.primaryNeed ||
            r.careProfile?.primaryCareNeed ||
            r.careProfile?.primaryDiagnosis ||
            r.fundingType ||
            "Supported living";
          return (
            <Badge
              variant="secondary"
              state="inactive"
              className="border font-normal text-md"
            >
              {need}
            </Badge>
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
          if (st === "Draft" || st === "Pending") return "Draft";
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
    [properties, rooms],
  );
}
