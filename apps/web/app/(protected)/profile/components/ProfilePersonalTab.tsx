"use client";

import React from "react";
import { PenSquare } from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Button } from "@repo/ui/components/ui/Button";
import { InfoField } from "@repo/ui/components/ui/InfoField";
import { format } from "date-fns";

interface ProfilePersonalTabProps {
  fullName: string;
  roleName?: string;
  email: string;
  department?: string | null;
  preferredLanguage?: string | null;
  phoneNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  startDate?: string | null;
  isActive?: boolean;
  onEdit: () => void;
}

export function ProfilePersonalTab({
  fullName,
  roleName = "Staff",
  email,
  department,
  preferredLanguage,
  phoneNumber,
  addressLine1,
  addressLine2,
  city,
  postcode,
  startDate,
  isActive = true,
  onEdit,
}: ProfilePersonalTabProps) {
  const formattedStartDate = startDate
    ? format(
        new Date(`${startDate.substring(0, 10)}T12:00:00.000Z`),
        "dd MMM yyyy",
      )
    : null;

  return (
    <Card className="w-full h-full flex flex-col gap-[30px] sm:gap-[36px] font-sans">
      {/* ─── 1. General Information (Card Header with single edit button) ─── */}
      <div className="w-full flex flex-col gap-[16px]">
        <div className="flex items-center justify-between">
          <h3 className="text-h7 font-medium">Personal Profile</h3>
          <Button
            variant="ghost"
            size="icon"
            className="w-[36px] h-[36px] bg-white rounded-full p-2 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 z-10"
            title="Edit personal profile"
            onClick={onEdit}
          >
            <PenSquare className="w-4 h-4 text-[#141F1E]" />
          </Button>
        </div>

        <div className="flex flex-col gap-[20px]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoField label="Full Name" value={fullName || "-"} />
            <InfoField label="Designation / Role" value={roleName || "-"} />
            <InfoField
              label="Department"
              value={department || "Operations"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoField
              label="Start Date"
              value={formattedStartDate || "-"}
            />
            <InfoField
              label="Preferred Language"
              value={preferredLanguage || "English (UK)"}
            />
          </div>
        </div>
      </div>

      {/* ─── 2. Contact Information ─── */}
      <div className="w-full flex flex-col gap-[16px]">
        <div className="flex items-center justify-between">
          <h3 className="text-h7 font-medium">Contact Information</h3>
        </div>

        <div className="flex flex-col gap-[20px]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoField
              label="Email Address"
              value={email || "-"}
              multiline
            />
            <InfoField
              label="Phone Number"
              value={phoneNumber || "Not provided"}
            />
          </div>
        </div>
      </div>

      {/* ─── 3. Location & Address ─── */}
      <div className="w-full flex flex-col gap-[16px]">
        <div className="flex items-center justify-between">
          <h3 className="text-h7 font-medium">Location & Address</h3>
        </div>

        <div className="flex flex-col gap-[20px]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoField
              label="Address Line 1"
              value={addressLine1 || "Not provided"}
            />
            <InfoField
              label="Address Line 2"
              value={addressLine2 || "Not provided"}
            />
            <InfoField label="City / Town" value={city || "Not provided"} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoField
              label="Postcode"
              value={postcode || "Not provided"}
            />
            <InfoField label="Country" value="United Kingdom" />
          </div>
        </div>
      </div>
    </Card>
  );
}
