"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Text,
} from "@repo/ui/components/ui";
import type {
  CreatePropertyWithRoomsDTO,
  PropertyRoomDraftDTO,
  UpdatePropertyDTO,
} from "@repo/schema";
import type { PropertyItem, SchemeItem } from "../../../../../../../lib/types/facility";
import { useGetStaffQuery } from "../../../../../../../lib/queries/staff/useGetStaffQuery";
import {
  AddPropertyRoomsSection,
  TagMultiSelect,
  DEFAULT_FACILITY_OPTIONS,
  DEFAULT_ACCESSIBILITY_OPTIONS,
} from "./AddPropertyRoomsSection";
import { AddPropertyFormFields } from "./AddPropertyFormFields";

interface AddPropertyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schemes: SchemeItem[];
  initialData?: PropertyItem | null;
  onCreate: (payload: CreatePropertyWithRoomsDTO) => Promise<unknown>;
  onUpdate?: (id: string, payload: UpdatePropertyDTO) => Promise<unknown>;
  isSubmitting?: boolean;
}

function buildInitialRooms(count: number, unitConfig: string): PropertyRoomDraftDTO[] {
  const prefix = unitConfig.toLowerCase().includes("flat") ? "Flat" : "Room";
  return Array.from({ length: Math.max(1, count) }, (_, i) => ({
    roomNumber: `${prefix} ${i + 1}`,
    name: `${prefix} ${i + 1}`,
    type: "Single",
    floor: i < 2 ? "Ground floor" : "First floor",
    weeklyRent: 158.0,
    isAccessible: i === 0,
    bedsCount: 1,
  }));
}

export function AddPropertyModal({
  isOpen,
  onOpenChange,
  schemes,
  initialData,
  onCreate,
  onUpdate,
  isSubmitting,
}: AddPropertyModalProps) {
  const isEdit = Boolean(initialData);
  const { data: staffList = [] } = useGetStaffQuery({ enabled: isOpen });

  const [name, setName] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [schemeId, setSchemeId] = useState<string>("none");
  const [propertyType, setPropertyType] = useState("Self-contained flats");
  const [streetAddress, setStreetAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [coreChargePerWeek, setCoreChargePerWeek] = useState("198");
  const [propertyManagerId, setPropertyManagerId] = useState<string>("none");
  const [status, setStatus] = useState("Active");
  const [totalCapacity, setTotalCapacity] = useState<number>(4);
  const [facilities, setFacilities] = useState<string[]>([
    "Communal Lounge",
    "Garden / Courtyard",
  ]);
  const [featuresAndAccessibility, setFeaturesAndAccessibility] = useState<string[]>([
    "Ground Floor Access",
  ]);
  const [rooms, setRooms] = useState<PropertyRoomDraftDTO[]>(() =>
    buildInitialRooms(4, "Self-contained flats"),
  );
  const [nameError, setNameError] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) return;
    setNameError(undefined);
    if (initialData) {
      const pd = initialData.parsedPropertyDetails ?? {};
      setName(initialData.name || "");
      setReferenceId(pd.referenceId || initialData.code || "");
      setSchemeId(initialData.schemeId || "none");
      setPropertyType(pd.propertyType || pd.unitConfiguration || "Self-contained flats");
      setStreetAddress(pd.streetAddress || "");
      setPostcode(pd.postcode || "");
      setLandlordName(
        pd.landlordDetails?.name || initialData.scheme?.housingPartner || "",
      );
      setLandlordPhone(pd.landlordDetails?.phone || "");
      setCoreChargePerWeek(
        pd.landlordDetails?.coreChargePerWeek !== undefined
          ? String(pd.landlordDetails.coreChargePerWeek)
          : "198",
      );
      setPropertyManagerId(pd.propertyManagerId || "none");
      setStatus(initialData.status || "Active");
      setTotalCapacity(pd.totalCapacity || initialData.totalRooms || 4);
      setFacilities(pd.facilities ?? []);
      setFeaturesAndAccessibility(pd.featuresAndAccessibility ?? []);
    } else {
      setName("");
      setReferenceId(`PROP-${Math.floor(1000 + Math.random() * 9000)}`);
      setSchemeId(schemes[0]?.id || "none");
      setPropertyType("Self-contained flats");
      setStreetAddress("");
      setPostcode("");
      setLandlordName("");
      setLandlordPhone("");
      setCoreChargePerWeek("198");
      setPropertyManagerId("none");
      setStatus("Active");
      setTotalCapacity(4);
      setFacilities(["Communal Lounge", "Garden / Courtyard"]);
      setFeaturesAndAccessibility(["Ground Floor Access"]);
      setRooms(buildInitialRooms(4, "Self-contained flats"));
    }
  }, [isOpen, initialData, schemes]);

  const handleCapacityChange = (nextCap: number) => {
    const bounded = Math.max(1, Math.min(30, nextCap));
    setTotalCapacity(bounded);
    if (!isEdit) {
      const prefix = propertyType.toLowerCase().includes("flat") ? "Flat" : "Room";
      if (bounded > rooms.length) {
        const extra = Array.from({ length: bounded - rooms.length }, (_, idx) => {
          const num = rooms.length + idx + 1;
          return {
            roomNumber: `${prefix} ${num}`,
            name: `${prefix} ${num}`,
            type: "Single",
            floor: num <= 2 ? "Ground floor" : "First floor",
            weeklyRent: 158.0,
            isAccessible: false,
            bedsCount: 1,
          };
        });
        setRooms([...rooms, ...extra]);
      } else if (bounded < rooms.length) {
        setRooms(rooms.slice(0, bounded));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Property name is required");
      return;
    }

    const selectedManager = staffList.find((s) => s.id === propertyManagerId);
    const propertyDetails = {
      referenceId: referenceId.trim() || undefined,
      propertyType,
      unitConfiguration: propertyType,
      streetAddress: streetAddress.trim() || undefined,
      postcode: postcode.trim() || undefined,
      totalCapacity: isEdit ? totalCapacity : rooms.reduce((acc, r) => acc + (r.bedsCount || 1), 0),
      landlordDetails: {
        name: landlordName.trim() || undefined,
        phone: landlordPhone.trim() || undefined,
        coreChargePerWeek: coreChargePerWeek ? Number(coreChargePerWeek) : undefined,
      },
      propertyManagerId: propertyManagerId !== "none" ? propertyManagerId : null,
      propertyManagerName:
        selectedManager?.fullName || initialData?.primaryContact || null,
      facilities,
      featuresAndAccessibility,
    };

    try {
      if (isEdit && initialData && onUpdate) {
        await onUpdate(initialData.id, {
          name: name.trim(),
          code: referenceId.trim() || undefined,
          schemeId: schemeId !== "none" ? schemeId : null,
          primaryContact: selectedManager?.fullName || undefined,
          status,
          propertyDetails,
        });
      } else {
        await onCreate({
          name: name.trim(),
          code: referenceId.trim() || undefined,
          schemeId: schemeId !== "none" ? schemeId : null,
          primaryContact: selectedManager?.fullName || undefined,
          status,
          propertyDetails,
          rooms,
        });
      }
      onOpenChange(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Failed to save property");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="3xl" className="p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Property" : "Add Property"}
            </DialogTitle>
            <Text size="sm" variant="muted">
              Configure a supported living home, link it to a scheme, and set up its
              tenancy rooms, beds, and landlord details.
            </Text>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <AddPropertyFormFields
              name={name}
              onNameChange={(val) => {
                setName(val);
                setNameError(undefined);
              }}
              nameError={nameError}
              referenceId={referenceId}
              onReferenceIdChange={setReferenceId}
              schemeId={schemeId}
              onSchemeIdChange={setSchemeId}
              schemes={schemes}
              propertyType={propertyType}
              onPropertyTypeChange={setPropertyType}
              streetAddress={streetAddress}
              onStreetAddressChange={setStreetAddress}
              postcode={postcode}
              onPostcodeChange={setPostcode}
              totalCapacity={totalCapacity}
              onCapacityChange={handleCapacityChange}
              landlordName={landlordName}
              onLandlordNameChange={setLandlordName}
              landlordPhone={landlordPhone}
              onLandlordPhoneChange={setLandlordPhone}
              coreChargePerWeek={coreChargePerWeek}
              onCoreChargePerWeekChange={setCoreChargePerWeek}
              propertyManagerId={propertyManagerId}
              onPropertyManagerIdChange={setPropertyManagerId}
              staffList={staffList}
              status={status}
              onStatusChange={setStatus}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <TagMultiSelect
                label="Facilities"
                presetOptions={DEFAULT_FACILITY_OPTIONS}
                selected={facilities}
                onChange={setFacilities}
                customPlaceholder="Add custom facility..."
              />
              <TagMultiSelect
                label="Features & Accessibility"
                presetOptions={DEFAULT_ACCESSIBILITY_OPTIONS}
                selected={featuresAndAccessibility}
                onChange={setFeaturesAndAccessibility}
                customPlaceholder="Add custom accessibility feature..."
              />
            </div>

            {!isEdit && (
              <AddPropertyRoomsSection
                rooms={rooms}
                onChangeRooms={(next) => {
                  setRooms(next);
                  setTotalCapacity(next.length);
                }}
              />
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEdit
                    ? "Save Property"
                    : "Create property"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
