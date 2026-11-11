"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import { format } from "date-fns";
import { Loader2, DoorOpen, BedDouble, Building2, Bed as BedIcon } from "lucide-react";
import { AdmissionFormData } from "../../types";
import {
  useGetWingsQuery,
  useGetRoomsQuery,
  useGetBedsQuery,
} from "../../../../../../lib/queries/facility";
import { Wing, Room, Bed } from "../../../../../../lib/types/facility";

interface RoomBedAllocationCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  errors?: Record<string, string>;
}

export function RoomBedAllocationCard({
  formData,
  updateFormData,
  errors,
}: RoomBedAllocationCardProps) {
  const { data: wings = [], isLoading: isLoadingWings } = useGetWingsQuery();
  const { data: allRooms = [], isLoading: isLoadingRooms } = useGetRoomsQuery();
  const { data: allBeds = [], isLoading: isLoadingBeds } = useGetBedsQuery();

  const [selectedWingId, setSelectedWingId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  useEffect(() => {
    if (allBeds.length > 0 && formData.assignedBedId) {
      const matchedBed = allBeds.find(
        (b: Bed) => b.id === formData.assignedBedId || b.code === formData.assignedBedId
      );
      if (matchedBed) {
        setSelectedRoomId(matchedBed.roomId);
        if (matchedBed.wingId) {
          setSelectedWingId(matchedBed.wingId);
        } else if (matchedBed.room?.wing?.staff) {
          const matchedRoom = allRooms.find((r: Room) => r.id === matchedBed.roomId);
          if (matchedRoom?.wingId) setSelectedWingId(matchedRoom.wingId);
        }
        return;
      }
    }

    if (allRooms.length > 0 && formData.roomNumber && !selectedRoomId) {
      const matchedRoom = allRooms.find(
        (r: Room) => r.roomNumber.toLowerCase() === formData.roomNumber?.toLowerCase()
      );
      if (matchedRoom) {
        setSelectedRoomId(matchedRoom.id);
        setSelectedWingId(matchedRoom.wingId);
      }
    }
  }, [allBeds, allRooms, formData.assignedBedId, formData.roomNumber, selectedRoomId]);

  const filteredRooms = useMemo(() => {
    if (!selectedWingId) return allRooms;
    return allRooms.filter((r: Room) => r.wingId === selectedWingId);
  }, [allRooms, selectedWingId]);

  const filteredBeds = useMemo(() => {
    if (!selectedRoomId) return [];
    return allBeds.filter((b: Bed) => b.roomId === selectedRoomId);
  }, [allBeds, selectedRoomId]);

  const potentialRoommate = useMemo(() => {
    if (!selectedRoomId) return null;
    const occupiedBedInRoom = allBeds.find(
      (b: Bed) =>
        b.roomId === selectedRoomId &&
        b.id !== formData.assignedBedId &&
        b.residentName
    );
    return occupiedBedInRoom?.residentName || null;
  }, [allBeds, selectedRoomId, formData.assignedBedId]);

  const handleWingChange = (wingId: string) => {
    setSelectedWingId(wingId);
    const roomInWing = allRooms.find((r: Room) => r.id === selectedRoomId && r.wingId === wingId);
    if (!roomInWing) {
      setSelectedRoomId("");
      updateFormData({
        roomNumber: "",
        assignedBedId: "",
      });
    }
  };

  const handleRoomChange = (roomId: string) => {
    const room = allRooms.find((r: Room) => r.id === roomId);
    if (!room) return;

    setSelectedRoomId(roomId);
    if (room.wingId) {
      setSelectedWingId(room.wingId);
    }

    updateFormData({
      roomNumber: room.roomNumber,
      roomType: room.type || "Single",
      assignedBedId: "",
    });
  };

  const handleBedChange = (bedId: string) => {
    const bed = allBeds.find((b: Bed) => b.id === bedId);
    if (!bed) return;

    updateFormData({
      assignedBedId: bed.id,
      roommate: potentialRoommate || formData.roommate || "N/A",
    });
  };

  const isLoading = isLoadingWings || isLoadingRooms || isLoadingBeds;

  return (
    <Card variant="surface" className="p-6 lg:p-8">
      <div className="pb-4 border-b border-slate-200/80 flex flex-row items-center justify-between gap-4">
        <div>
          <Text as="h3" size="md" weight="bold">
            Room &amp; Bed Allocation
          </Text>
          <Text size="sm" weight="regular" variant="subdued">
            Select physical wing, room, and available bed from facility inventory.
          </Text>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-md text-slate-500">
            <Loader2 className="size-3.5 animate-spin text-emerald-800" />
            <span>Loading facility data...</span>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* 1. Facility Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Wing Dropdown */}
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required className="flex items-center gap-1">
              <Building2 className="size-3.5 text-slate-400" /> Wing / Floor
            </Label>
            <Select
              value={selectedWingId}
              onValueChange={handleWingChange}
              disabled={isLoadingWings}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingWings ? "Loading wings..." : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {wings.map((w: Wing) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} {w.branchName ? `(${w.branchName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Dropdown */}
          <div
            data-validation-field="roomNumber"
            className="space-y-1.5 [&_[data-slot=input-error]]:hidden"
          >
            <Label required className="flex items-center gap-1">
              <DoorOpen className="size-3.5 text-slate-400" /> Room Number
            </Label>
            <Select
              value={selectedRoomId}
              onValueChange={handleRoomChange}
              disabled={isLoadingRooms || filteredRooms.length === 0}
            >
              <SelectTrigger
                className={errors?.roomNumber ? "border-border-error" : ""}
              >
                <SelectValue
                  placeholder={
                    isLoadingRooms
                      ? "Loading rooms..."
                      : filteredRooms.length === 0
                        ? "No rooms found"
                        : "Select"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredRooms.map((r: Room) => {
                  const availableBeds = Math.max(0, (r.totalBeds || 0) - (r.occupiedBeds || 0));
                  return (
                    <SelectItem key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.type || "Single"}) — {availableBeds}/{r.totalBeds || 1} Free
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors?.roomNumber && (
              <p className="text-sm text-text-error font-medium leading-tight mt-1">
                {errors.roomNumber}
              </p>
            )}
          </div>

          {/* Bed Dropdown */}
          <div
            data-validation-field="bedId"
            className="space-y-1.5 [&_[data-slot=input-error]]:hidden"
          >
            <Label required className="flex items-center gap-1">
              <BedDouble className="size-3.5 text-slate-400" /> Bed Allocation
            </Label>
            <Select
              value={formData.assignedBedId}
              onValueChange={handleBedChange}
              disabled={!selectedRoomId || isLoadingBeds || filteredBeds.length === 0}
            >
              <SelectTrigger className={errors?.bedId ? "border-border-error" : ""}>
                <SelectValue
                  placeholder={
                    !selectedRoomId
                      ? "Select room first"
                      : filteredBeds.length === 0
                        ? "No beds in room"
                        : "Select"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredBeds.map((b: Bed) => {
                  const isAvailable = b.status === "Available";
                  const isCurrentAssigned = b.id === formData.assignedBedId;
                  const label = b.number || b.bedLabel || b.code || "Bed";

                  return (
                    <SelectItem
                      key={b.id}
                      value={b.id}
                      disabled={!isAvailable && !isCurrentAssigned}
                    >
                      {label} — {isCurrentAssigned ? "Assigned" : b.status}
                      {b.residentName && !isCurrentAssigned ? ` (${b.residentName})` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors?.bedId && (
              <p className="text-sm text-text-error font-medium leading-tight mt-1">
                {errors.bedId}
              </p>
            )}
          </div>

          {/* Room Type */}
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
                <SelectItem value="Single">Single (Private)</SelectItem>
                <SelectItem value="Single Ensuite">Single Ensuite</SelectItem>
                <SelectItem value="Shared">Shared Room</SelectItem>
                <SelectItem value="Specialist / High Dependency">Specialist / High Dependency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 2. Move-in & Roommate Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/80">
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
                  moveInDateTime: date
                    ? format(date, "yyyy-MM-dd'T'HH:mm")
                    : "",
                })
              }
            />
          </div>

          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <div className="flex items-center justify-between min-h-[26px]">
              <Label>Roommate (If Shared)</Label>
              {potentialRoommate && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => updateFormData({ roommate: potentialRoommate })}
                  className="h-auto p-0 text-sm font-semibold text-emerald-800 hover:text-emerald-900 hover:underline"
                >
                  Autofill: {potentialRoommate}
                </Button>
              )}
            </div>
            <Input
              type="text"
              placeholder='Resident name or "N/A"'
              value={formData.roommate || ""}
              onChange={(e) => updateFormData({ roommate: e.target.value })}
            />
          </div>
        </div>

        {/* Status preview banner if a bed is chosen */}
        {formData.assignedBedId && (
          <Card
            variant="secondary"
            className="p-3.5 rounded-xl flex-row items-center justify-between gap-2 border-emerald-200 bg-white shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Badge state="success" className="font-semibold px-2.5 py-0.5 rounded-full">
                Bed Selected
              </Badge>
              <Text size="sm" weight="bold" className="text-slate-900">
                Room {formData.roomNumber} • {formData.roomType}
              </Text>
            </div>
            <Text size="sm" weight="medium" className="text-slate-500">
              ID: {formData.assignedBedId}
            </Text>
          </Card>
        )}
      </div>
    </Card>
  );
}
