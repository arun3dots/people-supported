"use client";

import {
  Input,
  Button,
  Checkbox,
  Text,
} from "@repo/ui/components/ui";
import { Plus, Trash2 } from "lucide-react";
import { AdmissionFormData, BelongingItem } from "../../types";
import { DocumentUploadButton } from "../common/DocumentUploadField";
import { ADMISSION_UPLOAD_LIMITS } from "../../data/admissionFormFields";

interface BelongingsInventoryCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function BelongingsInventoryCard({
  formData,
  updateFormData,
}: BelongingsInventoryCardProps) {
  const addBelonging = () => {
    const next: BelongingItem[] = [
      ...formData.belongings,
      { item: "", description: "", conditionPhotoUrl: "", estValue: undefined },
    ];
    updateFormData({ belongings: next });
  };

  const removeBelonging = (index: number) => {
    const next = formData.belongings.filter((_: BelongingItem, i: number) => i !== index);
    updateFormData({ belongings: next });
  };

  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      <div className="pb-4 border-b border-slate-200/80 flex flex-row items-center justify-between gap-4">
        <div>
          <Text as="h3" size="md" weight="bold">
            Personal Belongings Inventory
          </Text>
          <Text size="md" weight="regular" variant="subdued">
            Record possessions and labelled personal items brought upon admission. (Uploads: {ADMISSION_UPLOAD_LIMITS.DOCUMENT.hint})
          </Text>
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={addBelonging}
          className="gap-1.5"
        >
          <Plus className="size-3.5 text-emerald-800" /> Add Belonging
        </Button>
      </div>

      <div className="space-y-3">
        {formData.belongings.map((item: BelongingItem, index: number) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
            <div className="sm:col-span-3 [&_[data-slot=input-error]]:hidden">
              <Input
                type="text"
                placeholder="Item Name"
                value={item.item}
                onChange={(e) => {
                  const updated = [...formData.belongings];
                  if (updated[index]) updated[index].item = e.target.value;
                  updateFormData({ belongings: updated });
                }}
              />
            </div>
            <div className="sm:col-span-3 [&_[data-slot=input-error]]:hidden">
              <Input
                type="text"
                placeholder="Description & Colour"
                value={item.description || ""}
                onChange={(e) => {
                  const updated = [...formData.belongings];
                  if (updated[index]) updated[index].description = e.target.value;
                  updateFormData({ belongings: updated });
                }}
              />
            </div>
            <div className="sm:col-span-4 flex items-center gap-1.5 [&_[data-slot=input-error]]:hidden">
              <Input
                type="text"
                placeholder="Condition / Photo URL"
                value={item.conditionPhotoUrl || ""}
                onChange={(e) => {
                  const updated = [...formData.belongings];
                  if (updated[index]) updated[index].conditionPhotoUrl = e.target.value;
                  updateFormData({ belongings: updated });
                }}
                className="flex-1"
              />
              <DocumentUploadButton
                value={item.conditionPhotoUrl}
                accept="image/*,.pdf"
                buttonText="Photo"
                onChange={(url) => {
                  const updated = [...formData.belongings];
                  if (updated[index]) updated[index].conditionPhotoUrl = url;
                  updateFormData({ belongings: updated });
                }}
              />
            </div>
            <div className="sm:col-span-1 [&_[data-slot=input-error]]:hidden">
              <Input
                type="number"
                placeholder="£"
                value={item.estValue || ""}
                onChange={(e) => {
                  const updated = [...formData.belongings];
                  if (updated[index]) updated[index].estValue = parseFloat(e.target.value) || undefined;
                  updateFormData({ belongings: updated });
                }}
              />
            </div>
            <div className="sm:col-span-1 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => removeBelonging(index)}
                className="size-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-3 text-md text-slate-600">
          <Checkbox
            checked={formData.liabilityWaiverSigned}
            onCheckedChange={(checked: boolean | "indeterminate") =>
              updateFormData({ liabilityWaiverSigned: checked === true })
            }
          />
          <Text size="md" variant="subdued">
            Family / resident acknowledges liability waiver for unlisted or unlabelled personal items.
          </Text>
        </div>
      </div>
    </div>
  );
}
