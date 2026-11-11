"use client";

import React from "react";
import { Button, InfoField } from "@repo/ui/components/ui";
import { PenSquare } from "lucide-react";

interface PrimaryContactSectionProps {
  profile?: {
    primaryContactName?: string | null;
    primaryContactEmail?: string | null;
    primaryContactPhone?: string | null;
    primaryContactRole?: string | null;
    jobTitle?: string | null;
  } | null;
  onEditClick?: () => void;
}

export function PrimaryContactSection({
  profile,
  onEditClick,
}: PrimaryContactSectionProps) {
  return (
    <div className="w-full flex flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <h3 className="text-h7 font-medium">
          Primary Contact
        </h3>
        {onEditClick && (
          <Button
            variant="ghost"
            size="icon"
            className="w-[36px] h-[36px] bg-white rounded-full p-2 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 z-10"
            title="Edit primary contact"
            onClick={onEditClick}
          >
            <PenSquare className="w-4 h-4 text-[#141F1E]" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-[20px]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoField
            label="Contact Name"
            value={profile?.primaryContactName || "Eleanor Vance"}
          />
          <InfoField
            label="Job Title"
            value={profile?.jobTitle || profile?.primaryContactRole || "Administrator"}
          />
          <InfoField
            label="Contact Phone"
            value={profile?.primaryContactPhone || "+44 7700 900888"}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoField
            label="Contact Email"
            value={profile?.primaryContactEmail || "eleanor@carehome.com"}
            multiline
          />
        </div>
      </div>
    </div>
  );
}