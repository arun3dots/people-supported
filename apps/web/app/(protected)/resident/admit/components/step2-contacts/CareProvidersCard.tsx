"use client";

import React from "react";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { isInvalidResidentName, RESIDENT_NAME_ERROR } from "@repo/schema";
import { Plus, Trash2 } from "lucide-react";
import { AdmissionFormData, CareProviderItem } from "../../types";
import { PhoneInputWithValidation } from "../common/PhoneInputWithValidation";

interface CareProvidersCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function CareProvidersCard({
  formData,
  updateFormData,
}: CareProvidersCardProps) {
  const [userSelectedIndices, setUserSelectedIndices] = React.useState<Set<number>>(new Set());
  const addOtherProvider = () => {
    const next: CareProviderItem[] = [
      ...formData.otherProviders,
      { type: "", name: "", clinic: "", phone: "" },
    ];
    updateFormData({ otherProviders: next });
  };

  const removeOtherProvider = (index: number) => {
    const next = formData.otherProviders.filter((_: CareProviderItem, i: number) => i !== index);
    updateFormData({ otherProviders: next });
  };

  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      <div className="pb-4 border-b border-slate-200/80 flex flex-row items-center justify-between gap-4">
        <div>
          <Text as="h3" size="sm" weight="bold" >
            Care Providers &amp; GP
          </Text>
          <Text size="sm" weight="regular" >
            Primary care practitioner and specialist medical contacts.
          </Text>
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={addOtherProvider}
        >
          <Plus className="size-3.5 text-emerald-800" /> Add Provider
        </Button>
      </div>

      <div className="space-y-6">
        {/* GP */}
        <div className="space-y-3">

          <Text as="h3" size="sm" weight="medium" className="text-slate-700">
            General Practitioner (GP) <span className="text-red-500">*</span>
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={cn("space-y-1.5", !isInvalidResidentName(formData.generalPractitioner.name) && "[&_[data-slot=input-error]]:hidden")}>
              <Label required >Doctor Name</Label>
              <Input
                type="text"
                placeholder="e.g. Robert Vance"
                value={formData.generalPractitioner.name}
                onChange={(e) =>
                  updateFormData({
                    generalPractitioner: { ...formData.generalPractitioner, name: e.target.value },
                  })
                }
                errorMessage={isInvalidResidentName(formData.generalPractitioner.name) ? RESIDENT_NAME_ERROR : undefined}
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label >Clinic / Practice</Label>
              <Input
                type="text"
                placeholder="e.g. Riverside Medical"
                value={formData.generalPractitioner.clinic || ""}
                onChange={(e) =>
                  updateFormData({
                    generalPractitioner: { ...formData.generalPractitioner, clinic: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <PhoneInputWithValidation
                label="Phone"
                required
                placeholder="e.g. +44 161 999 1234"
                value={formData.generalPractitioner.phone}
                onChange={(val) =>
                  updateFormData({
                    generalPractitioner: { ...formData.generalPractitioner, phone: val },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Other Providers Table */}
        {formData.otherProviders.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200/80">
            <Label >Additional Healthcare Providers</Label>
            {formData.otherProviders.map((provider: CareProviderItem, index: number) => {
              const isLegacyDefaultDentist =
                provider.type === "Dentist" &&
                !provider.name?.trim() &&
                !provider.clinic?.trim() &&
                !provider.phone?.trim() &&
                !userSelectedIndices.has(index);
              const providerValue = isLegacyDefaultDentist ? "" : (provider.type || "");

              return (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
                <div className="sm:col-span-3 space-y-1.5 [&_[data-slot=input-error]]:hidden">
                  <Label >Provider Type</Label>
                  <Select
                    value={providerValue}
                    onValueChange={(val) => {
                      setUserSelectedIndices((prev) => new Set(prev).add(index));
                      const updated = [...formData.otherProviders];
                      if (updated[index]) updated[index].type = val;
                      updateFormData({ otherProviders: updated });
                    }}
                  >
                    <SelectTrigger >
                      <SelectValue placeholder="Select" />
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
                <div className={cn("sm:col-span-3 space-y-1.5", !isInvalidResidentName(provider.name) && "[&_[data-slot=input-error]]:hidden")}>
                  <Label >Provider Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Sarah Khan"
                    value={provider.name}
                    onChange={(e) => {
                      const updated = [...formData.otherProviders];
                      if (updated[index]) updated[index].name = e.target.value;
                      updateFormData({ otherProviders: updated });
                    }}
                    errorMessage={isInvalidResidentName(provider.name) ? RESIDENT_NAME_ERROR : undefined}
                  />
                </div>
                <div className="sm:col-span-3 space-y-1.5 [&_[data-slot=input-error]]:hidden">
                  <Label >Clinic / Practice</Label>
                  <Input
                    type="text"
                    placeholder="Clinic / Practice"
                    value={provider.clinic || ""}
                    onChange={(e) => {
                      const updated = [...formData.otherProviders];
                      if (updated[index]) updated[index].clinic = e.target.value;
                      updateFormData({ otherProviders: updated });
                    }}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5 [&_[data-slot=input-error]]:hidden">
                  <PhoneInputWithValidation
                    label="Phone"
                    placeholder="Phone"
                    value={provider.phone || ""}
                    onChange={(val) => {
                      const updated = [...formData.otherProviders];
                      if (updated[index]) updated[index].phone = val;
                      updateFormData({ otherProviders: updated });
                    }}
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end pt-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => removeOtherProvider(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
