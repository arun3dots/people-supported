"use client";

import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { type UpdateTenantDTO } from "@repo/schema";
import { Card, Text, Input, Label } from "@repo/ui/components/ui";

interface PrimaryContactFieldsProps {
  register: UseFormRegister<UpdateTenantDTO>;
  errors: FieldErrors<UpdateTenantDTO>;
  jobTitle: string;
  setJobTitle: (val: string) => void;
}

export function PrimaryContactFields({
  register,
  errors,
  jobTitle,
  setJobTitle,
}: PrimaryContactFieldsProps) {
  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <Text as="h3" size="md" weight="semibold" className="text-slate-900">
            Primary Contact Details
          </Text>
          <Text size="md" variant="muted" className="text-slate-500">
            Person managing administrative communications and notifications
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <Label required htmlFor="primaryContactName">
            Contact Name
          </Label>
          <Input
            id="primaryContactName"
            placeholder="e.g. Eleanor Vance"
            {...register("primaryContactName")}
            errorMessage={errors.primaryContactName?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactJobTitle">
            Job Title
          </Label>
          <Input
            id="contactJobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Administrator"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="primaryContactPhone">
            Contact Phone
          </Label>
          <Input
            id="primaryContactPhone"
            type="tel"
            placeholder="e.g. +44 7700 900888"
            {...register("primaryContactPhone")}
            errorMessage={errors.primaryContactPhone?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="primaryContactEmail">
            Contact Email
          </Label>
          <Input
            id="primaryContactEmail"
            type="email"
            placeholder="e.g. eleanor@example.com"
            {...register("primaryContactEmail")}
            errorMessage={errors.primaryContactEmail?.message}
          />
        </div>
      </div>
    </Card>
  );
}
