"use client";

import React, { useState } from "react";
import { User } from "lucide-react";
import { Input, Label } from "@repo/ui/components/ui";
import { getStaffPhoneValidationError } from "@repo/schema";

interface StaffEditKinFieldsProps {
  kinName: string;
  setKinName: (v: string) => void;
  kinRelation: string;
  setKinRelation: (v: string) => void;
  kinPhone: string;
  setKinPhone: (v: string) => void;
  kinEmail: string;
  setKinEmail: (v: string) => void;
  kinPhoneError?: string | null;
}

export function StaffEditKinFields({
  kinName,
  setKinName,
  kinRelation,
  setKinRelation,
  kinPhone,
  setKinPhone,
  kinEmail,
  setKinEmail,
  kinPhoneError: externalError,
}: StaffEditKinFieldsProps) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const liveError = phoneTouched ? getStaffPhoneValidationError(kinPhone, false, "Next of Kin phone number") : null;
  const activeError = externalError || liveError;

  return (
    <>
      <h3 className="text-md font-bold flex items-center gap-2 text-[#4A706A] border-b border-gray-100 pb-2 pt-2">
        <User className="w-4 h-4" /> Next of Kin / Contact Person Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Next of Kin Name</Label>
          <Input
            value={kinName}
            onChange={(e) => setKinName(e.target.value)}
            placeholder="Full name of Next of Kin"
            className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Relationship</Label>
          <Input
            value={kinRelation}
            onChange={(e) => setKinRelation(e.target.value)}
            placeholder="e.g. Spouse, Parent, Sibling"
            className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone Number</Label>
          <Input
            type="tel"
            value={kinPhone}
            onChange={(e) => setKinPhone(e.target.value)}
            onBlur={() => setPhoneTouched(true)}
            placeholder="e.g. +44 7700 900077"
            errorMessage={activeError || undefined}
            className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email Address</Label>
          <Input
            type="email"
            value={kinEmail}
            onChange={(e) => setKinEmail(e.target.value)}
            placeholder="Contact email address (optional)"
            className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A]"
          />
        </div>
      </div>
    </>
  );
}

