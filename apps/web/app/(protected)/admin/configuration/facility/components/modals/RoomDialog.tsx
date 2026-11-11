"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@repo/ui/components/ui";
import { Input } from "@repo/ui/components/ui/Input";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { CreateRoomDTO } from "@repo/schema";
import { Room, Wing } from "../../../../../../../lib/types/facility";
import { useGetWingsQuery } from "../../../../../../../lib/queries/facility/useGetWingsQuery";
import { useGetRoomsQuery } from "../../../../../../../lib/queries/facility/useGetRoomsQuery";
import { FacilitySuccessPrompt } from "../shared/FacilitySuccessPrompt";

interface RoomDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateRoomDTO) => Promise<{ id?: string } | void> | void | null;
  onAddBedNext?: (roomId?: string, wingId?: string) => void;
  initialData?: Room | null;
  defaultWingId?: string | null;
  title: string;
  isLoading?: boolean;
}

interface RoomFormValues {
  wingId: string;
  roomNumber: string;
  type: string;
  description?: string;
  primaryContact?: string;
  status: string;
  notes?: string;
}

function normalizeRoomKey(val?: string | null): string {
  if (!val) return "";
  return val.trim().replace(/^room\s+/i, "").trim().toLowerCase();
}

export function RoomDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  onAddBedNext,
  initialData,
  defaultWingId,
  title,
  isLoading,
}: RoomDialogProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ id?: string; name: string; wingId?: string } | null>(null);

  const { data: wings } = useGetWingsQuery();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<RoomFormValues>({
    defaultValues: {
      wingId: defaultWingId || "",
      roomNumber: "",
      type: "",
      description: "",
      primaryContact: "",
      status: "",
      notes: "",
    },
  });

  const selectedWingId = watch("wingId");
  const { data: wingRooms } = useGetRoomsQuery(selectedWingId || null, {
    enabled: isOpen && !!selectedWingId,
  });

  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setCreatedRoom(null);
      reset({
        wingId: initialData?.wingId || defaultWingId || "",
        roomNumber: initialData?.roomNumber || "",
        type: initialData?.type || "",
        description: initialData?.description || "",
        primaryContact: initialData?.primaryContact || "",
        status: initialData?.status || "",
        notes: initialData?.notes || "",
      });
    }
  }, [isOpen, initialData, defaultWingId, reset]);

  const isEdit = !!initialData;

  const handleFormSubmit = async (values: RoomFormValues) => {
    const targetKey = normalizeRoomKey(values.roomNumber);
    const duplicateRoom = wingRooms?.find(
      (r: Room) =>
        r.id !== initialData?.id &&
        (normalizeRoomKey(r.roomNumber) === targetKey ||
          (r.name && normalizeRoomKey(r.name) === targetKey)),
    );

    if (duplicateRoom) {
      setError("roomNumber", {
        type: "manual",
        message: `Room "${values.roomNumber.trim()}" already exists in the selected wing.`,
      });
      return;
    }

    try {
      const res = await onSubmit({
        wingId: values.wingId,
        roomNumber: values.roomNumber.trim(),
        type: values.type.trim(),
        description: values.description || undefined,
        primaryContact: values.primaryContact || undefined,
        status: values.status,
        notes: values.notes || undefined,
      });

      const resId =
        res && typeof res === "object" && "id" in res
          ? (res as { id?: string }).id
          : undefined;

      setCreatedRoom({ id: resId, name: values.roomNumber.trim(), wingId: values.wingId });
      setShowSuccess(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "A room with this number already exists in the selected wing.";
      setError("roomNumber", {
        type: "manual",
        message: msg,
      });
    }
  };

  const handleAddAnother = () => {
    reset({
      wingId: defaultWingId || "",
      roomNumber: "",
      type: "",
      description: "",
      primaryContact: "",
      status: "",
      notes: "",
    });
    setCreatedRoom(null);
    setShowSuccess(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="p-0 overflow-x-hidden">
        {!showSuccess ? (
          <div className="p-6">
            <DialogHeader className="pb-4 border-b border-slate-100">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {title}
              </DialogTitle>
            </DialogHeader>

            <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
              {/* Wing Selector */}
              <div className="space-y-1.5">
                <Label required>
                  Select Wing
                </Label>
                <Controller
                  name="wingId"
                  control={control}
                  rules={{ required: "Wing is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a Wing..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        {wings?.map((w: Wing) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name} {w.branchName ? `(${w.branchName})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.wingId && (
                  <p className="text-md text-red-500">{errors.wingId.message}</p>
                )}
              </div>

              {/* Room Number & Room Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="space-y-1.5">
                  <Label required>
                    Room Number
                  </Label>
                  <Input
                    placeholder="e.g. 101"
                    {...register("roomNumber", {
                      required: "Room Number is required",
                      validate: (val) => {
                        const key = normalizeRoomKey(val);
                        if (!key) return "Room Number is required";
                        const dup = wingRooms?.find(
                          (r: Room) =>
                            r.id !== initialData?.id &&
                            (normalizeRoomKey(r.roomNumber) === key ||
                              (r.name && normalizeRoomKey(r.name) === key)),
                        );
                        return dup
                          ? `Room "${val.trim()}" already exists in the selected wing.`
                          : true;
                      },
                    })}
                    errorMessage={errors.roomNumber?.message}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label required>
                    Room Type
                  </Label>
                  <Input
                    placeholder="e.g. Single Room"
                    {...register("type", {
                      required: "Room Type is required",
                    })}
                    errorMessage={errors.type?.message}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label required>
                  Status
                </Label>
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: "Status is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-md text-red-500">{errors.status.message}</p>
                )}
              </div>

              {/* Primary Contact */}
              <div className="space-y-1.5">
                <Label>
                  Primary Contact (Optional)
                </Label>
                <Input
                  placeholder="e.g. Assigned Staff / Nurse"
                  {...register("primaryContact")}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>
                  Description
                </Label>
                <Textarea
                  rows={2}
                  placeholder="Add notes or details about the room..."
                  {...register("description")}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Room"}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <FacilitySuccessPrompt
            title={`Room ${isEdit ? "Updated" : "Created"} Successfully!`}
            description={`Room "${createdRoom?.name || ""}" has been ${isEdit ? "updated" : "saved"}.`}
            entityName={createdRoom?.name || "Room"}
            addAnotherLabel="Add Another Room"
            onAddAnother={handleAddAnother}
            addNextLabel="Add Bed for this Room"
            onAddNext={() => {
              onOpenChange(false);
              onAddBedNext?.(createdRoom?.id, createdRoom?.wingId);
            }}
            onFinish={() => onOpenChange(false)}
            isEdit={isEdit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
