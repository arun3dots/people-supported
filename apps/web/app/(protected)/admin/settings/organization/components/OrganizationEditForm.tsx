"use client";

import React, { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
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
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update organisation details",
      });
    },
  });

  const [jobTitle, setJobTitle] = useState(
    profile?.primaryContactRole ?? profile?.jobTitle ?? ""
  );
  const [careHomeType, setCareHomeType] = useState(
    profile?.careHomeType ?? ""
  );
  const [registeredProvider, setRegisteredProvider] = useState(
    profile?.registeredProvider ?? ""
  );
  const [establishedDate, setEstablishedDate] = useState(
    profile?.establishedDate ?? ""
  );
  const [website, setWebsite] = useState(
    profile?.website ?? ""
  );

  const showGeneral = mode === "all" || mode === "general";
  const showContact = mode === "all" || mode === "contact";
  const showLocation = mode === "all" || mode === "location";

  const activeResolver: Resolver<UpdateTenantDTO> = (values, context, options) => {
    const schema =
      mode === "general"
        ? updateTenantSchema.pick({ name: true, cqcNumber: true })
        : mode === "contact"
          ? updateTenantSchema.pick({
              primaryContactName: true,
              primaryContactPhone: true,
              primaryContactEmail: true,
            })
          : mode === "location"
            ? updateTenantSchema.pick({
                addressLine1: true,
                addressLine2: true,
                city: true,
                postcode: true,
              })
            : updateTenantSchema;

    return (zodResolver(schema as typeof updateTenantSchema) as Resolver<UpdateTenantDTO>)(
      values,
      context,
      options,
    );
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateTenantDTO>({
    resolver: activeResolver,
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
    if (open) {
      reset({
        name: profile?.name ?? "",
        cqcNumber: profile?.cqcNumber ?? "",
        primaryContactName: profile?.primaryContactName ?? "",
        primaryContactPhone: profile?.primaryContactPhone ?? "",
        primaryContactEmail: profile?.primaryContactEmail ?? "",
        addressLine1: profile?.addressLine1 ?? "",
        addressLine2: profile?.addressLine2 ?? "",
        city: profile?.city ?? "",
        postcode: profile?.postcode ?? "",
      });
      setJobTitle(profile?.primaryContactRole ?? profile?.jobTitle ?? "");
      setCareHomeType(profile?.careHomeType ?? "");
      setRegisteredProvider(profile?.registeredProvider ?? "");
      setEstablishedDate(profile?.establishedDate ?? "");
      setWebsite(profile?.website ?? "");
    }
  }, [profile, open, reset]);

  const toNullable = (val?: string | null) => {
    const trimmed = val?.trim();
    return trimmed ? trimmed : null;
  };

  const onFormSubmit = (data: UpdateTenantDTO) => {
    const payload: UpdateTenantDTO = {};

    if (showGeneral) {
      payload.name = data.name;
      payload.cqcNumber = toNullable(data.cqcNumber);
      payload.careHomeType = toNullable(careHomeType);
      payload.registeredProvider = toNullable(registeredProvider);
      payload.establishedDate = toNullable(establishedDate);
      payload.website = toNullable(website);
    }

    if (showContact) {
      payload.primaryContactName = data.primaryContactName;
      payload.primaryContactRole = toNullable(jobTitle);
      payload.primaryContactPhone = data.primaryContactPhone;
      payload.primaryContactEmail = toNullable(data.primaryContactEmail);
    }

    if (showLocation) {
      payload.addressLine1 = data.addressLine1;
      payload.addressLine2 = toNullable(data.addressLine2);
      payload.city = data.city;
      payload.postcode = data.postcode;
    }

    mutation.mutate(payload);
  };

  const getDialogTitle = () => {
    switch (mode) {
      case "general":
        return "Edit General Information";
      case "contact":
        return "Edit Primary Contact";
      case "location":
        return "Edit Location & Address";
      default:
        return profile?.name
          ? `Edit Organisation: ${profile.name}`
          : "Edit Organisation";
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
