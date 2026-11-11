"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@repo/ui/components/ui";
import { useUpdateResidentOverviewMutation } from "../../../../../../lib/queries/residents";
import { EditPersonalSection } from "./EditPersonalSection";
import { EditNokSection } from "./EditNokSection";
import {
  type EditSection,
  type OverviewFormData,
  PersonalSectionSchema,
  NokSectionSchema,
  FundingSectionSchema,
} from "./ResidentOverviewSchemas";

export type { EditSection, OverviewFormData };

interface EditResidentOverviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSection: EditSection;
  residentId: string;
  residentFullName: string;
  formState: OverviewFormData;
  setFormState: React.Dispatch<React.SetStateAction<OverviewFormData>>;
  onSaved: (updated: OverviewFormData) => void;
}

export function EditResidentOverviewModal({
  open,
  onOpenChange,
  editSection,
  residentId,
  residentFullName,
  formState,
  setFormState,
  onSaved,
}: EditResidentOverviewModalProps): React.JSX.Element {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateStep1, updateStep2, updateStep3 } = useUpdateResidentOverviewMutation();
  const isSaving = updateStep1.isPending || updateStep2.isPending || updateStep3.isPending;

  useEffect(() => {
    if (open) setErrors({});
  }, [open, editSection]);

  const validate = (): boolean => {
    setErrors({});
    let result: { success: boolean; error?: z.ZodError };
    if (editSection === "personal") {
      result = PersonalSectionSchema.safeParse(formState);
    } else if (editSection === "nok") {
      result = NokSectionSchema.safeParse(formState);
    } else if (editSection === "funding") {
      result = FundingSectionSchema.safeParse(formState);
    } else {
      return true;
    }

    if (!result.success && result.error) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!residentId || !validate()) return;
    const onSuccess = () => {
      onSaved(formState);
      onOpenChange(false);
    };

    if (editSection === "about") {
      updateStep3.mutate(
        { residentId, data: { specialRequirements: formState.aboutBio } },
        { onSuccess }
      );
    } else if (editSection === "nok") {
      const combinedNokName =
        [formState.nokFirstName, formState.nokMiddleName, formState.nokLastName]
          .filter(Boolean)
          .join(" ")
          .trim() || formState.nokName;
      const combinedSecondaryNokName =
        [
          formState.secondaryNokFirstName,
          formState.secondaryNokMiddleName,
          formState.secondaryNokLastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() || formState.secondaryNokName;
      const nextOfKin = [
        {
          firstName: formState.nokFirstName?.trim() || undefined,
          middleName: formState.nokMiddleName?.trim() || undefined,
          lastName: formState.nokLastName?.trim() || undefined,
          name: combinedNokName,
          phone: formState.nokPhone,
          relation: formState.nokRelation,
        },
        ...(combinedSecondaryNokName || formState.secondaryNokPhone
          ? [
              {
                firstName: formState.secondaryNokFirstName?.trim() || undefined,
                middleName: formState.secondaryNokMiddleName?.trim() || undefined,
                lastName: formState.secondaryNokLastName?.trim() || undefined,
                name: combinedSecondaryNokName,
                phone: formState.secondaryNokPhone,
                relation: formState.secondaryNokRelation,
              },
            ]
          : []),
      ];

      updateStep1.mutate(
        { residentId, data: { nextOfKin } },
        {
          onSuccess: () => {
            onSaved({
              ...formState,
              nokName: combinedNokName,
              secondaryNokName: combinedSecondaryNokName,
            });
            onOpenChange(false);
          },
        }
      );
    } else if (editSection === "personal") {
      updateStep1.mutate(
        {
          residentId,
          data: {
            firstName: formState.firstName?.trim() || undefined,
            middleName: formState.middleName?.trim() || undefined,
            lastName: formState.lastName?.trim() || undefined,
            addressLine1: formState.addressLine1,
            city: formState.city,
            country: formState.country,
            preferredLanguage: formState.preferredLanguage,
            religion: formState.religion,
            nhsNumber: formState.nhsNumber,
          },
        },
        { onSuccess }
      );
    } else if (editSection === "funding") {
      updateStep2.mutate(
        {
          residentId,
          data: {
            fundingType: formState.fundingType,
            localAuthority: formState.localAuthority,
            payer: formState.payer,
          },
        },
        { onSuccess }
      );
    }
  };

  return (
    <Dialog open={open && editSection !== "gp"} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="flex flex-col max-h-[90vh]">
        <DialogHeader className="pb-4 border-b border-gray-100 shrink-0 text-left">
          <DialogTitle className="text-xl font-bold text-[#141F1E]">
            {editSection === "about" && `Edit About Bio (${residentFullName})`}
            {editSection === "personal" && "Edit Personal Information"}
            {editSection === "nok" && "Edit Emergency Contact"}
            {editSection === "funding" && "Edit Funding & Insurance"}
          </DialogTitle>
          <DialogDescription className="text-md text-[#5D5D5D]">
            Update details for {residentFullName}. Click save when finished.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto">
          {editSection === "about" && (
            <div className="space-y-2">
              <Label>About / Care Summary</Label>
              <Textarea
                rows={5}
                value={formState.aboutBio}
                onChange={(e) => setFormState((prev) => ({ ...prev, aboutBio: e.target.value }))}
                placeholder="Enter resident bio or care summary..."
                className="text-md focus:ring-[#3D5C57]"
              />
            </div>
          )}

          {editSection === "personal" && (
            <EditPersonalSection
              formState={formState}
              setFormState={setFormState}
              errors={errors}
              setErrors={setErrors}
            />
          )}

          {editSection === "nok" && (
            <EditNokSection
              formState={formState}
              setFormState={setFormState}
              errors={errors}
              setErrors={setErrors}
            />
          )}

          {editSection === "funding" && (
            <div className="space-y-3 text-md">
              <div className="space-y-1">
                <Label required>Primary Payment Method</Label>
                <Input
                  value={formState.fundingType}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, fundingType: e.target.value }));
                    if (errors.fundingType) setErrors((prev) => ({ ...prev, fundingType: "" }));
                  }}
                  placeholder="e.g. Private Pay, Local Authority"
                  errorMessage={errors.fundingType}
                />
              </div>
              <div className="space-y-1">
                <Label>Local Authority</Label>
                <Input
                  value={formState.localAuthority}
                  onChange={(e) => setFormState((prev) => ({ ...prev, localAuthority: e.target.value }))}
                  placeholder="e.g. Oxfordshire County Council"
                />
              </div>
              <div className="space-y-1">
                <Label>Payer / Commissioning Body</Label>
                <Input
                  value={formState.payer}
                  onChange={(e) => setFormState((prev) => ({ ...prev, payer: e.target.value }))}
                  placeholder="e.g. Council, Self, Family"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-gray-100 shrink-0 gap-2 flex flex-row items-center justify-end">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#4A706A] hover:bg-[#3D5C57] text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving && <Loader2 className="size-3.5 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
