"use client";

import React from "react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Text,
} from "@repo/ui/components/ui";
import { Plus, Trash2 } from "lucide-react";
import { AdmissionFormData, CurrentMedicationItem } from "../../types";

interface CurrentMedicationsCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function CurrentMedicationsCard({
  formData,
  updateFormData,
}: CurrentMedicationsCardProps) {
  const [userSelectedIndices, setUserSelectedIndices] = React.useState<Set<number>>(new Set());
  const addMedication = () => {
    const next: CurrentMedicationItem[] = [
      ...formData.currentMedications,
      { name: "", dose: "", frequency: "", route: "", prescribingDoctor: "" },
    ];
    updateFormData({ currentMedications: next });
  };

  const removeMedication = (index: number) => {
    const next = formData.currentMedications.filter((_: CurrentMedicationItem, i: number) => i !== index);
    updateFormData({ currentMedications: next });
  };

  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      <div className="pb-4 border-b border-slate-200/80 flex flex-row items-center justify-between gap-4">
        <div>
          <Text as="h3" size="md" weight="bold">
            Current Medications
          </Text>
          <Text size="sm" weight="regular" variant="subdued">
            Will automatically populate the initial Care Plan MAR schedule.
          </Text>
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={addMedication}
          className="gap-1.5"
        >
          <Plus className="size-3.5 text-emerald-800" /> Add Medication
        </Button>
      </div>

      <div className="space-y-3">
        {formData.currentMedications.length === 0 ? (
          <Text size="sm" variant="subdued" className="italic text-center py-4">
            No medications added yet. Click &quot;Add Medication&quot; above to record baseline prescriptions.
          </Text>
        ) : (
          formData.currentMedications.map((med: CurrentMedicationItem, index: number) => {
            const isUnsetRow =
              !med.name?.trim() &&
              !med.dose?.trim() &&
              !userSelectedIndices.has(index);
            const frequencyValue =
              isUnsetRow && med.frequency === "Once Daily" ? "" : (med.frequency || "");
            const routeValue =
              isUnsetRow && med.route === "Oral" ? "" : (med.route || "");

            return (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
              <div className="sm:col-span-3 [&_[data-slot=input-error]]:hidden">
                <Input
                  type="text"
                  placeholder="Drug Name"
                  value={med.name}
                  onChange={(e) => {
                    setUserSelectedIndices((prev) => new Set(prev).add(index));
                    const updated = [...formData.currentMedications];
                    if (updated[index]) updated[index].name = e.target.value;
                    updateFormData({ currentMedications: updated });
                  }}
                />
              </div>
              <div className="sm:col-span-2 [&_[data-slot=input-error]]:hidden">
                <Input
                  type="text"
                  placeholder="Dose (e.g. 5mg)"
                  value={med.dose}
                  onChange={(e) => {
                    setUserSelectedIndices((prev) => new Set(prev).add(index));
                    const updated = [...formData.currentMedications];
                    if (updated[index]) updated[index].dose = e.target.value;
                    updateFormData({ currentMedications: updated });
                  }}
                />
              </div>
              <div className="sm:col-span-2 [&_[data-slot=input-error]]:hidden">
                <Input
                  type="text"
                  placeholder="Frequency (e.g. Once Daily)"
                  value={frequencyValue}
                  onChange={(e) => {
                    setUserSelectedIndices((prev) => new Set(prev).add(index));
                    const updated = [...formData.currentMedications];
                    if (updated[index]) updated[index].frequency = e.target.value;
                    updateFormData({ currentMedications: updated });
                  }}
                />
              </div>
              <div className="sm:col-span-2 [&_[data-slot=input-error]]:hidden">
                <Select
                  value={routeValue}
                  onValueChange={(val) => {
                    setUserSelectedIndices((prev) => new Set(prev).add(index));
                    const updated = [...formData.currentMedications];
                    if (updated[index]) updated[index].route = val;
                    updateFormData({ currentMedications: updated });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oral">Oral</SelectItem>
                    <SelectItem value="Topical">Topical</SelectItem>
                    <SelectItem value="Subcutaneous">Subcutaneous</SelectItem>
                    <SelectItem value="Inhaled">Inhaled</SelectItem>
                    <SelectItem value="Ophthalmic">Ophthalmic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 [&_[data-slot=input-error]]:hidden">
                <Input
                  type="text"
                  placeholder="Prescriber"
                  value={med.prescribingDoctor || ""}
                  onChange={(e) => {
                    setUserSelectedIndices((prev) => new Set(prev).add(index));
                    const updated = [...formData.currentMedications];
                    if (updated[index]) updated[index].prescribingDoctor = e.target.value;
                    updateFormData({ currentMedications: updated });
                  }}
                />
              </div>
              <div className="sm:col-span-1 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="size-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
