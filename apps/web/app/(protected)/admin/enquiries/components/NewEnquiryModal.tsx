"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateEnquiryStage1Schema, type CreateEnquiryStage1DTO } from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { useCreateEnquiryMutation } from "../../../../../lib/queries/enquiries";
import { RELATIONSHIPS, LOCATIONS, CATEGORIES } from "../types";

interface NewEnquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewEnquiryModal({ open, onOpenChange }: NewEnquiryModalProps) {
  const createMutation = useCreateEnquiryMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateEnquiryStage1DTO>({
    resolver: zodResolver(CreateEnquiryStage1Schema),
    defaultValues: {
      enquirerName: "",
      enquirerRelationship: "",
      enquirerPhone: "",
      enquirerEmail: "",
      firstName: "",
      lastName: "",
      currentLocation: "",
      careCategory: "",
    },
  });

  const onSubmit = (data: CreateEnquiryStage1DTO) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
            Create New Enquiry
          </DialogTitle>
          <DialogDescription className="text-md text-slate-500 mt-1">
            Capture initial lead information from family or healthcare referrer (Stage 1).
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* Section 1: Enquirer Details */}
          <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <Text size="sm" weight="semibold" className="text-slate-900 tracking-wider">
              Enquirer Details (The Person Calling)
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label required htmlFor="enquirerName">Full Name</Label>
                <Input
                  id="enquirerName"
                  placeholder="e.g. Sarah Jenkins"
                  {...register("enquirerName")}
                  errorMessage={errors.enquirerName?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label required>Relationship</Label>
                <Controller
                  name="enquirerRelationship"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-md bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
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
                <Label required htmlFor="enquirerPhone">Phone Number</Label>
                <Input
                  id="enquirerPhone"
                  placeholder="e.g. +44 7700 900077"
                  {...register("enquirerPhone")}
                  errorMessage={errors.enquirerPhone?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enquirerEmail">Email (Optional)</Label>
                <Input
                  id="enquirerEmail"
                  type="email"
                  placeholder="e.g. sarah@example.com"
                  {...register("enquirerEmail")}
                  errorMessage={errors.enquirerEmail?.message}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Prospective Resident Details */}
          <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <Text size="sm" weight="semibold" className="text-slate-900 tracking-wider">
              Prospective Resident Details (The Person Needing Care)
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label required htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="e.g. Eleanor"
                  {...register("firstName")}
                  errorMessage={errors.firstName?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label required htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Jenkins"
                  {...register("lastName")}
                  errorMessage={errors.lastName?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label required>Current Location</Label>
                <Controller
                  name="currentLocation"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-md bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
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
                <Label required>Care Category Requested</Label>
                <Controller
                  name="careCategory"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-md bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
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
          </div>

          <DialogFooter className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
              className="h-9 px-5 rounded-xl cursor-pointer font-medium"
            >
              {createMutation.isPending ? "Saving..." : "Save as Enquiry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
