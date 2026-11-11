"use client";

import React from "react";
import {
  type UseFormRegister,
  type FieldErrors,
  type Control,
  Controller,
} from "react-hook-form";
import { type CreateEnquiryStage1DTO } from "@repo/schema";
import {
  Button,
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
import { ArrowRight } from "lucide-react";
import { RELATIONSHIPS, LOCATIONS, CATEGORIES } from "../../types";

interface WizardStep1Props {
  register: UseFormRegister<CreateEnquiryStage1DTO>;
  control: Control<CreateEnquiryStage1DTO>;
  errors?: FieldErrors<CreateEnquiryStage1DTO>;
  onNext: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WizardStep1({
  register,
  control,
  errors,
  onNext,
  onSaveDraft,
  onCancel,
  isLoading,
}: WizardStep1Props) {
  return (
    <div className="space-y-4 pt-1">
      {/* Enquirer Contact Details Section */}
      <Card className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-none">
        <Text size="md" weight="semibold" className="text-slate-900 tracking-wider">
          Enquirer Contact Details (Person Contacting the Care Home)
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label required htmlFor="enquirerName">
              Full Name
            </Label>
            <Input
              id="enquirerName"
              placeholder="e.g. Eleanor Vance"
              {...register("enquirerName")}
              errorMessage={errors?.enquirerName?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label required>
              Relationship to Resident
            </Label>
            <Controller
              name="enquirerRelationship"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger className="h-9 text-md bg-white border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {RELATIONSHIPS.map((rel) => (
                      <SelectItem key={rel} value={rel} className="text-md">
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="enquirerPhone">
              Phone Number
            </Label>
            <Input
              id="enquirerPhone"
              placeholder="e.g. +44 7700 900888"
              {...register("enquirerPhone")}
              errorMessage={errors?.enquirerPhone?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enquirerEmail">Email Address</Label>
            <Input
              id="enquirerEmail"
              type="email"
              placeholder="e.g. eleanor@example.com"
              {...register("enquirerEmail")}
              errorMessage={errors?.enquirerEmail?.message}
            />
          </div>
        </div>
      </Card>

      {/* Prospective Resident Details Section */}
      <Card className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-none">
        <Text size="md" weight="semibold" className="text-slate-900 tracking-wider">
          Prospective Resident Details
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label required htmlFor="firstName">
              First Name
            </Label>
            <Input
              id="firstName"
              placeholder="e.g. Robert"
              {...register("firstName")}
              errorMessage={errors?.firstName?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="lastName">
              Last Name
            </Label>
            <Input
              id="lastName"
              placeholder="e.g. Vance"
              {...register("lastName")}
              errorMessage={errors?.lastName?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label required>
              Current Location
            </Label>
            <Controller
              name="currentLocation"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger className="h-9 text-md bg-white border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc} className="text-md">
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label required>
              Care Category Requested
            </Label>
            <Controller
              name="careCategory"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger className="h-9 text-md bg-white border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-md">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-10 px-4 rounded-xl cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          disabled={isLoading}
          className="h-10 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 cursor-pointer"
        >
          Save Draft Lead
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={isLoading}
          className="h-10 px-5 rounded-xl flex items-center gap-2 cursor-pointer"
        >
          Next: Needs Assessment <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
