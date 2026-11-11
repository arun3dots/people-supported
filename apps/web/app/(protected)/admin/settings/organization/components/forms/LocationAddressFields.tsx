"use client";

import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { type UpdateTenantDTO } from "@repo/schema";
import { Card, Text, Input, Label } from "@repo/ui/components/ui";

interface LocationAddressFieldsProps {
  register: UseFormRegister<UpdateTenantDTO>;
  errors: FieldErrors<UpdateTenantDTO>;
}

export function LocationAddressFields({
  register,
  errors,
}: LocationAddressFieldsProps) {
  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <Text as="h3" size="md" weight="semibold" className="text-slate-900">
            Location & Physical Address
          </Text>
          <Text size="md" variant="muted" className="text-slate-500">
            Registered facility location and postal correspondence details
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressLine1">
            Address Line 1
          </Label>
          <Input
            id="addressLine1"
            placeholder="e.g. 14 High Street"
            {...register("addressLine1")}
            errorMessage={errors.addressLine1?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressLine2">
            Address Line 2 (Optional)
          </Label>
          <Input
            id="addressLine2"
            placeholder="e.g. Suite 4"
            {...register("addressLine2")}
            errorMessage={errors.addressLine2?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">
            City / Town
          </Label>
          <Input
            id="city"
            placeholder="e.g. London"
            {...register("city")}
            errorMessage={errors.city?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="postcode">
            Postcode
          </Label>
          <Input
            id="postcode"
            placeholder="e.g. SW1A 1AA"
            {...register("postcode")}
            errorMessage={errors.postcode?.message}
          />
        </div>
      </div>
    </Card>
  );
}
