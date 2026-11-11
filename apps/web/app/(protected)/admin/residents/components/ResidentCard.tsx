"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DoorOpen, Layers, User, Eye, ShieldAlert } from "lucide-react";
import {
  Badge,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/ui";
import type { Resident } from "../../../../../lib/types/resident";
import { useAuth } from "../../../../../lib/context/AuthContext";
import { EntityCard } from "../../../../../lib/components/shared";
import {
  calculateResidentAge,
  getResidentStatusBadgeState,
  getResidentCareTypeBadgeState,
} from "./useResidentColumns";

interface ResidentCardProps {
  resident: Resident;
  showRightDivider?: boolean;
  hasActiveHighRisk?: boolean;
}

export function ResidentCard({
  resident,
  showRightDivider = false,
  hasActiveHighRisk,
}: ResidentCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const roleBase = user?.roleName?.toLowerCase() === "admin" ? "admin" : "carer";

  const age = calculateResidentAge(resident.dob);
  const initial = resident.fullName?.charAt(0)?.toUpperCase() || "R";
  const status = resident.status || (resident.isDraft ? "Draft" : "Active");
  const careType = resident.fundingType || "Residential";
  const residentProfilePath = `/${roleBase}/residents/${resident.id}`;

  return (
    <EntityCard
      onClick={() => router.push(residentProfilePath)}
      showRightDivider={showRightDivider}
      avatar={
        <Avatar size="sm" className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light">
          {resident.photoUrl && (
            <AvatarImage
              src={resident.photoUrl}
              alt={resident.fullName}
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
          href={residentProfilePath}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-emerald-800 transition-colors"
        >
          {resident.fullName}
        </Link>
      }
      subtitle={`NHS: ${resident.nhsNumber || "N/A"}${age !== "N/A" ? ` • ${age} yrs` : ""}`}
      meta={[
        {
          icon: <DoorOpen className="size-4 text-emerald-800" />,
          label: "Room & Bed",
          value: (() => {
            const rawRoom = resident.bed?.room?.roomNumber?.trim();
            const roomStr = rawRoom
              ? /^room\b/i.test(rawRoom)
                ? rawRoom
                : `Room ${rawRoom}`
              : "Unassigned";
            const rawBed = resident.bed?.number?.trim();
            const bedStr = rawBed
              ? /^bed\b/i.test(rawBed)
                ? rawBed
                : `Bed ${rawBed}`
              : "N/A";
            return `${roomStr} (${bedStr})`;
          })(),
        },
        {
          icon: <Layers className="size-4 text-emerald-800" />,
          label: "Unit / Wing",
          value: `${resident.bed?.branchName || "Main Branch"} (${resident.bed?.wingName || "Unassigned"})`,
        },
        {
          icon: <User className="size-4 text-emerald-800" />,
          label: "Keyworker",
          value: resident.keyworker?.fullName || "Unassigned",
        },
      ]}
      statusBadge={
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="secondary"
            state={getResidentStatusBadgeState(status, resident.isDraft)}
            className="px-2.5 py-0.5 shadow-none"
          >
            {status}
          </Badge>

          <Badge
            variant="secondary"
            state={getResidentCareTypeBadgeState(careType)}
            className="px-2.5 py-0.5 shadow-none"
          >
            {careType}
          </Badge>

          {resident.dnarStatus && (
            <Badge variant="secondary" state="danger" className="px-2 py-0.5 shadow-none text-md font-semibold">
              DNAR
            </Badge>
          )}

          {hasActiveHighRisk && (
            <Badge variant="secondary" state="danger" className="px-2 py-0.5 flex items-center gap-1 shadow-none text-md">
              <ShieldAlert className="size-3" /> High Risk
            </Badge>
          )}
        </div>
      }
      actions={
        <Link href={`/${roleBase}/residents/${resident.id}`}>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl h-8 text-md font-semibold hover:bg-slate-50 cursor-pointer"
          >
            <Eye className="size-3.5 text-emerald-800" />
            View
          </Button>
        </Link>
      }
    />
  );
}
