"use client";

import { Input, Label, Text } from "@repo/ui/components/ui";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CreateTenantDTO } from "@repo/schema";

interface StepProps {
  register: UseFormRegister<CreateTenantDTO>;
  errors: FieldErrors<CreateTenantDTO>;
}

export function StepIdentity({ register, errors }: StepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
        <Label required>Legal Care Home Name</Label>
        <Input
          placeholder="e.g. Willow Creek Manor"
          {...register("name")}
        />
        {errors.name && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.name.message}
          </Text>
        )}
      </div>
      <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
        <Label required>Subdomain Slug</Label>
        <div className="relative">
          <Input
            placeholder="willow-creek"
            {...register("subdomain")}
            className="pr-32 font-mono"
          />
          <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400 pointer-events-none">
            .cantracare.com
          </span>
        </div>
        {errors.subdomain && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.subdomain.message}
          </Text>
        )}
      </div>
      <div className="space-y-1.5 md:col-span-2 [&_[data-slot=input-error]]:hidden">
        <Label>CQC Registration Number (Optional)</Label>
        <Input
          placeholder="e.g. 1-12345678"
          {...register("cqcNumber")}
        />
        {errors.cqcNumber && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.cqcNumber.message}
          </Text>
        )}
      </div>
    </div>
  );
}
