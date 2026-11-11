"use client";

import Link from "next/link";
import { format, differenceInYears } from "date-fns";
import { ArrowLeft, Stethoscope, UserCheck, BedDouble } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Button,
  Text,
} from "@repo/ui/components/ui";

export interface ResidentProfileData {
  id?: string;
  fullName?: string;
  photoUrl?: string | null;
  dob?: string | Date | null;
  bed?: { room?: { roomNumber?: string } } | null;
  nhsNumber?: string;
}

interface CarePlanResidentProfileBadgeProps {
  resident?: ResidentProfileData | null;
  primaryDoctorName?: string | null;
  authorRole?: string | null;
}

export function CarePlanResidentProfileBadge({
  resident,
  primaryDoctorName,
  authorRole,
}: CarePlanResidentProfileBadgeProps) {
  const name = resident?.fullName || "Resident";
  const initial = name.charAt(0).toUpperCase();
  const roomNumber = resident?.bed?.room?.roomNumber;

  // Age calculation
  let ageText: string | null = null;
  if (resident?.dob) {
    const d = new Date(resident.dob);
    if (!isNaN(d.getTime())) {
      const age = differenceInYears(new Date(), d);
      ageText = `${age} yrs (${format(d, "dd MMM yyyy")})`;
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-['Outfit',sans-serif]">
      {/* Left: Back Link & Profile Info */}
      <div className="flex items-center gap-3.5">
        <Link href="/admin/care-plans">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            title="Back to Care Plans"
          >
            <ArrowLeft className="size-4" />
          </Button>
        </Link>

        {/* Resident Avatar */}
        <Avatar size="sm" className="size-13 border border-slate-200 shrink-0 bg-surface-primary-light">
          {resident?.photoUrl && (
            <AvatarImage
              src={resident.photoUrl}
              alt={name}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-lg">
            {initial}
          </AvatarFallback>
        </Avatar>

        {/* Name & Clinical Tags */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Text as="h1" size="lg" weight="bold" className="text-slate-900 tracking-tight">
              {name}
            </Text>
            {roomNumber ? (
              <Badge variant="secondary" state="inactive" className="gap-1 px-2.5 py-0.5 text-sm font-semibold shadow-none">
                <BedDouble className="size-3 text-slate-500" />
                Room {roomNumber}
              </Badge>
            ) : (
              <Badge variant="secondary" state="inactive" className="px-2 py-0.5 text-sm text-slate-400 shadow-none">
                No Room
              </Badge>
            )}
            {ageText && (
              <Text size="sm" weight="medium" className="text-slate-500 hidden md:inline">
                {ageText}
              </Text>
            )}
          </div>

          {/* Assigned Doctor & Author Info */}
          <div className="flex items-center gap-3 text-md text-slate-500 flex-wrap">
            {primaryDoctorName && (
              <span className="flex items-center gap-1">
                <Stethoscope className="size-3.5 text-emerald-800" />
                <span>Dr. <strong className="text-slate-700 font-medium">{primaryDoctorName}</strong></span>
              </span>
            )}
            {authorRole && (
              <span className="flex items-center gap-1">
                <UserCheck className="size-3.5 text-slate-400" />
                <span>Author: <span className="text-slate-700 font-medium">{authorRole}</span></span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
