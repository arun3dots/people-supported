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
  const selectableSchemes = schemes.filter(
    (s) => s.status === "Active" || (isEdit && s.id === initialData?.schemeId),
  );

  const [name, setName] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [schemeId, setSchemeId] = useState<string>("");
  const [propertyType, setPropertyType] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [coreChargePerWeek, setCoreChargePerWeek] = useState("");
  const [propertyManagerId, setPropertyManagerId] = useState<string>("");
  const [status, setStatus] = useState("");
  const [totalCapacity, setTotalCapacity] = useState<string>("");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [featuresAndAccessibility, setFeaturesAndAccessibility] = useState<string[]>([]);
  const [rooms, setRooms] = useState<PropertyRoomDraftDTO[]>([]);
  const [nameError, setNameError] = useState<string | undefined>();
  const [referenceIdError, setReferenceIdError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) return;
    setNameError(undefined);
    setReferenceIdError(undefined);
    setFormError(undefined);
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
      setTotalCapacity(
        String(
          initialData.roomTenancies?.length ||
            pd.totalCapacity ||
            initialData.totalRooms ||
            1,
        ),
      );
      setFacilities(pd.facilities ?? []);
      setFeaturesAndAccessibility(pd.featuresAndAccessibility ?? []);
      setRooms(
        (initialData.roomTenancies ?? []).map((r) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          name: r.name || r.roomNumber,
          type: r.type || "Single",
          floor: r.floor || "Ground floor",
          weeklyRent: r.weeklyRent ?? 0,
          bedsCount: r.beds?.length || 1,
        })),
      );
    } else {
      setName("");
      setReferenceId(`PROP-${Math.floor(1000 + Math.random() * 9000)}`);
      setSchemeId("");
      setPropertyType("");
      setStreetAddress("");
      setPostcode("");
      setLandlordName("");
      setLandlordPhone("");
      setCoreChargePerWeek("");
      setPropertyManagerId("");
      setStatus("");
      setTotalCapacity("");
      setFacilities([]);
      setFeaturesAndAccessibility([]);
      setRooms([]);
    }
  }, [isOpen, initialData, schemes]);

  const handleCapacityChange = (rawValue: string) => {
    setTotalCapacity(rawValue);
    if (!rawValue.trim()) {
      if (!isEdit) setRooms([]);
      return;
    }
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) return;
    const bounded = Math.max(1, Math.min(30, parsed));
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
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Property name is required");
      return;
    }
    if (trimmedName.length < 2) {
      setNameError("Property name must be at least 2 characters");
      return;
    }
    if (!propertyType) {
      setFormError("Please select a property type / unit configuration");
      return;
    }
    if (!status) {
      setFormError("Please select a status");
      return;
    }
    const parsedCapacity = Number(totalCapacity);
    if (!totalCapacity.trim() || Number.isNaN(parsedCapacity) || parsedCapacity < 1) {
      setFormError("Please enter total capacity (at least 1 unit)");
      return;
    }

    const effectiveRooms =
      rooms.length > 0 ? rooms : buildInitialRooms(parsedCapacity, propertyType);
    const resolvedManagerId =
      propertyManagerId && propertyManagerId !== "none" ? propertyManagerId : null;
    const resolvedSchemeId = schemeId && schemeId !== "none" ? schemeId : null;
    const selectedManager = staffList.find((s) => s.id === resolvedManagerId);
    const propertyDetails = {
      referenceId: referenceId.trim() || undefined,
      propertyType,
      unitConfiguration: propertyType,
      streetAddress: streetAddress.trim() || undefined,
      postcode: postcode.trim() || undefined,
      totalCapacity: isEdit
        ? parsedCapacity
        : effectiveRooms.reduce((acc, r) => acc + (r.bedsCount || 1), 0),
      landlordDetails: {
        name: landlordName.trim() || undefined,
        phone: landlordPhone.trim() || undefined,
        coreChargePerWeek: coreChargePerWeek ? Number(coreChargePerWeek) : undefined,
      },
      propertyManagerId: resolvedManagerId,
      propertyManagerName:
        selectedManager?.fullName || initialData?.primaryContact || null,
      facilities,
      featuresAndAccessibility,
    };

    setFormError(undefined);
    try {
      if (isEdit && initialData && onUpdate) {
        await onUpdate(initialData.id, {
          name: name.trim(),
          code: referenceId.trim() || undefined,
          schemeId: resolvedSchemeId,
          primaryContact: selectedManager?.fullName || undefined,
          status,
          propertyDetails,
          rooms: effectiveRooms,
        });
      } else {
        await onCreate({
          name: name.trim(),
          code: referenceId.trim() || undefined,
          schemeId: resolvedSchemeId,
          primaryContact: selectedManager?.fullName || undefined,
          status,
          propertyDetails,
          rooms: effectiveRooms,
        });
      }
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save property";
      const lower = msg.toLowerCase();
      if (lower.includes("reference id")) {
        setReferenceIdError(msg);
      } else if (lower.includes("already exists") || lower.includes("property name")) {
        setNameError(msg);
      } else {
        setFormError(msg);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        size="3xl"
        className="p-0 max-h-[90vh] flex flex-col overflow-hidden gap-0"
      >
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-7 border-b border-slate-100 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Property" : "Add Property"}
            </DialogTitle>
            <Text size="md" variant="muted">
              Configure a supported living home, link it to a scheme, and set up its
              tenancy rooms, beds, and landlord details.
            </Text>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8 space-y-4">
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
                {formError}
              </div>
            )}
            <AddPropertyFormFields
              name={name}
              onNameChange={(val) => {
                setName(val);
                setNameError(undefined);
              }}
              nameError={nameError}
              referenceId={referenceId}
              onReferenceIdChange={(val) => {
                setReferenceId(val);
                setReferenceIdError(undefined);
              }}
              referenceIdError={referenceIdError}
              schemeId={schemeId}
              onSchemeIdChange={setSchemeId}
              schemes={selectableSchemes}
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

            <AddPropertyRoomsSection
              rooms={rooms}
              onChangeRooms={(next) => {
                setRooms(next);
                setTotalCapacity(next.length > 0 ? String(next.length) : "");
              }}
            />
          </div>

          <div className="px-6 py-4 sm:px-8 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0">
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
      </DialogContent>
    </Dialog>
  );
}
