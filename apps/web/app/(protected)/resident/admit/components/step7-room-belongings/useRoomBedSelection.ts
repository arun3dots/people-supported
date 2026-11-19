import { useEffect, useMemo, useState } from "react";
import { AdmissionFormData } from "../../types";
import {
  useGetSchemesQuery,
  useGetPropertiesQuery,
  useGetRoomsQuery,
} from "../../../../../../lib/queries/facility";
import type { PropertyItem, Room } from "../../../../../../lib/types/facility";

function resolvePropertyLandlord(prop?: PropertyItem | null): string {
  if (!prop) return "";
  return (
    prop.parsedPropertyDetails?.landlordDetails?.name?.trim() ||
    prop.scheme?.housingPartner?.trim() ||
    ""
  );
}

export function useRoomBedSelection(
  formData: AdmissionFormData,
  updateFormData: (data: Partial<AdmissionFormData>) => void,
) {
  const { data: schemes = [], isLoading: isLoadingSchemes } = useGetSchemesQuery();
  const { data: properties = [], isLoading: isLoadingProperties } = useGetPropertiesQuery();
  const { data: allRooms = [], isLoading: isLoadingRooms } = useGetRoomsQuery();

  const [selectedSchemeId, setSelectedSchemeId] = useState<string>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  useEffect(() => {
    if (selectedRoomId || allRooms.length === 0 || !formData.roomNumber) return;

    const matchedRoom = allRooms.find(
      (r: Room) => r.roomNumber.toLowerCase() === formData.roomNumber?.toLowerCase(),
    );
    if (matchedRoom) {
      const matchedProp = properties.find((p: PropertyItem) => p.id === matchedRoom.wingId);
      setSelectedRoomId(matchedRoom.id);
      setSelectedPropertyId(matchedRoom.wingId);
      if (matchedProp) setSelectedSchemeId(matchedProp.schemeId || "all");
    }
  }, [allRooms, properties, formData.roomNumber, selectedRoomId]);

  const filteredProperties = useMemo(() => {
    if (!selectedSchemeId || selectedSchemeId === "all") return properties;
    return properties.filter((p: PropertyItem) => p.schemeId === selectedSchemeId);
  }, [properties, selectedSchemeId]);

  const filteredRooms = useMemo(() => {
    if (selectedPropertyId) {
      return allRooms.filter((r: Room) => r.wingId === selectedPropertyId);
    }
    if (selectedSchemeId && selectedSchemeId !== "all") {
      const propertyIds = new Set(filteredProperties.map((p: PropertyItem) => p.id));
      return allRooms.filter((r: Room) => propertyIds.has(r.wingId));
    }
    return allRooms;
  }, [allRooms, filteredProperties, selectedPropertyId, selectedSchemeId]);

  const selectedProperty = useMemo(
    () => properties.find((p: PropertyItem) => p.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );

  const propertyLandlord = useMemo(
    () => resolvePropertyLandlord(selectedProperty),
    [selectedProperty],
  );

  const propertyType = useMemo(
    () => selectedProperty?.parsedPropertyDetails?.propertyType || "",
    [selectedProperty],
  );

  const isFlat = useMemo(() => {
    const pt = propertyType.toLowerCase();
    return pt.includes("flat");
  }, [propertyType]);

  const propertyFacilities = useMemo(
    () => selectedProperty?.parsedPropertyDetails?.facilities || [],
    [selectedProperty],
  );

  const getRoomStatus = (roomId: string) => {
    const tenancy = selectedProperty?.roomTenancies?.find((rt) => rt.id === roomId);
    if (!tenancy) {
      const roomObj = allRooms.find((r: Room) => r.id === roomId);
      const isOccupied = (roomObj?.occupiedBeds ?? 0) >= (roomObj?.totalBeds ?? 1);
      return { isOccupied, occupantName: null, availableBedId: roomObj?.beds?.[0]?.id || "" };
    }
    const occupiedBed = tenancy.beds?.find((b) => b.status === "Occupied" || Boolean(b.resident?.fullName));
    const availableBed = tenancy.beds?.find((b) => b.status === "Available" && !b.resident?.fullName);
    return {
      isOccupied: Boolean(occupiedBed && !availableBed),
      occupantName: occupiedBed?.resident?.fullName || null,
      availableBedId: availableBed?.id || tenancy.beds?.[0]?.id || "",
    };
  };

  const potentialRoommate = useMemo(() => {
    if (isFlat || !selectedRoomId || !selectedProperty?.roomTenancies) return null;
    const tenancy = selectedProperty.roomTenancies.find((rt) => rt.id === selectedRoomId);
    const occupant = tenancy?.beds.find((b) => b.resident?.fullName)?.resident;
    return occupant?.fullName || null;
  }, [isFlat, selectedProperty, selectedRoomId]);

  const handleSchemeChange = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    if (schemeId !== "all" && selectedPropertyId) {
      const stillInScheme = properties.some(
        (p: PropertyItem) => p.id === selectedPropertyId && p.schemeId === schemeId,
      );
      if (!stillInScheme) {
        setSelectedPropertyId("");
        setSelectedRoomId("");
        const currentLandlord = formData.landlord?.trim() ?? "";
        updateFormData({
          roomNumber: "",
          assignedBedId: "",
          ...(propertyLandlord && currentLandlord === propertyLandlord
            ? { landlord: "" }
            : {}),
        });
      }
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const prop = properties.find((p: PropertyItem) => p.id === propertyId);
    if (prop?.schemeId) {
      setSelectedSchemeId(prop.schemeId);
    }
    const roomInProperty = allRooms.find(
      (r: Room) => r.id === selectedRoomId && r.wingId === propertyId,
    );
    const patch: Partial<AdmissionFormData> = {};
    if (!roomInProperty) {
      setSelectedRoomId("");
      patch.roomNumber = "";
      patch.assignedBedId = "";
    }
    const propType = prop?.parsedPropertyDetails?.propertyType || "";
    const isPropFlat = propType.toLowerCase().includes("flat");
    if (isPropFlat && (formData.roomType === "Shared" || !formData.roomType)) {
      patch.roomType = "Single";
    }
    const nextLandlord = resolvePropertyLandlord(prop);
    const currentLandlord = formData.landlord?.trim() ?? "";
    if ((!currentLandlord || currentLandlord === propertyLandlord) && nextLandlord !== currentLandlord) {
      patch.landlord = nextLandlord;
    }
    if (Object.keys(patch).length > 0) {
      updateFormData(patch);
    }
  };

  const handleRoomChange = (roomId: string) => {
    const room = allRooms.find((r: Room) => r.id === roomId);
    if (!room) return;

    setSelectedRoomId(roomId);
    let nextLandlord = "";
    if (room.wingId) {
      setSelectedPropertyId(room.wingId);
      const matchedProp = properties.find((p: PropertyItem) => p.id === room.wingId);
      if (matchedProp) {
        setSelectedSchemeId(matchedProp.schemeId || "all");
        nextLandlord = resolvePropertyLandlord(matchedProp);
      }
    }

    const currentLandlord = formData.landlord?.trim() ?? "";
    const shouldUpdateLandlord =
      Boolean(nextLandlord) &&
      (!currentLandlord || currentLandlord === propertyLandlord) &&
      nextLandlord !== currentLandlord;

    const roomStatus = getRoomStatus(roomId);
    const targetRoomType = isFlat
      ? (room.type === "Shared" ? "Single" : (room.type || "Single"))
      : (room.type || "Single");

    updateFormData({
      roomNumber: room.roomNumber,
      roomType: targetRoomType,
      assignedBedId: roomStatus.availableBedId || "",
      ...(isFlat ? { roommate: "" } : {}),
      ...(shouldUpdateLandlord ? { landlord: nextLandlord } : {}),
    });
  };

  return {
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
    isLoading: isLoadingSchemes || isLoadingProperties || isLoadingRooms,
    handleSchemeChange,
    handlePropertyChange,
    handleRoomChange,
  };
}
