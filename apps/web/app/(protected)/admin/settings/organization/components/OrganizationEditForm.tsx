"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTenantSchema, type UpdateTenantDTO } from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { useUpdateOrganizationProfileMutation } from "../../../../../../lib/queries/organization/organizationMutations";
import { GeneralInfoFields } from "./forms/GeneralInfoFields";
import { PrimaryContactFields } from "./forms/PrimaryContactFields";
import { LocationAddressFields } from "./forms/LocationAddressFields";

export interface OrganizationEditFormProps {
  profile?: {
    name?: string | null;
    cqcNumber?: string | null;
    careHomeType?: string | null;
    registeredProvider?: string | null;
    establishedDate?: string | null;
    website?: string | null;
    primaryContactName?: string | null;
    primaryContactEmail?: string | null;
    primaryContactPhone?: string | null;
    primaryContactRole?: string | null;
    jobTitle?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    postcode?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "general" | "contact" | "location" | "all";
}

export function OrganizationEditForm({
  profile,
  open,
  onOpenChange,
  mode = "all",
}: OrganizationEditFormProps) {
  const { toast } = useToast();
  const mutation = useUpdateOrganizationProfileMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organisation details updated successfully",
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update organisation details",
      });
    },
  });

  const [jobTitle, setJobTitle] = useState(
    profile?.jobTitle ?? profile?.primaryContactRole ?? "Administrator"
  );
  const [careHomeType, setCareHomeType] = useState(
    profile?.careHomeType ?? "Residential Care Home"
  );
  const [registeredProvider, setRegisteredProvider] = useState(
    profile?.registeredProvider ?? "Care & Love Services Ltd."
  );
  const [establishedDate, setEstablishedDate] = useState(
    profile?.establishedDate ?? "15 Jan 2018"
  );
  const [website, setWebsite] = useState(
    profile?.website ?? "www.careandlovehaven.com"
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateTenantDTO>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: profile?.name ?? "",
      cqcNumber: profile?.cqcNumber ?? "",
      primaryContactName: profile?.primaryContactName ?? "",
      primaryContactPhone: profile?.primaryContactPhone ?? "",
      primaryContactEmail: profile?.primaryContactEmail ?? "",
      addressLine1: profile?.addressLine1 ?? "",
      addressLine2: profile?.addressLine2 ?? "",
      city: profile?.city ?? "",
      postcode: profile?.postcode ?? "",
    },
  });

  useEffect(() => {
    if (open && profile) {
      reset({
        name: profile.name ?? "",
        cqcNumber: profile.cqcNumber ?? "",
        primaryContactName: profile.primaryContactName ?? "",
        primaryContactPhone: profile.primaryContactPhone ?? "",
        primaryContactEmail: profile.primaryContactEmail ?? "",
        addressLine1: profile.addressLine1 ?? "",
        addressLine2: profile.addressLine2 ?? "",
        city: profile.city ?? "",
        postcode: profile.postcode ?? "",
      });
      setJobTitle(
        profile.jobTitle ?? profile.primaryContactRole ?? "Administrator"
      );
      setCareHomeType(profile.careHomeType ?? "Residential Care Home");
      setRegisteredProvider(profile.registeredProvider ?? "Care & Love Services Ltd.");
      setEstablishedDate(profile.establishedDate ?? "15 Jan 2018");
      setWebsite(profile.website ?? "www.careandlovehaven.com");
    }
  }, [profile, open, reset]);

  const onFormSubmit = (data: UpdateTenantDTO) => {
    mutation.mutate(data);
  };

  const showGeneral = mode === "all" || mode === "general";
  const showContact = mode === "all" || mode === "contact";
  const showLocation = mode === "all" || mode === "location";

  const getDialogTitle = () => {
    switch (mode) {
      case "general":
        return "Edit General Information";
      case "contact":
        return "Edit Primary Contact";
      case "location":
        return "Edit Location & Address";
      default:
        return `Edit Organisation: ${profile?.name ?? "Supported Living"}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle>
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription className="mt-1">
            Update identity, contact information, and physical address for this supported living service.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 pt-1 max-h-[75vh] overflow-y-auto pr-1">
          {showGeneral && (
            <GeneralInfoFields
              register={register}
              errors={errors}
              careHomeType={careHomeType}
              setCareHomeType={setCareHomeType}
              registeredProvider={registeredProvider}
              setRegisteredProvider={setRegisteredProvider}
              establishedDate={establishedDate}
              setEstablishedDate={setEstablishedDate}
              website={website}
              setWebsite={setWebsite}
            />
          )}

          {showContact && (
            <PrimaryContactFields
              register={register}
              errors={errors}
              jobTitle={jobTitle}
              setJobTitle={setJobTitle}
            />
          )}

          {showLocation && (
            <LocationAddressFields
              register={register}
              errors={errors}
            />
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
