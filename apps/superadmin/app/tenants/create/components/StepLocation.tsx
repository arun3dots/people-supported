"use client";

import { Input, Label, Text } from "@repo/ui/components/ui";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CreateTenantDTO } from "@repo/schema";

interface StepProps {
  register: UseFormRegister<CreateTenantDTO>;
  errors: FieldErrors<CreateTenantDTO>;
}

export function StepLocation({ register, errors }: StepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-1.5 md:col-span-2 [&_[data-slot=input-error]]:hidden">
        <Label required>Address Line 1</Label>
        <Input
          placeholder="Suite 100, High Street"
          {...register("addressLine1")}
        />
        {errors.addressLine1 && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.addressLine1.message}
          </Text>
        )}
      </div>
      <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
        <Label>Address Line 2 (Optional)</Label>
        <Input
          placeholder="Building Name"
          {...register("addressLine2")}
        />
      </div>
      <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
        <Label required>City</Label>
        <Input
          placeholder="London"
          {...register("city")}
        />
        {errors.city && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.city.message}
          </Text>
        )}
      </div>
      <div className="space-y-1.5 md:col-span-2 [&_[data-slot=input-error]]:hidden">
        <Label required>Postcode</Label>
        <Input
          placeholder="W1 1AA"
          {...register("postcode")}
        />
        {errors.postcode && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.postcode.message}
          </Text>
        )}
      </div>
    </div>
  );
}
