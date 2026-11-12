"use client";

import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { type UpdateTenantDTO } from "@repo/schema";
import {
  Card,
  Text,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";

interface GeneralInfoFieldsProps {
  register: UseFormRegister<UpdateTenantDTO>;
  errors: FieldErrors<UpdateTenantDTO>;
  careHomeType: string;
  setCareHomeType: (val: string) => void;
  registeredProvider: string;
  setRegisteredProvider: (val: string) => void;
  establishedDate: string;
  setEstablishedDate: (val: string) => void;
  website: string;
  setWebsite: (val: string) => void;
}

export function GeneralInfoFields({
  register,
  errors,
  careHomeType,
  setCareHomeType,
  registeredProvider,
  setRegisteredProvider,
  establishedDate,
  setEstablishedDate,
  website,
  setWebsite,
}: GeneralInfoFieldsProps) {
  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <Text as="h3" size="md" weight="semibold" className="text-slate-900">
            General Information
          </Text>
          <Text size="md" variant="muted" className="text-slate-500">
            Supported living identity, registration, and organisational details
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <Label required htmlFor="name">
            Supported Living Service Name
          </Label>
          <Input
            id="name"
            placeholder="e.g. Care & Love Haven"
            {...register("name")}
            errorMessage={errors.name?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cqcNumber">
            CQC Registration Number
          </Label>
          <Input
            id="cqcNumber"
            placeholder="e.g. 0000016857"
            {...register("cqcNumber")}
            errorMessage={errors.cqcNumber?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>
            Supported Living Service Type
          </Label>
          <Select value={careHomeType} onValueChange={setCareHomeType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Supported Living">Supported Living</SelectItem>
              <SelectItem value="Residential Care Home">Supported Living</SelectItem>
              <SelectItem value="Nursing Home">Nursing Home</SelectItem>
              <SelectItem value="Dementia Care">Dementia Care</SelectItem>
              <SelectItem value="Dual Registered (Nursing & Residential)">
                Dual Registered (Nursing & Residential)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="registeredProvider">
            Registered Provider
          </Label>
          <Input
            id="registeredProvider"
            value={registeredProvider}
            onChange={(e) => setRegisteredProvider(e.target.value)}
            placeholder="e.g. Care & Love Services Ltd."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="establishedDate">
            Established Date
          </Label>
          <Input
            id="establishedDate"
            value={establishedDate}
            onChange={(e) => setEstablishedDate(e.target.value)}
            placeholder="e.g. 15 Jan 2018"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="website">
            Website
          </Label>
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="e.g. www.careandlovehaven.com"
          />
        </div>
      </div>
    </Card>
  );
}
