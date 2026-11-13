"use client";

import React, { useState, useEffect } from "react";
import { Plus, Loader2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  toast,
} from "@repo/ui/components/ui";
import { useUpdateResidentOverviewMutation } from "../../../../../../lib/queries/residents";
import { PhoneInputWithValidation } from "../../../../resident/admit/components/common/PhoneInputWithValidation";
import { CareSpecialistRow } from "./CareSpecialistRow";
import {
  type CareProviderItem,
  EditCareProvidersSchema,
} from "./CareProviderSchemas";

export type { CareProviderItem };

export interface EditCareProvidersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  residentName: string;
  initialData: {
    gpName?: string;
    gpPractice?: string;
    gpPhone?: string;
    otherProviders?: CareProviderItem[];
  };
  onSuccess: (updated: {
    gpName: string;
    gpPractice: string;
    gpPhone: string;
    otherProviders: CareProviderItem[];
  }) => void;
}

export function EditCareProvidersModal({
  open,
  onOpenChange,
  residentId,
  residentName,
  initialData,
  onSuccess,
}: EditCareProvidersModalProps) {
  const [gpName, setGpName] = useState(initialData.gpName || "");
  const [gpPractice, setGpPractice] = useState(initialData.gpPractice || "");
  const [gpPhone, setGpPhone] = useState(initialData.gpPhone || "");
  const [otherProviders, setOtherProviders] = useState<CareProviderItem[]>(
    initialData.otherProviders || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { updateStep1 } = useUpdateResidentOverviewMutation();
  const isSaving = updateStep1.isPending;

  useEffect(() => {
    if (open) {
      setGpName(initialData.gpName || "");
      setGpPractice(initialData.gpPractice || "");
      setGpPhone(initialData.gpPhone || "");
      setOtherProviders(
        Array.isArray(initialData.otherProviders)
          ? initialData.otherProviders
          : []
      );
      setErrors({});
    }
  }, [open, initialData]);

  const handleAddProvider = () => {
    setOtherProviders((prev) => [
      ...prev,
      { type: "Physiotherapist", name: "", clinic: "", phone: "" },
    ]);
  };

  const handleRemoveProvider = (index: number) => {
    setOtherProviders((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`provider_${index}_`)) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const handleUpdateProvider = (
    index: number,
    field: keyof CareProviderItem,
    value: string
  ) => {
    setOtherProviders((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index]!, [field]: value };
      }
      return copy;
    });
    const errorKey = `provider_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    setErrors({});
    const result = EditCareProvidersSchema.safeParse({
      gpPractice,
      gpName,
      gpPhone,
      otherProviders,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path;
        if (path[0] === "otherProviders" && typeof path[1] === "number") {
          const idx = path[1];
          const field = path[2];
          newErrors[`provider_${idx}_${field}`] = issue.message;
        } else if (path[0]) {
          newErrors[path[0].toString()] = issue.message;
        }
      });
      setErrors(newErrors);
      toast({
        title: "Validation Error",
        description: "Please correct the highlighted errors before saving.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!residentId || !validate()) return;

    updateStep1.mutate(
      {
        residentId,
        data: {
          gpDetails: {
            name: gpName,
            practice: gpPractice,
            phone: gpPhone,
          },
          generalPractitioner: {
            name: gpName,
            clinic: gpPractice,
            phone: gpPhone,
          },
          otherProviders,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Care Providers Updated",
            description: "GP and specialist details have been saved successfully.",
          });
          onSuccess({ gpName, gpPractice, gpPhone, otherProviders });
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-3 border-b border-gray-100 shrink-0 text-left">
          <DialogTitle className="text-xl font-bold text-[#141F1E] flex items-center gap-2">
            <User className="size-5 text-[#4A706A]" />
            Edit Care Providers &amp; GP Details
          </DialogTitle>
          <DialogDescription className="text-md text-[#5D5D5D]">
            Manage GP details and external healthcare specialists for {residentName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-md font-bold text-[#4A706A] border-b border-gray-100 pb-2">
              Primary General Practitioner (GP)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>GP Surgery / Practice Name</Label>
                <Input
                  value={gpPractice}
                  onChange={(e) => {
                    setGpPractice(e.target.value);
                    if (errors.gpPractice) setErrors((prev) => ({ ...prev, gpPractice: "" }));
                  }}
                  placeholder="e.g. St Mary's Health Centre"
                  errorMessage={errors.gpPractice}
                />
              </div>
              <div className="space-y-1">
                <Label>Registered GP Name</Label>
                <Input
                  value={gpName}
                  onChange={(e) => {
                    setGpName(e.target.value);
                    if (errors.gpName) setErrors((prev) => ({ ...prev, gpName: "" }));
                  }}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  errorMessage={errors.gpName}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <PhoneInputWithValidation
                  label="GP Surgery Phone Number"
                  value={gpPhone}
                  onChange={(val: string) => {
                    setGpPhone(val);
                    if (errors.gpPhone) setErrors((prev) => ({ ...prev, gpPhone: "" }));
                  }}
                  placeholder="e.g. +44 1865 220000"
                  error={errors.gpPhone}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-md font-bold text-[#4A706A]">
                Additional Healthcare Providers
              </h3>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAddProvider}
                className="gap-1.5 rounded-xl border-slate-200 text-[#4A706A] font-semibold cursor-pointer h-9 px-3"
              >
                <Plus className="size-3.5 text-[#4A706A]" /> Add Specialist
              </Button>
            </div>

            {otherProviders.length === 0 ? (
              <div className="p-6 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl text-center">
                <p className="text-md text-slate-500">
                  No additional healthcare providers added yet. Click &quot;Add Specialist&quot; to register dental, optometry, or therapy contacts.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden sm:grid sm:grid-cols-[130px_1fr_1fr_140px_36px] gap-2.5 px-3 text-md font-semibold text-[#141F1E]">
                  <div>Provider Type</div>
                  <div>Provider Name</div>
                  <div>Clinic / Practice</div>
                  <div>Phone Number</div>
                  <div className="text-center sr-only">Actions</div>
                </div>

                {otherProviders.map((provider, index) => (
                  <CareSpecialistRow
                    key={index}
                    provider={provider}
                    index={index}
                    errors={errors}
                    onUpdate={handleUpdateProvider}
                    onRemove={handleRemoveProvider}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="rounded-xl px-5 border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl px-6 font-semibold"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
