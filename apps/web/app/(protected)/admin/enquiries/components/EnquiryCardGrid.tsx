"use client";

import type { MouseEvent } from "react";
import { format } from "date-fns";
import { UserCheck, ClipboardList, ClipboardCheck, User, Phone, Calendar, Pencil } from "lucide-react";
import {
  Button,
  Avatar,
  AvatarFallback,
} from "@repo/ui/components/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/Tooltip";
import type { EnquiryResponseDTO } from "@repo/schema";
import { EntityCard } from "../../../../../lib/components/shared";
import { getStatusBadgeState } from "./useEnquiryColumns";

interface EnquiryCardGridProps {
  enquiries: EnquiryResponseDTO[];
  onRowClick: (enquiry: EnquiryResponseDTO) => void;
  onAdmitDirect: (e: MouseEvent, id: string) => void;
  onOpenAssessment: (enquiry: EnquiryResponseDTO, readOnly: boolean) => void;
  onEdit: (enquiry: EnquiryResponseDTO) => void;
}

function formatDateLabel(d: unknown): string {
  if (!d) return "—";
  const date = new Date(d as string);
  return isNaN(date.getTime()) ? "—" : format(date, "dd MMM yyyy");
}

export interface EnquiryCardProps {
  enquiry: EnquiryResponseDTO;
  showRightDivider?: boolean;
  onRowClick: (enquiry: EnquiryResponseDTO) => void;
  onAdmitDirect: (e: MouseEvent, id: string) => void;
  onOpenAssessment: (enquiry: EnquiryResponseDTO, readOnly: boolean) => void;
  onEdit: (enquiry: EnquiryResponseDTO) => void;
}

export function EnquiryCard({
  enquiry: e,
  showRightDivider = false,
  onRowClick,
  onAdmitDirect,
  onOpenAssessment,
  onEdit,
}: EnquiryCardProps) {
  const hasAssessment = Boolean(e.assessmentCompletedAt || e.assessmentData);
  const initial = (e.firstName?.charAt(0) || "E").toUpperCase();

  return (
    <EntityCard
      onClick={() => onRowClick(e)}
      showRightDivider={showRightDivider}
      avatar={
        <Avatar size="sm" className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light">
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-base">
            {initial}
          </AvatarFallback>
        </Avatar>
      }
      title={`${e.firstName} ${e.lastName}`}
      subtitle={`${e.careCategory || "General Care"} · ${e.currentLocation || "Location N/A"}`}
      meta={[
        {
          icon: <User className="size-4 text-emerald-800" />,
          label: "Enquirer",
          value: `${e.enquirerName || "—"} (${e.enquirerRelationship || "Contact"})`,
        },
        {
          icon: <Phone className="size-4 text-emerald-800" />,
          label: "Phone",
          value: e.enquirerPhone || "—",
        },
        {
          icon: <Calendar className="size-4 text-emerald-800" />,
          label: "Received",
          value: formatDateLabel(e.createdAt),
        },
      ]}
      statusText={e.status || "Enquiry"}
      statusState={getStatusBadgeState(e.status || "Enquiry")}
      actions={
        <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
          <Button
            size="sm"
            variant="primary"
            disabled={e.status === "Closed"}
            onClick={(evt) => {
              if (e.status === "Closed") return;
              onAdmitDirect(evt, e.id);
            }}
            className="rounded-xl cursor-pointer gap-1 h-7.5 px-2 text-md font-semibold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserCheck className="size-3.5" />
            Admit
          </Button>

          {hasAssessment ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenAssessment(e, true)}
              className="gap-1 rounded-xl text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 cursor-pointer h-7.5 px-2 text-md font-semibold shrink-0"
            >
              <ClipboardCheck className="size-3.5" />
              Assessment
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenAssessment(e, false)}
              className="gap-1 rounded-xl cursor-pointer h-7.5 px-2 text-md font-semibold shrink-0 border-slate-300 hover:bg-slate-50"
            >
              <ClipboardList className="size-3.5" />
              Assessment
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
                className="size-7.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer shrink-0"
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
      }
    />
  );
}

export function EnquiryCardGrid({
  enquiries,
  onRowClick,
  onAdmitDirect,
  onOpenAssessment,
  onEdit,
}: EnquiryCardGridProps) {
  if (!enquiries || enquiries.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {enquiries.map((e, idx) => (
        <EnquiryCard
          key={e.id}
          enquiry={e}
          showRightDivider={idx % 3 !== 2 && idx !== enquiries.length - 1}
          onRowClick={onRowClick}
          onAdmitDirect={onAdmitDirect}
          onOpenAssessment={onOpenAssessment}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
