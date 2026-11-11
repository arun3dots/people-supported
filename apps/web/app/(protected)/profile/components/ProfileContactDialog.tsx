"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileDTO } from "@repo/schema";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input, Label, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, DatePicker,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { MyProfile } from "../../../../lib/types/profile";
import { useUpdateMyProfileMutation } from "../../../../lib/queries/profile/useMyProfileQueries";
import { useGetDepartmentsQuery } from "../../../../lib/queries/department/useDepartments";

const LANGUAGE_OPTIONS = [
  "English (UK)", "English (US)", "Welsh", "Spanish", "French", "German", "Polish", "Hindi",
  "Punjabi", "Urdu", "Tagalog", "Romanian", "Portuguese", "Italian", "Chinese (Mandarin)", "Arabic"
];

function parseNameParts(fullName?: string) {
  if (!fullName) return { firstName: "", middleName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
  return { firstName, middleName, lastName };
}

interface ProfileContactDialogProps {
  profile: MyProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileContactDialog({
  profile,
  open,
  onOpenChange,
}: ProfileContactDialogProps) {
  const { toast } = useToast();
  const { data: departments, isLoading: isDepartmentsLoading } = useGetDepartmentsQuery();

  const departmentOptions = React.useMemo(() => {
    const list: string[] = [];
    if (departments && Array.isArray(departments)) {
      departments.forEach((d) => {
        if (d.name && !list.includes(d.name)) list.push(d.name);
      });
    }
    if (profile.department && !list.includes(profile.department)) {
      list.push(profile.department);
    }
    return list;
  }, [departments, profile.department]);

  const initialNames = parseNameParts(profile.fullName);

  const defaults: UpdateProfileDTO = {
    firstName: initialNames.firstName,
    middleName: initialNames.middleName,
    lastName: initialNames.lastName,
    fullName: profile.fullName || "",
    email: profile.email || "",
    department: profile.department || "",
    startDate: profile.startDate ? profile.startDate.substring(0, 10) : "",
    preferredLanguage: profile.preferredLanguage || "English (UK)",
    phoneNumber: profile.phoneNumber ?? "",
    addressLine1: profile.addressLine1 ?? "",
    addressLine2: profile.addressLine2 ?? "",
    city: profile.city ?? "",
    postcode: profile.postcode ?? "",
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileDTO>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onTouched",
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      const names = parseNameParts(profile.fullName);
      reset({
        firstName: names.firstName,
        middleName: names.middleName,
        lastName: names.lastName,
        fullName: profile.fullName || "",
        email: profile.email || "",
        department: profile.department || "",
        startDate: profile.startDate ? profile.startDate.substring(0, 10) : "",
        preferredLanguage: profile.preferredLanguage || "English (UK)",
        phoneNumber: profile.phoneNumber ?? "",
        addressLine1: profile.addressLine1 ?? "",
        addressLine2: profile.addressLine2 ?? "",
        city: profile.city ?? "",
        postcode: profile.postcode ?? "",
      });
    }
  }, [profile, open, reset]);

  const mutation = useUpdateMyProfileMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Personal details updated successfully",
      });
      onOpenChange(false);
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update profile",
      }),
  });

  const onSubmit = (data: UpdateProfileDTO) => {
    const constructedFullName =
      [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ").trim() ||
      data.fullName ||
      profile.fullName;

    mutation.mutate({
      ...data,
      fullName: constructedFullName,
      startDate: data.startDate
        ? new Date(`${data.startDate}T12:00:00.000Z`).toISOString()
        : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="font-sans">
        <DialogHeader>
          <DialogTitle>Edit Personal Profile</DialogTitle>
          <DialogDescription className="mt-1">
            Update your personal details, employment information, and contact address.
          </DialogDescription>
        </DialogHeader>

        <form noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 pt-1"
        >
          {/* 1. General Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">General Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input
                  placeholder="First name"
                  {...register("firstName")}
                  errorMessage={errors.firstName?.message}
                  className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Middle Name <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  placeholder="Middle name"
                  {...register("middleName")}
                  errorMessage={errors.middleName?.message}
                  className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input
                  placeholder="Last name"
                  {...register("lastName")}
                  errorMessage={errors.lastName?.message}
                  className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Controller
                  control={control}
                  name="department"
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 text-md h-10 w-full focus-visible:ring-emerald-800">
                        <SelectValue placeholder={isDepartmentsLoading ? "Loading…" : "Select"} />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((deptName) => (
                          <SelectItem key={deptName} value={deptName}>
                            {deptName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(d) =>
                        field.onChange(
                          d
                            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                            : "",
                        )
                      }
                      placeholder="Select start date"
                    />
                  )}
                />
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Preferred Language</Label>
                <Controller
                  control={control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <Select
                      value={field.value || "English (UK)"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 text-md h-10 w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* 2. Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  errorMessage={errors.email?.message}
                  className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="e.g. +44 7700 900888"
                  {...register("phoneNumber")}
                  errorMessage={errors.phoneNumber?.message}
                  className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 h-10"
                />
              </div>
            </div>
          </div>

          {/* 3. Location & Address */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">Address Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Address Line 1</Label>
                <Input
                  placeholder="House number and street"
                  {...register("addressLine1")}
                  errorMessage={errors.addressLine1?.message}
                  className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Address Line 2 <span className="text-md text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  placeholder="Apartment, suite, etc."
                  {...register("addressLine2")}
                  errorMessage={errors.addressLine2?.message}
                  className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>City / Town</Label>
                <Input
                  placeholder="City"
                  {...register("city")}
                  errorMessage={errors.city?.message}
                  className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Postcode</Label>
                <Input
                  placeholder="Postcode"
                  {...register("postcode")}
                  errorMessage={errors.postcode?.message}
                  className="rounded-xl border-slate-200 text-md focus-visible:ring-emerald-800 h-10"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
