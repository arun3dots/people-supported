"use client";

import { Input, Label, Text } from "@repo/ui/components/ui";
import { Mail, Phone } from "lucide-react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CreateTenantDTO } from "@repo/schema";

interface StepProps {
  register: UseFormRegister<CreateTenantDTO>;
  errors: FieldErrors<CreateTenantDTO>;
}

export function StepContact({ register, errors }: StepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-1.5 md:col-span-2 [&_[data-slot=input-error]]:hidden">
        <Label required htmlFor="primaryContactName">Administrator Full Name</Label>
        <Input
          id="primaryContactName"
          autoComplete="name"
          placeholder="Manager Name"
          {...register("primaryContactName")}
        />
        {errors.primaryContactName && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.primaryContactName.message}
          </Text>
        )}
      </div>
      <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
        <Label required htmlFor="primaryContactEmail">Email Address</Label>
        <div className="relative">
          <Input
            id="primaryContactEmail"
            type="email"
            autoComplete="email"
            placeholder="admin@home.co.uk"
            {...register("primaryContactEmail")}
            className="pl-10"
          />
          <Mail className="absolute left-3.5 top-3 size-4 text-slate-400" />
        </div>
        {errors.primaryContactEmail && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.primaryContactEmail.message}
          </Text>
        )}
      </div>
      <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
        <Label required htmlFor="primaryContactPhone">Phone Number</Label>
        <div className="relative">
          <Input
            id="primaryContactPhone"
            type="tel"
            autoComplete="tel"
            placeholder="+44 20 1234 5678"
            {...register("primaryContactPhone")}
            className="pl-10"
          />
          <Phone className="absolute left-3.5 top-3 size-4 text-slate-400" />
        </div>
        {errors.primaryContactPhone && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.primaryContactPhone.message}
          </Text>
        )}
      </div>
      <div className="space-y-1.5 md:col-span-2 [&_[data-slot=input-error]]:hidden">
        <Label required htmlFor="password">Administrator Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <Text size="xs" className="text-red-500 font-medium mt-1">
            {errors.password.message}
          </Text>
        )}
      </div>
    </div>
  );
}
