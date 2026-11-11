"use client";

import React from "react";
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { CreateEnquiryStage1DTO } from "@repo/schema";
import {
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { RELATIONSHIPS, LOCATIONS, CATEGORIES } from "../types";

interface FormSectionProps {
  register: UseFormRegister<CreateEnquiryStage1DTO>;
  errors: FieldErrors<CreateEnquiryStage1DTO>;
  watch: UseFormWatch<CreateEnquiryStage1DTO>;
  setValue: UseFormSetValue<CreateEnquiryStage1DTO>;
}

export function EnquirerContactSection({ register, errors, watch, setValue }: FormSectionProps) {
  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <Text as="h3" size="sm" weight="semibold" className="text-slate-900">
            Enquirer Contact Details
          </Text>
          <Text size="sm" variant="muted" className="text-slate-500">
            Person contacting the care home on behalf of the resident
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <div className="flex flex-col gap-1.5">
          <Label required htmlFor="enquirerName">
            Full Name
          </Label>
          <Input
            id="enquirerName"
            placeholder="e.g. Eleanor Vance"
            {...register("enquirerName")}
            errorMessage={errors.enquirerName?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required>
            Relationship to Resident
          </Label>
          <Select
            value={watch("enquirerRelationship") || ""}
            onValueChange={(val) =>
              setValue("enquirerRelationship", val, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((rel) => (
                <SelectItem key={rel} value={rel}>
                  {rel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.enquirerRelationship && (
            <Text variant="error" size="sm" className="mt-1">
              {String(errors.enquirerRelationship.message)}
            </Text>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="enquirerPhone" required>
            Phone Number
          </Label>
          <Input
            id="enquirerPhone"
            placeholder="e.g. +44 7700 900888"
            {...register("enquirerPhone")}
            errorMessage={errors.enquirerPhone?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="enquirerEmail">
            Email Address
          </Label>
          <Input
            id="enquirerEmail"
            type="email"
            placeholder="e.g. eleanor@example.com"
            {...register("enquirerEmail")}
            errorMessage={errors.enquirerEmail?.message}
          />
        </div>
      </div>
    </Card>
  );
}

export function ProspectiveResidentSection({ register, errors, watch, setValue }: FormSectionProps) {
  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <Text as="h3" size="sm" weight="semibold" className="text-slate-900">
            Prospective Resident Details
          </Text>
          <Text size="sm" variant="muted" className="text-slate-500">
            Core background information for pre-admission assessment
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName" required>
            First Name
          </Label>
          <Input
            id="firstName"
            placeholder="e.g. Robert"
            {...register("firstName")}
            errorMessage={errors.firstName?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="middleName">
            Middle Name
          </Label>
          <Input
            id="middleName"
            placeholder="e.g. James"
            {...register("middleName")}
            errorMessage={errors.middleName?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName" required>
            Last Name
          </Label>
          <Input
            id="lastName"
            placeholder="e.g. Vance"
            {...register("lastName")}
            errorMessage={errors.lastName?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <div className="flex flex-col gap-1.5">
          <Label required>
            Current Location
          </Label>
          <Select
            value={watch("currentLocation") || ""}
            onValueChange={(val) =>
              setValue("currentLocation", val, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currentLocation && (
            <Text variant="error" size="sm" className="mt-1">
              {String(errors.currentLocation.message)}
            </Text>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required>
            Care Category Requested
          </Label>
          <Select
            value={watch("careCategory") || ""}
            onValueChange={(val) =>
              setValue("careCategory", val, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.careCategory && (
            <Text variant="error" size="sm" className="mt-1">
              {String(errors.careCategory.message)}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
}

