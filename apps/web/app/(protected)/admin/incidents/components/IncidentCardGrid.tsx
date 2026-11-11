"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { User, Calendar, MapPin, Eye } from "lucide-react";
import {
  Button,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../lib/components/shared";
import type { Incident } from "../../../../../lib/types/incident";
import {
  getIncidentStatusBadgeState,
  getIncidentPriorityBadgeState,
} from "./useIncidentColumns";

function formatDateLabel(dateStr?: string | Date): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

function formatTimeLabel(dateStr?: string | Date, timeStr?: string | null): string {
  if (timeStr) return timeStr;
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? ""
      : d
        .toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "2-digit",
          hour12: false,
        })
        .toLowerCase();
  } catch {
    return "";
  }
}

export interface IncidentCardProps {
  incident: Incident;
  showRightDivider?: boolean;
}

export function IncidentCard({
  incident,
  showRightDivider = false,
}: IncidentCardProps) {
  const router = useRouter();
  const residentName = incident.resident?.fullName || "Unassigned";
  const initial = residentName.charAt(0).toUpperCase();
  const room =
    incident.roomNumber ||
    incident.resident?.bed?.room?.roomNumber ||
    "Unassigned";
  const bed =
    incident.bedNumber ||
    incident.resident?.bed?.number ||
    "Unassigned";
  const time = formatTimeLabel(incident.incidentDate, incident.incidentTime);

  return (
    <EntityCard
      onClick={() => router.push(`/admin/incidents/${incident.id}`)}
      showRightDivider={showRightDivider}
      avatar={
        <Avatar size="sm" className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light">
          {incident.resident?.photoUrl && (
            <AvatarImage
              src={incident.resident.photoUrl}
              alt={residentName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-base">
            {initial}
          </AvatarFallback>
        </Avatar>
      }
      title={
        <Link
          href={`/admin/incidents/${incident.id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-emerald-800 transition-colors"
        >
          {incident.title}
        </Link>
      }
      subtitle={`Ref: #${incident.incidentNumber}`}
      headerBadge={
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">
            {incident.category || "General"}
          </Badge>
          <Badge
            variant="secondary"
            state={getIncidentPriorityBadgeState(incident.priority || "Medium")}
            className="px-2.5 py-0.5 shadow-none"
          >
            {incident.priority || "Medium"}
          </Badge>
        </div>
      }
      meta={[
        {
          icon: <User className="size-4 text-emerald-800 shrink-0" />,
          value: residentName,
        },
        {
          icon: <Calendar className="size-4 text-emerald-800 shrink-0" />,
          value: `${formatDateLabel(incident.incidentDate)}${time ? ` at ${time}` : ""}`,
        },
        {
          icon: <MapPin className="size-4 text-emerald-800 shrink-0" />,
          value: `Room ${room} • Bed ${bed}`,
        },
      ]}
      statusBadge={
        <Badge
          variant="secondary"
          state={getIncidentStatusBadgeState(incident.status || "Open")}
          className="px-2.5 py-0.5 shadow-none"
        >
          {incident.status || "Open"}
        </Badge>
      }
      actions={
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/admin/incidents/${incident.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl h-8 text-md hover:bg-slate-50 cursor-pointer"
            >
              <Eye className="size-3.5 text-emerald-800" />
              View
            </Button>
          </Link>
        </div>
      }
    />
  );
}

export interface IncidentCardGridProps {
  incidents?: Incident[];
  paginatedIncidents: Incident[];
  isLoading: boolean;
}

export function IncidentCardGrid({
  paginatedIncidents,
}: IncidentCardGridProps) {
  if (!paginatedIncidents || paginatedIncidents.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {paginatedIncidents.map((incident, idx) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          showRightDivider={
            idx % 3 !== 2 && idx !== paginatedIncidents.length - 1
          }
        />
      ))}
    </div>
  );
}
