"use client";

import { useMemo, type MouseEvent } from "react";
import Link from "next/link";
import { UserCheck, ClipboardList, ClipboardCheck, Pencil } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/Tooltip";
import type { EnquiryResponseDTO } from "@repo/schema";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../lib/components/shared/tableColumns";

interface UseEnquiryColumnsProps {
  onAdmitDirect: (e: MouseEvent, id: string) => void;
  onOpenAssessment: (enquiry: EnquiryResponseDTO, readOnly: boolean) => void;
  onEdit: (enquiry: EnquiryResponseDTO) => void;
}

export function getStatusBadgeState(status: string): BadgeState {
  switch (status) {
    case "Admitted":
      return "success";
    case "Ready for Admission":
      return "info";
    case "Assessment Pending":
      return "warning";
    case "Closed":
      return "inactive";
    default:
      return "info";
  }
}

export function useEnquiryColumns({
  onAdmitDirect,
  onOpenAssessment,
  onEdit,
}: UseEnquiryColumnsProps): TableColumn<EnquiryResponseDTO>[] {
  return useMemo<TableColumn<EnquiryResponseDTO>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        kind: "person",
        id: "prospectiveResident",
        accessorKey: "firstName",
        header: "Prospective Resident",
        avatar: false,
        maxWidthClassName: "max-w-40",
        getTitle: (e) => [e.firstName, e.middleName, e.lastName].filter(Boolean).join(" ").trim(),
        getSubtitle: (e) =>
          e.dependencyLevel ? `${e.dependencyLevel} Dependency` : "Pre-Admission",
      },
      {
        kind: "person",
        id: "enquirerName",
        accessorKey: "enquirerName",
        header: "Enquirer Contact",
        avatar: false,
        maxWidthClassName: "max-w-32",
        getTitle: (e) => e.enquirerName || "—",
        getSubtitle: (e) => {
          const rel = e.enquirerRelationship || "Contact";
          return e.enquirerPhone ? `${rel} • ${e.enquirerPhone}` : rel;
        },
      },
      {
        kind: "text",
        id: "careCategory",
        accessorKey: "careCategory",
        header: "Care Category",
        state: "info",
        className: "whitespace-nowrap",
      },
      {
        kind: "text",
        id: "currentLocation",
        accessorKey: "currentLocation",
        header: "Current Location",
        truncate: true,
        className: "max-w-24 whitespace-nowrap",
      },
      {
        kind: "badge",
        id: "status",
        accessorKey: "status",
        header: "Stage & Status",
        className: "whitespace-nowrap",
        getState: (e) => getStatusBadgeState(e.status || "Enquiry"),
        getLabel: (e) => e.status || "Enquiry",
      },
      {
        kind: "date",
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Date Received",
        className: "whitespace-nowrap",
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const e = row.original;
          const hasAssessment = Boolean(e.assessmentCompletedAt || e.assessmentData);

          return (
            <div
              className="flex items-center justify-end gap-1.5 shrink-0 whitespace-nowrap"
              onClick={(evt) => evt.stopPropagation()}
            >
              {e.convertedResidentId ? (
                <Link
                  href={`/admin/residents/${e.convertedResidentId}`}
                  onClick={(evt) => evt.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl cursor-pointer gap-1 h-7.5 px-2.5 text-md text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 shrink-0"
                  >
                    <UserCheck className="size-3.5" />
                    View Resident
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  disabled={e.status === "Closed"}
                  onClick={(evt) => {
                    if (e.status === "Closed") return;
                    onAdmitDirect(evt, e.id);
                  }}
                  className="rounded-xl cursor-pointer gap-1 h-7.5 px-2.5 text-md shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck className="size-3.5" />
                  Admit
                </Button>
              )}

              {hasAssessment ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenAssessment(e, true)}
                  className="gap-1 rounded-xl text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 cursor-pointer h-7.5 px-2.5 text-md shrink-0"
                >
                  <ClipboardCheck className="size-3.5" />
                  View Assessment
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenAssessment(e, false)}
                  className="gap-1 rounded-xl cursor-pointer h-7.5 px-2.5 text-md shrink-0 border-slate-300 hover:bg-slate-50"
                >
                  <ClipboardList className="size-3.5" />
                  Record Assessment
                </Button>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Edit Enquiry"
                    onClick={() => onEdit(e)}
                    className="size-8 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  sideOffset={6}
                  className="bg-white border border-slate-200/80 text-slate-800 rounded-lg px-2.5 py-1 text-md font-medium shadow-lg"
                >
                  Edit Enquiry
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [onAdmitDirect, onOpenAssessment, onEdit]
  );
}
