"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { PhoneInputWithValidation } from "../../../../resident/admit/components/common/PhoneInputWithValidation";
import type { CareProviderItem } from "./EditCareProvidersModal";

interface CareSpecialistRowProps {
  provider: CareProviderItem;
  index: number;
  errors?: Record<string, string>;
  onUpdate: (index: number, field: keyof CareProviderItem, value: string) => void;
  onRemove: (index: number) => void;
}

export function CareSpecialistRow({
  provider,
  index,
  errors,
  onUpdate,
  onRemove,
}: CareSpecialistRowProps) {
  const nameError = errors?.[`provider_${index}_name`];
  const clinicError = errors?.[`provider_${index}_clinic`];
  const phoneError = errors?.[`provider_${index}_phone`];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr_1fr_140px_36px] gap-2.5 items-start bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
      {/* Provider Type */}
      <div className="space-y-1 sm:space-y-0">
        <span className="sm:hidden text-md font-semibold text-[#141F1E]">Provider Type</span>
        <Select
          value={provider.type || "Dentist"}
          onValueChange={(val) => onUpdate(index, "type", val)}
        >
          <SelectTrigger className="w-full h-10 bg-white border-[#BCD3CD] rounded-xl text-md font-medium text-slate-900 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Dentist">Dentist</SelectItem>
            <SelectItem value="Podiatrist">Podiatrist</SelectItem>
            <SelectItem value="Optometrist">Optometrist</SelectItem>
            <SelectItem value="Physiotherapist">Physiotherapist</SelectItem>
            <SelectItem value="Audiologist">Audiologist</SelectItem>
            <SelectItem value="Occupational Therapist">Occupational Therapist</SelectItem>
            <SelectItem value="Speech Therapist">Speech Therapist</SelectItem>
            <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
            <SelectItem value="Social Worker">Social Worker</SelectItem>
            <SelectItem value="Other">Other Specialist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Provider Name */}
      <div className="space-y-1 sm:space-y-0">
        <span className="sm:hidden text-md font-semibold text-[#141F1E]">Provider Name</span>
        <Input
          type="text"
          placeholder="e.g. Sarah Khan"
          value={provider.name || ""}
          errorMessage={nameError}
          onChange={(e) => onUpdate(index, "name", e.target.value)}
          className="w-full h-10 bg-white border-[#BCD3CD] rounded-xl text-md text-slate-900 shadow-none focus-visible:ring-[#4A706A]"
        />
      </div>

      {/* Clinic / Practice */}
      <div className="space-y-1 sm:space-y-0">
        <span className="sm:hidden text-md font-semibold text-[#141F1E]">Clinic / Practice</span>
        <Input
          type="text"
          placeholder="Clinic / Practice"
          value={provider.clinic || ""}
          errorMessage={clinicError}
          onChange={(e) => onUpdate(index, "clinic", e.target.value)}
          className="w-full h-10 bg-white border-[#BCD3CD] rounded-xl text-md text-slate-900 shadow-none focus-visible:ring-[#4A706A]"
        />
      </div>

      {/* Phone Number */}
      <div className="space-y-1 sm:space-y-0">
        <span className="sm:hidden text-md font-semibold text-[#141F1E]">Phone Number</span>
        <PhoneInputWithValidation
          label=""
          placeholder="e.g. +44 7700 900077"
          value={provider.phone || ""}
          error={phoneError}
          onChange={(val: string) => onUpdate(index, "phone", val)}
          className="w-full"
        />
      </div>

      {/* Action */}
      <div className="flex sm:justify-center justify-end pt-1 sm:pt-1">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => onRemove(index)}
          className="size-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
          title="Remove provider"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

