"use client";

import React from "react";
import {
  Input,
  Label,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { Check, Plus } from "lucide-react";
import { AdmissionFormData } from "../../types";

interface AssistiveDevicesCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

const ASSISTIVE_DEVICE_OPTIONS = [
  "Wheelchair",
  "Walker / Rollator",
  "Hearing aid(s)",
  "Glasses",
  "Dentures (labelled)",
  "Walking Stick / Cane",
  "Other",
];

export function AssistiveDevicesCard({
  formData,
  updateFormData,
}: AssistiveDevicesCardProps) {
  const toggleAssistiveDevice = (device: string) => {
    const exists = formData.assistiveDevices.includes(device);
    const next = exists
      ? formData.assistiveDevices.filter((d: string) => d !== device)
      : [...formData.assistiveDevices, device];
    updateFormData({ assistiveDevices: next });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 3. Assistive Devices Brought */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Assistive Devices Brought
          </Text>
          <Text size="md" weight="regular" variant="subdued">
            Select personal mobility and sensory equipment brought on admission.
          </Text>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ASSISTIVE_DEVICE_OPTIONS.map((dev) => {
            const isSelected = formData.assistiveDevices.includes(dev);
            return (
              <Button
                key={dev}
                type="button"
                variant={isSelected ? "primary" : "outline"}
                onClick={() => toggleAssistiveDevice(dev)}
                className={`justify-start px-3.5 shadow-none gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-800 border-emerald-800 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isSelected ? <Check className="size-3.5 text-white" /> : <Plus className="size-3.5 text-slate-400" />}
                <span className="truncate">{dev}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 4. Valuables Safe Log */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Valuables Stored in Facility Safe
          </Text>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label>Valuables Stored in Safe?</Label>
            <Select
              value={formData.valuablesInSafe ? "Yes" : "No"}
              onValueChange={(val) => updateFormData({ valuablesInSafe: val === "Yes" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No">No — Kept in Room or Family</SelectItem>
                <SelectItem value="Yes">Yes — Stored in Safe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2 [&_[data-slot=input-error]]:hidden">
            <Label>Description of Stored Valuables</Label>
            <Input
              type="text"
              placeholder="e.g. Wedding band, passport, cash logged"
              value={formData.valuablesDescription || ""}
              onChange={(e) => updateFormData({ valuablesDescription: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
