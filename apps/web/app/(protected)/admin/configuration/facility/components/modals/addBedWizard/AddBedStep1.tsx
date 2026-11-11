"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import {
  Card,
  Input,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import {
  useGetWingsQuery,
  useGetRoomsQuery,
  useGetBedsQuery,
} from "../../../../../../../../lib/queries/facility";
import { Wing, Room, Bed } from "../../../../../../../../lib/types/facility";
import { BedTypeSelector } from "./BedTypeSelector";

export interface BedStep1Values {
  wingId?: string;
  wingName?: string;
  roomId: string;
  roomNumber?: string;
  bedNumber: string;
  bedLabel?: string;
  bedCode: string;
  bedType: string;
  status: string;
}

interface AddBedStep1Props {
  initialValues?: Partial<BedStep1Values>;
  editingBedId?: string | null;
  onSubmit: (values: BedStep1Values) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function normalizeBedKey(val?: string | null): string {
  if (!val) return "";
  return val.trim().replace(/^bed\s+/i, "").trim().toLowerCase();
}

function isSingleRoomType(type?: string | null): boolean {
  if (!type) return false;
  const norm = type.trim().toLowerCase();
  return norm === "single" || norm === "single room" || norm === "single_room";
}

export function AddBedStep1({
  initialValues,
  editingBedId,
  onSubmit,
  onCancel,
  isLoading,
}: AddBedStep1Props) {
  const searchParams = useSearchParams();
  const queryWingId = searchParams.get("wingId");
  const queryRoomId = searchParams.get("roomId");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<BedStep1Values>({
    defaultValues: {
      wingId: initialValues?.wingId || queryWingId || "",
      roomId: initialValues?.roomId || queryRoomId || "",
      bedNumber: initialValues?.bedNumber || "",
      bedLabel: initialValues?.bedLabel || "",
      bedCode: initialValues?.bedCode || "",
      bedType: initialValues?.bedType || "Standard Bed",
      status: initialValues?.status || "",
    },
  });

  const watchedWingId = watch("wingId");
  const watchedRoomId = watch("roomId");

  const { data: wings } = useGetWingsQuery();
  const { data: rooms } = useGetRoomsQuery(watchedWingId || null, {
    enabled: !!watchedWingId,
  });
  const { data: allRooms } = useGetRoomsQuery(null, {
    enabled: !!queryRoomId || !!initialValues?.roomId || !!watchedRoomId,
  });
  const { data: roomBeds } = useGetBedsQuery(watchedRoomId || null, {
    enabled: !!watchedRoomId,
  });
  const { data: allFacilityBeds } = useGetBedsQuery(null);

  const displayRooms: Room[] = useMemo(() => {
    const list = [...(rooms || [])];
    if (allRooms) {
      allRooms.forEach((r: Room) => {
        if (
          (!watchedWingId || r.wingId === watchedWingId) &&
          !list.some((existing) => existing.id === r.id)
        ) {
          list.push(r);
        }
      });
    }
    return list;
  }, [rooms, allRooms, watchedWingId]);

  const firstRoom = watchedRoomId || queryRoomId || initialValues?.roomId;
  const [didPrepopulate, setDidPrepopulate] = useState(false);

  useEffect(() => {
    const effectiveWing = initialValues?.wingId || queryWingId;
    const effectiveRoom = initialValues?.roomId || queryRoomId;

    if (effectiveWing && !watchedWingId) {
      setValue("wingId", effectiveWing, { shouldDirty: true });
    }
    if (effectiveRoom && !watchedRoomId) {
      setValue("roomId", effectiveRoom, { shouldDirty: true });
    }
  }, [
    initialValues?.wingId,
    initialValues?.roomId,
    queryWingId,
    queryRoomId,
    setValue,
    watchedWingId,
    watchedRoomId,
  ]);

  useEffect(() => {
    if (didPrepopulate || watchedWingId || !firstRoom || !allRooms) return;
    const room = allRooms.find((r: Room) => r.id === firstRoom);
    if (!room) return;
    if (room.wingId) setValue("wingId", room.wingId);
    if (room.id) setValue("roomId", room.id);
    setDidPrepopulate(true);
  }, [didPrepopulate, watchedWingId, firstRoom, allRooms, setValue]);

  const handleWingChange = (val: string) => {
    setValue("wingId", val);
    setValue("roomId", "");
  };

  const selectedRoom =
    displayRooms.find((r: Room) => r.id === watchedRoomId) ||
    allRooms?.find((r: Room) => r.id === watchedRoomId);

  const handleBedStep1Submit = (values: BedStep1Values) => {
    const room =
      displayRooms.find((r: Room) => r.id === values.roomId) ||
      allRooms?.find((r: Room) => r.id === values.roomId);
    const wing = wings?.find((w: Wing) => w.id === values.wingId);

    // Single Room capacity check when adding a bed (or moving a bed to a different single room)
    const activeBedsInRoom = (roomBeds || []).filter(
      (b: Bed) => b.id !== editingBedId,
    );
    if (isSingleRoomType(room?.type) && activeBedsInRoom.length >= 1) {
      setError("roomId", {
        type: "manual",
        message: `Room ${room?.roomNumber || ""} is a Single Room and already has a bed configured.`,
      });
      return;
    }

    const targetNumberKey = normalizeBedKey(values.bedNumber);
    const targetRawNumber = values.bedNumber.trim().toLowerCase();
    const duplicateNumber = activeBedsInRoom.find((b: Bed) => {
      const bKey = normalizeBedKey(b.number);
      const bRaw = b.number?.trim().toLowerCase() || "";
      return (
        (targetNumberKey && targetNumberKey === bKey) ||
        (targetRawNumber && targetRawNumber === bRaw)
      );
    });

    if (duplicateNumber) {
      setError("bedNumber", {
        type: "manual",
        message: `Bed "${values.bedNumber.trim()}" already exists in Room ${room?.roomNumber || ""}.`,
      });
      return;
    }

    const targetCodeKey = values.bedCode.trim().toLowerCase();
    const duplicateCode = (allFacilityBeds || []).find(
      (b: Bed) =>
        b.id !== editingBedId &&
        b.code?.trim().toLowerCase() === targetCodeKey,
    );

    if (duplicateCode) {
      setError("bedCode", {
        type: "manual",
        message: `A bed with identifier "${values.bedCode.trim()}" already exists in this facility.`,
      });
      return;
    }

    onSubmit({
      ...values,
      bedNumber: values.bedNumber.trim(),
      bedCode: values.bedCode.trim(),
      wingName: wing?.name || values.wingName || "",
      roomNumber: room?.roomNumber || values.roomNumber || "",
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleBedStep1Submit)} className="space-y-5 pt-1 pb-2 font-sans">
      {/* Title Header */}
      <div>
        <Text as="h2" size="lg" weight="bold" className="text-slate-900">
          Bed Details
        </Text>
        <Text size="md" variant="muted" className="text-slate-500 mt-0.5">
          Add the basic information and location for the new bed.
        </Text>
      </div>

      {/* Section 1: Location */}
      <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <Text as="h3" size="md" weight="semibold" className="text-slate-900">
              Location
            </Text>
            <Text size="md" variant="muted" className="text-slate-500">
              Select wing and room for the new bed
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
          {/* Wing/Floor selection */}
          <div className="flex flex-col gap-1.5">
            <Label required>Wing / Floor</Label>
            <Controller
              name="wingId"
              control={control}
              rules={{ required: "Wing/Floor is required" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    handleWingChange(val);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {wings?.map((w: Wing) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.wingId && (
              <Text variant="error" size="md" className="mt-1">
                {String(errors.wingId.message)}
              </Text>
            )}
          </div>

          {/* Room selection */}
          <div className="flex flex-col gap-1.5">
            <Label required>Room</Label>
            <Controller
              name="roomId"
              control={control}
              rules={{ required: "Room is required" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!watchedWingId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayRooms.map((r: Room) => (
                      <SelectItem key={r.id} value={r.id}>
                        Room {r.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.roomId && (
              <Text variant="error" size="md" className="mt-1">
                {String(errors.roomId.message)}
              </Text>
            )}
          </div>
        </div>

        {/* Capacity Alert Banner */}
        {selectedRoom && (
          <Card
            variant="secondary"
            border="secondary"
            className="flex-row items-center gap-2.5 px-3.5 py-2.5 rounded-xl mt-1"
          >
            <AlertCircle className="size-4 shrink-0 text-primary" />
            <div className="flex items-center gap-1.5 flex-wrap text-slate-700">
              <Text size="sm" weight="medium" className="text-slate-700">
                Room capacity:{" "}
                <span className="font-semibold text-slate-900">
                  {selectedRoom.totalBeds} beds
                </span>
              </Text>
              <span className="text-slate-300">|</span>
              <Text size="sm" weight="medium" className="text-slate-700">
                Occupied:{" "}
                <span className="font-semibold text-slate-900">
                  {selectedRoom.occupiedBeds}
                </span>
              </Text>
              <span className="text-slate-300">|</span>
              <Text size="sm" weight="medium" className="text-slate-700">
                Available:{" "}
                <span className="font-semibold text-slate-900">
                  {Math.max(
                    0,
                    selectedRoom.totalBeds - selectedRoom.occupiedBeds
                  )}
                </span>
              </Text>
            </div>
          </Card>
        )}
      </Card>

      {/* Section 2: Bed Information */}
      <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <Text as="h3" size="md" weight="semibold" className="text-slate-900">
              Bed Information
            </Text>
            <Text size="md" variant="muted" className="text-slate-500">
              Provide bed numbering, position label, and unique identifier
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1.5">
          {/* Bed Number */}
          <div className="flex flex-col gap-1.5">
            <Label required htmlFor="bedNumber">
              Bed Number / Label
            </Label>
            <Input
              id="bedNumber"
              placeholder="e.g. 101-A, Bed 1"
              {...register("bedNumber", { required: "Bed Number is required" })}
              errorMessage={errors.bedNumber?.message}
            />
          </div>

          {/* Bed Label */}
          <div className="flex flex-col gap-1.5">
            <Label>Bed Position Label (Optional)</Label>
            <Controller
              name="bedLabel"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="By Window">By Window</SelectItem>
                    <SelectItem value="By Door">By Door</SelectItem>
                    <SelectItem value="Middle">Middle</SelectItem>
                    <SelectItem value="Left Side">Left Side</SelectItem>
                    <SelectItem value="Right Side">Right Side</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Unique Bed Identifier */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bedCode">
              Unique Bed Identifier (Optional)
            </Label>
            <Input
              id="bedCode"
              placeholder="e.g. BED-101-A"
              {...register("bedCode")}
              errorMessage={errors.bedCode?.message}
            />
          </div>
        </div>
      </Card>

      {/* Section 3: Bed Type */}
      <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <Text as="h3" size="md" weight="semibold" className="text-slate-900">
              Bed Type
            </Text>
            <Text size="md" variant="muted" className="text-slate-500">
              Select the physical bed category and configuration
            </Text>
          </div>
        </div>

        <Controller
          name="bedType"
          control={control}
          rules={{
            validate: (val) => {
              if (val === "Other") return "Please specify the custom bed type";
              return true;
            },
          }}
          render={({ field, fieldState }) => (
            <BedTypeSelector
              value={field.value}
              onChange={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
      </Card>

      {/* Status Section & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-slate-100">
        <div className="space-y-1.5 w-full sm:w-64">
          <Label required>Status</Label>
          <Controller
            name="status"
            control={control}
            rules={{ required: "Status is required" }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Occupied">Occupied</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && (
            <p className="text-md text-red-500">{errors.status.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-28 h-10 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full sm:w-28 h-10 rounded-xl flex items-center justify-center gap-1.5"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
