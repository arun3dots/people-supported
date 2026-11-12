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
  Textarea,
} from "@repo/ui/components/ui";

interface StaffOption {
  id: string;
  fullName: string;
}

interface AddSchemeFormFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  nameError?: string;
  referenceId: string;
  onReferenceIdChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  commissioningLa: string;
  onCommissioningLaChange: (value: string) => void;
  housingPartner: string;
  onHousingPartnerChange: (value: string) => void;
  schemeManagerId: string;
  onSchemeManagerIdChange: (value: string) => void;
  staffList: StaffOption[];
  commissionedHours: string;
  onCommissionedHoursChange: (value: string) => void;
  targetOccupancy: string;
  onTargetOccupancyChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
}

export function AddSchemeFormFields({
  name,
  onNameChange,
  nameError,
  referenceId,
  onReferenceIdChange,
  location,
  onLocationChange,
  commissioningLa,
  onCommissioningLaChange,
  housingPartner,
  onHousingPartnerChange,
  schemeManagerId,
  onSchemeManagerIdChange,
  staffList,
  commissionedHours,
  onCommissionedHoursChange,
  targetOccupancy,
  onTargetOccupancyChange,
  status,
  onStatusChange,
  description,
  onDescriptionChange,
}: AddSchemeFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        <div className="space-y-1">
          <Label required className="text-md font-medium text-slate-700">
            Scheme Name
          </Label>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. North Yorkshire Supported Living"
            errorMessage={nameError}
          />
        </div>

        <div className="space-y-1">
          <Label required className="text-md font-medium text-slate-700">
            Reference ID
          </Label>
          <Input
            value={referenceId}
            onChange={(e) => onReferenceIdChange(e.target.value)}
            placeholder="e.g. SCH-1001"
            disabled
            className="bg-slate-50 text-slate-500 cursor-not-allowed"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-md font-medium text-slate-700">Location</Label>
          <Input
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="e.g. York & Harrogate"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-md font-medium text-slate-700">
            Commissioning LA
          </Label>
          <Input
            value={commissioningLa}
            onChange={(e) => onCommissioningLaChange(e.target.value)}
            placeholder="e.g. North Yorkshire Council"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-md font-medium text-slate-700">
            Housing Partner
          </Label>
          <Input
            value={housingPartner}
            onChange={(e) => onHousingPartnerChange(e.target.value)}
            placeholder="e.g. Yorkshire Housing Association"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-md font-medium text-slate-700">
            Scheme Manager
          </Label>
          <Select
            value={schemeManagerId}
            onValueChange={onSchemeManagerIdChange}
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

        <div className="grid grid-cols-2 gap-x-3">
          <div className="space-y-1">
            <Label className="text-md font-medium text-slate-700">
              Commissioned hours (wk)
            </Label>
            <Input
              type="number"
              min={0}
              value={commissionedHours}
              onChange={(e) => onCommissionedHoursChange(e.target.value)}
              placeholder="240"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-md font-medium text-slate-700">
              Target Occupancy (%)
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={targetOccupancy}
              onChange={(e) => onTargetOccupancyChange(e.target.value)}
              placeholder="90"
            />
          </div>
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
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1 [&_[data-slot=input-error]]:hidden">
        <Label className="text-md font-medium text-slate-700">
          Description
        </Label>
        <Textarea
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Brief summary of the supported living scheme..."
        />
      </div>
    </>
  );
}
