"use client";

import React from "react";
import { Control, Controller, FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import type { Resident } from "../../../../../../lib/types/resident";
import type { NewInvoiceFormValues } from "../types";
interface BillToCardProps {
  register: UseFormRegister<NewInvoiceFormValues>;
  control: Control<NewInvoiceFormValues>;
  setValue: UseFormSetValue<NewInvoiceFormValues>;
  watchedBillTo: "Resident" | "Organisation / Payer";
  watchedResidentId?: string;
  watchedPayerName?: string;
  residents?: Resident[];
  errors?: FieldErrors<NewInvoiceFormValues>;
  onResidentSelect?: (resident: Resident) => void;
}

export function BillToCard({
  register,
  control,
  setValue,
  watchedBillTo,
  watchedResidentId,
  watchedPayerName,
  residents,
  errors,
  onResidentSelect,
}: BillToCardProps) {
  const eligibleResidents = React.useMemo(
    () =>
      residents?.filter(
        (r) =>
          !r.isDraft &&
          !["draft", "discharged"].includes((r.status || "").toLowerCase())
      ) || [],
    [residents]
  );

  React.useEffect(() => {
    if (watchedResidentId && residents && residents.length > 0) {
      const isValid = eligibleResidents.some((r) => r.id === watchedResidentId);
      if (!isValid) {
        setValue("residentId", "");
        if (watchedBillTo === "Resident") {
          setValue("payerName", "");
        }
      }
    }
  }, [watchedResidentId, eligibleResidents, residents, setValue, watchedBillTo]);

  const handleResidentSelect = (resId: string) => {
    const selected = eligibleResidents.find((r) => r.id === resId);
    if (selected && onResidentSelect) {
      onResidentSelect(selected);
    }
  };

  const selectedResident = eligibleResidents.find((r) => r.id === watchedResidentId);
  const displayName =
    selectedResident?.fullName ||
    (watchedBillTo === "Resident" && watchedResidentId
      ? watchedPayerName
      : undefined);

  return (
    <Card className="p-6 flex flex-col gap-6 w-full font-['Outfit',sans-serif]">
      {/* Card Header matching Staff style */}
      <div className="w-full flex items-center justify-between">
        <div>
          <Text as="h3" size="sm" weight="medium" className="text-slate-900">
            Bill To
          </Text>
          <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
            Select the resident and billing contact for this invoice
          </Text>
        </div>
      </div>

      {/* Bill To Type: Resident vs Organisation */}
      <RadioGroup
        value={watchedBillTo}
        onValueChange={(val) =>
          setValue("billToType", val as "Resident" | "Organisation / Payer")
        }
        className="flex items-center gap-6"
      >
        <div className="flex items-center gap-2 cursor-pointer">
          <RadioGroupItem value="Resident" id="bill-to-resident" />
          <Label htmlFor="bill-to-resident" className="cursor-pointer font-medium">
            Resident
          </Label>
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
          <RadioGroupItem value="Organisation / Payer" id="bill-to-org" />
          <Label htmlFor="bill-to-org" className="cursor-pointer font-medium">
            Organisation / Payer
          </Label>
        </div>
      </RadioGroup>

      {/* Payer Name — shown only for Organisation */}
      {watchedBillTo === "Organisation / Payer" && (
        <div className="flex flex-col gap-1.5">
          <Label required>Organisation / Payer Name</Label>
          <Input
            {...register("payerName", {
              required:
                watchedBillTo === "Organisation / Payer"
                  ? "Organisation / Payer name is required"
                  : false,
            })}
            placeholder="e.g. Camden London Borough Council / NHS ICB"
          />
          {errors?.payerName && (
            <Text variant="error" size="sm">
              {errors.payerName.message}
            </Text>
          )}
        </div>
      )}

      {/* Row 1: Resident, Address, City */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resident Selector */}
        <div className="flex flex-col gap-1.5">
          <Label required>Resident</Label>
          <Controller
            name="residentId"
            control={control}
            rules={{
              validate: (val) => {
                if (watchedBillTo === "Resident" && !val) {
                  return "Resident selection is required";
                }
                return true;
              },
            }}
            render={({ field }) => {
              const activeId = field.value || watchedResidentId;
              const activeResident = eligibleResidents.find((r) => r.id === activeId);
              const residentDisplayName =
                activeResident?.fullName ||
                (watchedBillTo === "Resident" && activeId ? watchedPayerName : undefined);

              return (
                <Select
                  value={activeId || ""}
                  onValueChange={(val) => {
                    field.onChange(val);
                    handleResidentSelect(val);
                  }}
                >
                  <SelectTrigger className="w-full">
                    {residentDisplayName ? (
                      <div className="flex items-center gap-2">
                        <Avatar size="sm" className="size-6">
                          {activeResident?.photoUrl && (
                            <AvatarImage
                              src={activeResident.photoUrl}
                              alt={residentDisplayName}
                            />
                          )}
                          <AvatarFallback className="bg-slate-200 text-slate-700">
                            {residentDisplayName.charAt(0) || "R"}
                          </AvatarFallback>
                        </Avatar>
                        <Text as="span" size="sm" className="text-slate-900 font-normal">
                          {residentDisplayName}
                        </Text>
                      </div>
                    ) : (
                      <SelectValue placeholder="Select" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleResidents.map((r) => (
                      <SelectItem key={r.id} value={r.id} textValue={r.fullName}>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm" className="size-6">
                            {r.photoUrl && <AvatarImage src={r.photoUrl} alt={r.fullName} />}
                            <AvatarFallback className="bg-slate-200 text-slate-700">
                              {r.fullName?.charAt(0) || "R"}
                            </AvatarFallback>
                          </Avatar>
                          <Text as="span" size="sm">{r.fullName}</Text>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors?.residentId && (
            <Text variant="error" size="sm">
              {errors.residentId.message || "Please select a resident"}
            </Text>
          )}
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressLine1" required>Address</Label>
          <Input
            id="addressLine1"
            {...register("addressLine1", { required: "Address is required" })}
            placeholder="e.g. 12, Maple Avenue"
          />
          {errors?.addressLine1 && (
            <Text variant="error" size="sm">
              {errors.addressLine1.message}
            </Text>
          )}
        </div>

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city" required>City</Label>
          <Input
            id="city"
            {...register("city", { required: "City is required" })}
            placeholder="e.g. London"
          />
          {errors?.city && (
            <Text variant="error" size="sm">
              {errors.city.message}
            </Text>
          )}
        </div>
      </div>

      {/* Row 2: Email, Phone, Postcode, Country */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="e.g. leslie@example.com"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Contact</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="e.g. +44 7700 900888"
          />
        </div>

        {/* Postcode */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="postcode" required>Postcode</Label>
          <Input
            id="postcode"
            {...register("postcode", { required: "Postcode is required" })}
            placeholder="e.g. SW1A 1AA"
          />
          {errors?.postcode && (
            <Text variant="error" size="sm">
              {errors.postcode.message}
            </Text>
          )}
        </div>

        {/* Country */}
        <div className="flex flex-col gap-1.5">
          <Label required>Country</Label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Ireland">Ireland</SelectItem>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
    </Card>
  );
}
