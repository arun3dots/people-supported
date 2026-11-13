"use client";

import React from "react";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import type { SchemeItem } from "../../../../../../../lib/types/facility";

export const PROPERTY_TYPES = [
  "Self-contained flats",
  "Cluster flats",
  "Shared house",
  "Bungalow",
  "Supported living apartments",
];

interface StaffOption {
  id: string;
  fullName: string;
}

interface AddPropertyFormFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  nameError?: string;
  referenceId: string;
  onReferenceIdChange: (value: string) => void;
  referenceIdError?: string;
  schemeId: string;
  onSchemeIdChange: (value: string) => void;
  schemes: SchemeItem[];
  propertyType: string;
  onPropertyTypeChange: (value: string) => void;
  streetAddress: string;
  onStreetAddressChange: (value: string) => void;
  postcode: string;
  onPostcodeChange: (value: string) => void;
  totalCapacity: string;
  onCapacityChange: (value: string) => void;
  landlordName: string;
  onLandlordNameChange: (value: string) => void;
  landlordPhone: string;
  onLandlordPhoneChange: (value: string) => void;
  coreChargePerWeek: string;
  onCoreChargePerWeekChange: (value: string) => void;
  propertyManagerId: string;
  onPropertyManagerIdChange: (value: string) => void;
  staffList: StaffOption[];
  status: string;
  onStatusChange: (value: string) => void;
}

export function AddPropertyFormFields({
  name,
  onNameChange,
  nameError,
  referenceId,
  onReferenceIdChange,
  referenceIdError,
  schemeId,
  onSchemeIdChange,
  schemes,
  propertyType,
  onPropertyTypeChange,
  streetAddress,
  onStreetAddressChange,
  postcode,
  onPostcodeChange,
  totalCapacity,
  onCapacityChange,
  landlordName,
  onLandlordNameChange,
  landlordPhone,
  onLandlordPhoneChange,
  coreChargePerWeek,
  onCoreChargePerWeekChange,
  propertyManagerId,
  onPropertyManagerIdChange,
  staffList,
  status,
  onStatusChange,
}: AddPropertyFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
      <div className="space-y-1">
        <Label required className="text-md font-medium text-slate-700">
          Property name
        </Label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Oak House"
          errorMessage={nameError}
        />
      </div>

      <div className="space-y-1">
        <Label required className="text-md font-medium text-slate-700">
          Property reference ID
        </Label>
        <Input
          value={referenceId}
          onChange={(e) => onReferenceIdChange(e.target.value)}
          placeholder="e.g. PROP-001"
          errorMessage={referenceIdError}
          disabled
          className="bg-slate-50 text-slate-500 cursor-not-allowed"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-md font-medium text-slate-700">
          Supported Living Scheme
        </Label>
        <Select value={schemeId} onValueChange={onSchemeIdChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select scheme" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="none">Unassigned / Standalone</SelectItem>
            {schemes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label required className="text-md font-medium text-slate-700">
          Property type / Unit configuration
        </Label>
        <Select value={propertyType} onValueChange={onPropertyTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select unit configuration" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {PROPERTY_TYPES.map((pt) => (
              <SelectItem key={pt} value={pt}>
                {pt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-md font-medium text-slate-700">
          Street address &amp; town
        </Label>
        <Input
          value={streetAddress}
          onChange={(e) => onStreetAddressChange(e.target.value)}
          placeholder="e.g. 14 Oakwood Avenue, York"
        />
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <div className="space-y-1">
          <Label className="text-md font-medium text-slate-700">Postcode</Label>
          <Input
            value={postcode}
            onChange={(e) => onPostcodeChange(e.target.value)}
            placeholder="YO31 7PA"
          />
        </div>
        <div className="space-y-1">
          <Label required className="text-md font-medium text-slate-700">
            Total Capacity (Units)
          </Label>
          <Input
            type="number"
            min={1}
            max={30}
            value={totalCapacity}
            onChange={(e) => onCapacityChange(e.target.value)}
            placeholder="e.g. 4"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-md font-medium text-slate-700">
          Landlord / Housing Partner
        </Label>
        <Input
          value={landlordName}
          onChange={(e) => onLandlordNameChange(e.target.value)}
          placeholder="e.g. Yorkshire Housing Association"
        />
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <div className="space-y-1">
          <Label className="text-md font-medium text-slate-700">
            Landlord Contact
          </Label>
          <Input
            value={landlordPhone}
            onChange={(e) => onLandlordPhoneChange(e.target.value)}
            placeholder="01904 555123"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-md font-medium text-slate-700">
            Core Charge (£/wk)
          </Label>
          <Input
            type="number"
            min={0}
            value={coreChargePerWeek}
            onChange={(e) => onCoreChargePerWeekChange(e.target.value)}
            placeholder="198"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-md font-medium text-slate-700">
          Property Manager
        </Label>
        <Select
          value={propertyManagerId}
          onValueChange={onPropertyManagerIdChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="none">Unassigned</SelectItem>
            {staffList.map((st) => (
              <SelectItem key={st.id} value={st.id}>
                {st.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label required className="text-md font-medium text-slate-700">
          Status
        </Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Void">Void</SelectItem>
            <SelectItem value="Maintenance">Under maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
