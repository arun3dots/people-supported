"use client";

import React from "react";
import {
  Button, Card, Input, Label, Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue, Badge, Text, DatePicker,
} from "@repo/ui/components/ui";
import { format } from "date-fns";
import { Loader2, DoorOpen, Building2, Bed as BedIcon, Layers } from "lucide-react";
import { AdmissionFormData } from "../../types";
import type { SchemeItem, PropertyItem, Room } from "../../../../../../lib/types/facility";
import { useRoomBedSelection } from "./useRoomBedSelection";

interface RoomBedAllocationCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  errors?: Record<string, string>;
}

const ROOM_TYPES = [
  { value: "Single", label: "Single (Private)" },
  { value: "Single Ensuite", label: "Single Ensuite" },
  { value: "Shared", label: "Shared Room" },
  { value: "Specialist / High Dependency", label: "Specialist / High Dependency" },
] as const;

const formatUnitLabel = (num: string, flat: boolean) => {
  const t = num.trim();
  return /^(flat|room|unit)\b/i.test(t) ? t : `${flat ? "Flat" : "Room"} ${t}`;
};

export function RoomBedAllocationCard({
  formData,
  updateFormData,
  errors,
}: RoomBedAllocationCardProps) {
  const {
    schemes,
    filteredProperties,
    filteredRooms,
    selectedSchemeId,
    selectedPropertyId,
    selectedRoomId,
    selectedProperty,
    propertyType,
    isFlat,
    propertyFacilities,
    getRoomStatus,
    propertyLandlord,
    potentialRoommate,
    isLoadingSchemes,
    isLoadingProperties,
    isLoadingRooms,
    isLoading,
    handleSchemeChange,
    handlePropertyChange,
    handleRoomChange,
  } = useRoomBedSelection(formData, updateFormData);

  const availableRoomTypes = isFlat
    ? ROOM_TYPES.filter((rt) => rt.value !== "Shared")
    : ROOM_TYPES;

  const hasCustomRoomType =
    Boolean(formData.roomType) &&
    !availableRoomTypes.some((rt) => rt.value === formData.roomType);

  return (
    <Card variant="surface" className="p-6 lg:p-8">
      <div className="pb-4 border-b border-slate-200/80 flex flex-row items-center justify-between gap-4">
        <div>
          <Text as="h3" size="md" weight="bold">
            Room &amp; Property Allocation
          </Text>
          <Text size="md" weight="regular" variant="subdued">
            Select scheme, property, and room from properties &amp; schemes inventory.
          </Text>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-md text-slate-500">
            <Loader2 className="size-3.5 animate-spin text-emerald-800" />
            <span>Loading properties &amp; schemes...</span>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* 1. Scheme & Property Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label className="flex items-center gap-1">
              <Layers className="size-3.5 text-slate-400" /> Scheme
            </Label>
            <Select
              value={selectedSchemeId}
              onValueChange={handleSchemeChange}
              disabled={isLoadingSchemes}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoadingSchemes ? "Loading schemes..." : "All Schemes"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schemes</SelectItem>
                {schemes.map((s: SchemeItem) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required className="flex items-center gap-1">
              <Building2 className="size-3.5 text-slate-400" /> Property
            </Label>
            <Select
              value={selectedPropertyId}
              onValueChange={handlePropertyChange}
              disabled={isLoadingProperties || filteredProperties.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingProperties
                      ? "Loading properties..."
                      : filteredProperties.length === 0
                        ? "No properties found"
                        : "Select property"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredProperties.map((p: PropertyItem) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {selectedSchemeId === "all" && p.scheme?.name
                      ? ` (${p.scheme.name})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 1b. Accommodation Context Badge */}
        {selectedProperty && (
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <Badge state={isFlat ? "info" : "inactive"} className="font-semibold px-2 py-0.5">
              {isFlat ? "Self-contained Flat (1 Tenant per unit)" : (propertyType || "Community / Shared Living")}
            </Badge>
            {propertyFacilities.length > 0 && (
              <span className="text-slate-600">
                Common Facilities: <strong className="text-slate-700">{propertyFacilities.join(", ")}</strong>
              </span>
            )}
          </div>
        )}

        {/* 2. Room Number & Room Type Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            data-validation-field="roomNumber"
            className="space-y-1.5 [&_[data-slot=input-error]]:hidden"
          >
            <Label required className="flex items-center gap-1">
              <DoorOpen className="size-3.5 text-slate-400" /> {isFlat ? "Flat / Unit Number" : "Room Number"}
            </Label>
            <Select
              value={selectedRoomId}
              onValueChange={handleRoomChange}
              disabled={isLoadingRooms || filteredRooms.length === 0}
            >
              <SelectTrigger className={errors?.roomNumber ? "border-border-error" : ""}>
                <SelectValue
                  placeholder={
                    isLoadingRooms
                      ? "Loading..."
                      : filteredRooms.length === 0
                        ? (isFlat ? "No flats found" : "No rooms found")
                        : "Select"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredRooms.map((r: Room) => {
                  const status = getRoomStatus(r.id);
                  const isBlocked = isFlat && status.isOccupied;
                  return (
                    <SelectItem key={r.id} value={r.id} disabled={isBlocked}>
                      {formatUnitLabel(r.roomNumber, isFlat)} ({r.type || "Single"})
                      {status.isOccupied
                        ? ` - Occupied${status.occupantName ? ` (${status.occupantName})` : ""}`
                        : " - Available"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors?.roomNumber && (
              <p className="text-md text-text-error font-medium leading-tight mt-1">
                {errors.roomNumber}
              </p>
            )}
          </div>

          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label className="flex items-center gap-1">
              <BedIcon className="size-3.5 text-slate-400" /> Room Type
            </Label>
            <Select
              value={formData.roomType || undefined}
              onValueChange={(val) => updateFormData({ roomType: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {hasCustomRoomType && formData.roomType && (
                  <SelectItem value={formData.roomType}>{formData.roomType}</SelectItem>
                )}
                {availableRoomTypes.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 3. Landlord, Move-in & Roommate Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80">
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <div className="flex items-center justify-between min-h-[26px] gap-2">
              <Label htmlFor="room-landlord-input">Landlord / Housing Provider</Label>
              {propertyLandlord && formData.landlord?.trim() !== propertyLandlord && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => updateFormData({ landlord: propertyLandlord })}
                  className="h-auto p-0 text-md font-semibold text-emerald-800 hover:text-emerald-900 hover:underline"
                >
                  Autofill: {propertyLandlord}
                </Button>
              )}
            </div>
            <Input
              id="room-landlord-input"
              type="text"
              placeholder="e.g. Yorkshire Housing Association"
              value={formData.landlord || ""}
              onChange={(e) => updateFormData({ landlord: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <div className="flex items-center min-h-[26px]">
              <Label>Move-in Date &amp; Time</Label>
            </div>
            <DatePicker
              variant="datetime"
              use12Hours={false}
              value={formData.moveInDateTime || ""}
              onChange={(date) =>
                updateFormData({
                  moveInDateTime: date ? format(date, "yyyy-MM-dd'T'HH:mm") : "",
                })
              }
            />
          </div>

          {isFlat ? (
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <div className="flex items-center min-h-[26px]">
                <Label>Roommate</Label>
              </div>
              <Input
                type="text"
                disabled
                value="N/A (Self-contained flat - 1 tenant only)"
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          ) : (
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <div className="flex items-center justify-between min-h-[26px]">
                <Label>Roommate (If Shared)</Label>
                {potentialRoommate && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => updateFormData({ roommate: potentialRoommate })}
                    className="h-auto p-0 text-md font-semibold text-emerald-800 hover:text-emerald-900 hover:underline"
                  >
                    Autofill: {potentialRoommate}
                  </Button>
                )}
              </div>
              <Input
                type="text"
                placeholder='Tenant / roommate name or "N/A"'
                value={formData.roommate || ""}
                onChange={(e) => updateFormData({ roommate: e.target.value })}
              />
            </div>
          )}
        </div>

        {formData.roomNumber && (
          <Card
            variant="secondary"
            className="p-3.5 rounded-xl flex-row items-center justify-between gap-2 border-emerald-200 bg-white shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Badge state="success" className="font-semibold px-2.5 py-0.5 rounded-full">
                {isFlat ? "Flat Selected" : "Room Selected"}
              </Badge>
              <Text size="md" weight="bold" className="text-slate-900">
                {selectedProperty ? `${selectedProperty.name} • ` : ""}
                {formatUnitLabel(formData.roomNumber, isFlat)}
                {formData.roomType ? ` • ${formData.roomType}` : ""}
                {formData.landlord ? ` • Landlord: ${formData.landlord}` : ""}
              </Text>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}
