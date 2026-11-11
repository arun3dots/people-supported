"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateEnquiryStage1Schema,
  type CreateEnquiryStage1DTO,
  type CreateEnquiryDraftDTO,
  type EnquiryResponseDTO,
} from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button,
  toast,
} from "@repo/ui/components/ui";
import {
  useCreateEnquiryMutation,
  useUpdateEnquiryMutation,
} from "../../../../../lib/queries/enquiries";
import {
  EnquirerContactSection,
  ProspectiveResidentSection,
} from "./EnquiryFormSections";

interface EnquiryWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enquiry: EnquiryResponseDTO | null;
  /** Called after a new enquiry is successfully created — use to reset page filters */
  onCreated?: () => void;
}

export function EnquiryWizardModal({
  open,
  onOpenChange,
  enquiry,
  onCreated,
}: EnquiryWizardModalProps) {
  const [createdEnquiryId, setCreatedEnquiryId] = React.useState<string | null>(null);

  const activeEnquiryId = enquiry?.id || createdEnquiryId || "";

  const createMutation = useCreateEnquiryMutation();
  const updateMutation = useUpdateEnquiryMutation(activeEnquiryId);

  const {
    register,
    reset,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<CreateEnquiryStage1DTO>({
    resolver: zodResolver(CreateEnquiryStage1Schema),
    mode: "onBlur",
    defaultValues: {
      enquirerName: enquiry?.enquirerName || "",
      enquirerRelationship: enquiry?.enquirerRelationship || "",
      enquirerPhone: enquiry?.enquirerPhone || "",
      enquirerEmail: enquiry?.enquirerEmail || "",
      firstName: enquiry?.firstName || "",
      middleName: enquiry?.middleName || "",
      lastName: enquiry?.lastName || "",
      currentLocation: enquiry?.currentLocation || "",
      careCategory: enquiry?.careCategory || "",
    },
  });

  useEffect(() => {
    if (open) {
      setCreatedEnquiryId(null);
      reset({
        enquirerName: enquiry?.enquirerName || "",
        enquirerRelationship: enquiry?.enquirerRelationship || "",
        enquirerPhone: enquiry?.enquirerPhone || "",
        enquirerEmail: enquiry?.enquirerEmail || "",
        firstName: enquiry?.firstName || "",
        middleName: enquiry?.middleName || "",
        lastName: enquiry?.lastName || "",
        currentLocation: enquiry?.currentLocation || "",
        careCategory: enquiry?.careCategory || "",
      });
    }
  }, [open, enquiry, reset]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = async (closeOnSuccess = true, isDraft = false) => {
    const isValid = isDraft ? true : await trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please complete all required enquiry fields.",
        variant: "destructive",
      });
      return;
    }

    const values = getValues();
    const valuesPayload = {
      enquirerName: values.enquirerName.trim(),
      enquirerRelationship: values.enquirerRelationship,
      enquirerPhone: values.enquirerPhone.trim(),
      enquirerEmail: values.enquirerEmail?.trim() || undefined,
      firstName: values.firstName.trim(),
      middleName: values.middleName?.trim() || undefined,
      lastName: values.lastName.trim(),
      currentLocation: values.currentLocation,
      careCategory: values.careCategory,
    };
    const corePayload: CreateEnquiryStage1DTO | CreateEnquiryDraftDTO = isDraft
      ? { isDraft: true, ...valuesPayload }
      : valuesPayload as CreateEnquiryStage1DTO;

    if (!enquiry?.id) {
      createMutation.mutate(corePayload, {
        onSuccess: (created) => {
          if (created?.id) setCreatedEnquiryId(created.id);
          onOpenChange(false);
          onCreated?.();
        },
      });
    } else {
      updateMutation.mutate(corePayload, {
        onSuccess: () => {
          onOpenChange(false);
          onCreated?.();
        },
      });
    }
  };

  const statusBadgeState = (status: string) => {
    if (status === "Ready for Admission") return "success";
    if (status === "Assessment Pending") return "warning";
    if (status === "Admitted") return "success";
    if (status === "Closed") return "inactive";
    return "inactive";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {enquiry
                  ? `Edit Enquiry: ${[enquiry.firstName, enquiry.middleName, enquiry.lastName].filter(Boolean).join(" ")}`
                  : "New Resident Enquiry"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Record enquirer contact, prospective resident details, and care category.
              </DialogDescription>
            </div>
            {enquiry?.status && (
              <Badge state={statusBadgeState(enquiry.status)}>
                {enquiry.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Section 1: Enquirer Contact Details */}
          <EnquirerContactSection
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />

          {/* Section 2: Prospective Resident Details */}
          <ProspectiveResidentSection
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave(false, true)}
                disabled={isPending}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleSave(true)}
                disabled={isPending}
              >
                {enquiry?.id ? "Save Changes" : "Create Enquiry"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
