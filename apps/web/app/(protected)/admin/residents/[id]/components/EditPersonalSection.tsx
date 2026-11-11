"use client";

import React from "react";
import {
  Input,
  Label,
  DateOfBirthPicker,
} from "@repo/ui/components/ui";
import { PhoneInputWithValidation } from "../../../../resident/admit/components/common/PhoneInputWithValidation";
import type { OverviewFormData } from "./ResidentOverviewSchemas";

interface EditPersonalSectionProps {
  formState: OverviewFormData;
  setFormState: React.Dispatch<React.SetStateAction<OverviewFormData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function EditPersonalSection({
  formState,
  setFormState,
  errors,
  setErrors,
}: EditPersonalSectionProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-md">
      <div className="space-y-1">
        <Label required>First Name</Label>
        <Input
          value={formState.firstName}
          onChange={(e) => {
            setFormState((prev) => ({ ...prev, firstName: e.target.value }));
            if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: "" }));
          }}
          placeholder="First Name"
          errorMessage={errors.firstName}
        />
      </div>
      <div className="space-y-1">
        <Label>Middle Name</Label>
        <Input
          value={formState.middleName}
          onChange={(e) => {
            setFormState((prev) => ({ ...prev, middleName: e.target.value }));
            if (errors.middleName) setErrors((prev) => ({ ...prev, middleName: "" }));
          }}
          placeholder="Middle Name"
          errorMessage={errors.middleName}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label required>Last Name</Label>
        <Input
          value={formState.lastName}
          onChange={(e) => {
            setFormState((prev) => ({ ...prev, lastName: e.target.value }));
            if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: "" }));
          }}
          placeholder="Last Name"
          errorMessage={errors.lastName}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label>Address</Label>
        <Input
          value={formState.addressLine1}
          onChange={(e) => setFormState((prev) => ({ ...prev, addressLine1: e.target.value }))}
          placeholder="Address Line 1"
        />
      </div>
      <div className="space-y-1">
        <Label>City</Label>
        <Input
          value={formState.city}
          onChange={(e) => setFormState((prev) => ({ ...prev, city: e.target.value }))}
          placeholder="City"
        />
      </div>
      <div className="space-y-1">
        <Label>Nationality / Country</Label>
        <Input
          value={formState.country}
          onChange={(e) => setFormState((prev) => ({ ...prev, country: e.target.value }))}
          placeholder="Nationality"
        />
      </div>
      <div className="space-y-1">
        <PhoneInputWithValidation
          label="Phone Number"
          value={formState.phoneNumber}
          onChange={(val: string) => {
            setFormState((prev) => ({ ...prev, phoneNumber: val }));
            if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: "" }));
          }}
          placeholder="e.g. +44 7700 900077"
          error={errors.phoneNumber}
        />
      </div>
      <div className="space-y-1">
        <Label>Religion</Label>
        <Input
          value={formState.religion}
          onChange={(e) => setFormState((prev) => ({ ...prev, religion: e.target.value }))}
          placeholder="Religion"
        />
      </div>
      <div className="space-y-1">
        <Label>Email Address</Label>
        <Input
          type="email"
          value={formState.email}
          onChange={(e) => {
            setFormState((prev) => ({ ...prev, email: e.target.value }));
            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
          }}
          placeholder="Email"
          errorMessage={errors.email}
        />
      </div>
      <div className="space-y-1">
        <Label>NHS Number</Label>
        <Input
          value={formState.nhsNumber}
          onChange={(e) => {
            setFormState((prev) => ({ ...prev, nhsNumber: e.target.value }));
            if (errors.nhsNumber) setErrors((prev) => ({ ...prev, nhsNumber: "" }));
          }}
          placeholder="NHS Number"
          errorMessage={errors.nhsNumber}
        />
      </div>
      <div className="space-y-1">
        <Label>Date of Birth</Label>
        <DateOfBirthPicker
          value={formState.dob}
          onChange={(d) => setFormState((prev) => ({ ...prev, dob: d ? d.toISOString().split("T")[0] || "" : "" }))}
          placeholder="Select date of birth"
          errorMessage={errors.dob}
        />
      </div>
      <div className="space-y-1">
        <Label>Preferred Language</Label>
        <Input
          value={formState.preferredLanguage}
          onChange={(e) => setFormState((prev) => ({ ...prev, preferredLanguage: e.target.value }))}
          placeholder="Language"
        />
      </div>
    </div>
  );
}
