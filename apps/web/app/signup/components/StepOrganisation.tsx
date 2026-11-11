"use client";

import React from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { PublicOnboardingDTO } from "@repo/schema";
import { Input, Label } from "@repo/ui/components/ui";

interface StepOrganisationProps {
  register: UseFormRegister<PublicOnboardingDTO>;
  errors: FieldErrors<PublicOnboardingDTO>;
}

export function StepOrganisation({ register, errors }: StepOrganisationProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
        {/* Care Home Name */}
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="org-name" required>
            Care Home Name
          </Label>
          <Input
            id="org-name"
            type="text"
            placeholder="Enter your care home name"
            autoComplete="organization"
            errorMessage={errors.name?.message}
            {...register("name")}
          />
        </div>

        {/* CQC Number */}
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="cqc-number">
            CQC Number (Optional)
          </Label>
          <Input
            id="cqc-number"
            type="text"
            placeholder="e.g. 1-12345678"
            errorMessage={errors.cqcNumber?.message}
            {...register("cqcNumber")}
          />
        </div>

        {/* CQC Provider ID */}
        <div className="space-y-1.5">
          <Label htmlFor="cqc-provider-id">
            CQC Provider ID (Optional)
          </Label>
          <Input
            id="cqc-provider-id"
            type="text"
            placeholder="e.g. 1-12345678"
            errorMessage={errors.cqcProviderId?.message}
            {...register("cqcProviderId")}
          />
        </div>

        {/* CQC Location ID */}
        <div className="space-y-1.5">
          <Label htmlFor="cqc-location-id">
            CQC Location ID (Optional)
          </Label>
          <Input
            id="cqc-location-id"
            type="text"
            placeholder="e.g. 1-98765432"
            errorMessage={errors.cqcLocationId?.message}
            {...register("cqcLocationId")}
          />
        </div>

        {/* Address Line 1 */}
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="address-1" required>
            Address
          </Label>
          <Input
            id="address-1"
            type="text"
            placeholder="Street address"
            autoComplete="address-line1"
            errorMessage={errors.addressLine1?.message}
            {...register("addressLine1")}
          />
        </div>

        {/* Address Line 2 */}
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="address-2">
            Address Line 2 (Optional)
          </Label>
          <Input
            id="address-2"
            type="text"
            placeholder="e.g. Suite 4, Floor 2"
            autoComplete="address-line2"
            errorMessage={errors.addressLine2?.message}
            {...register("addressLine2")}
          />
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <Label htmlFor="city" required>
            Town / City
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="e.g. London"
            autoComplete="address-level2"
            errorMessage={errors.city?.message}
            {...register("city")}
          />
        </div>

        {/* Postcode */}
        <div className="space-y-1.5">
          <Label htmlFor="postcode" required>
            Postcode
          </Label>
          <Input
            id="postcode"
            type="text"
            placeholder="e.g. SW1A 1AA"
            autoComplete="postal-code"
            errorMessage={errors.postcode?.message}
            {...register("postcode")}
          />
        </div>
      </div>
    </div>
  );
}
