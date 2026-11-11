"use client";

import React from "react";
import { Button, InfoField } from "@repo/ui/components/ui";
import { PenSquare } from "lucide-react";

interface GeneralInformationSectionProps {
  profile?: {
    name?: string | null;
    cqcNumber?: string | null;
    careHomeType?: string | null;
    registeredProvider?: string | null;
    establishedDate?: string | null;
    website?: string | null;
  } | null;
  onEditClick?: () => void;
}

export function GeneralInformationSection({
  profile,
  onEditClick,
}: GeneralInformationSectionProps) {
  return (
    <div className="w-full flex flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <h3 className="text-h7 font-medium">
          General Information
        </h3>
        {onEditClick && (
          <Button
            variant="ghost"
            size="icon"
            className="w-[36px] h-[36px] bg-white rounded-full p-2 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 z-10"
            title="Edit general information"
            onClick={onEditClick}
          >
            <PenSquare className="w-4 h-4 text-[#141F1E]" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-[20px]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoField
            label="Care Home Name"
            value={profile?.name || "Care & Love Haven"}
          />
          <InfoField
            label="CQC Registration Number"
            value={profile?.cqcNumber || "0000016857"}
          />
          <InfoField
            label="Care Home Type"
            value={profile?.careHomeType || "Residential Care Home"}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoField
            label="Registered Provider"
            value={profile?.registeredProvider || "Care & Love Services Ltd."}
          />
          <InfoField
            label="Established Date"
            value={profile?.establishedDate || "15 Jan 2018"}
          />
          <InfoField
            label="Website"
            value={profile?.website || "www.careandlovehaven.com"}
          />
        </div>
      </div>
    </div>
  );
}