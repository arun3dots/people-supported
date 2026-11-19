"use client";

import { useState, useEffect } from "react";
import type { PropertyRoomDraftDTO } from "@repo/schema";
import type { PropertyItem, SchemeItem } from "../../../../../../../lib/types/facility";

interface UsePropertyFormStateProps {
  isOpen: boolean;
  initialData?: PropertyItem | null;
  schemes: SchemeItem[];
}

export function usePropertyFormState({
  isOpen,
  initialData,
  schemes,
}: UsePropertyFormStateProps) {
  const isEdit = Boolean(initialData);

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

  return {
    isEdit,
    name,
    setName,
    referenceId,
    setReferenceId,
    schemeId,
    setSchemeId,
    propertyType,
    setPropertyType,
    streetAddress,
    setStreetAddress,
    postcode,
    setPostcode,
    landlordName,
    setLandlordName,
    landlordPhone,
    setLandlordPhone,
    coreChargePerWeek,
    setCoreChargePerWeek,
    propertyManagerId,
    setPropertyManagerId,
    status,
    setStatus,
    totalCapacity,
    setTotalCapacity,
    facilities,
    setFacilities,
    featuresAndAccessibility,
    setFeaturesAndAccessibility,
    rooms,
    setRooms,
    nameError,
    setNameError,
    referenceIdError,
    setReferenceIdError,
    formError,
    setFormError,
    handleCapacityChange,
  };
}

