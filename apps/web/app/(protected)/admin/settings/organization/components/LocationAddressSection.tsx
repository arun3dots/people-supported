"use client";

import React from "react";
import { Button, InfoField } from "@repo/ui/components/ui";
import { PenSquare } from "lucide-react";

interface LocationAddressSectionProps {
  profile?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    postcode?: string | null;
  } | null;
  onEditClick?: () => void;
}

export function LocationAddressSection({
  profile,
  onEditClick,
}: LocationAddressSectionProps) {
  return (
    <div className="w-full flex flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <h3 className="text-h7 font-medium">
          Location & Address
        </h3>
        {onEditClick && (
          <Button
            variant="ghost"
            size="icon"
            className="w-[36px] h-[36px] bg-white rounded-full p-2 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 z-10"
            title="Edit location & address"
            onClick={onEditClick}
          >
            <PenSquare className="w-4 h-4 text-[#141F1E]" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-[20px]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoField
            label="Address Line 1"
            value={profile?.addressLine1 || "14 High Street"}
          />
          <InfoField
            label="Address Line 2"
            value={profile?.addressLine2 || "Suite 4"}
          />
          <InfoField
            label="City / Town"
            value={profile?.city || "London"}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoField
            label="Postcode"
            value={profile?.postcode || "SW1A 1AA"}
          />
        </div>
      </div>
    </div>
  );
}