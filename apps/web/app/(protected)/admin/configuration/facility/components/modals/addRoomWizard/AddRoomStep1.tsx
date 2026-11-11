"use client";

import { useForm, Controller } from "react-hook-form";
import { Info } from "lucide-react";
import { Input } from "@repo/ui/components/ui/Input";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { useGetWingsQuery } from "../../../../../../../../lib/queries/facility/useGetWingsQuery";
import { Wing } from "../../../../../../../../lib/types/facility";

export interface RoomStep1Values {
  roomNumber: string;
  type: string;
  wingId?: string;
  description?: string;
  primaryContact?: string;
  status: string;
  notes?: string;
}

interface AddRoomStep1Props {
  unitName?: string;
  wingName?: string;
  initialValues?: Partial<RoomStep1Values>;
  onSubmit: (values: RoomStep1Values) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ROOM_TYPES = ["Single", "Double", "Ensuite", "Suite", "Shared"];

export function AddRoomStep1({
  unitName,
  wingName,
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
}: AddRoomStep1Props) {
  const { data: wings } = useGetWingsQuery(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoomStep1Values>({
    defaultValues: {
      roomNumber: initialValues?.roomNumber || "",
      wingId: initialValues?.wingId || "",
      type: initialValues?.type || "Single",
      description: initialValues?.description || "",
      primaryContact: initialValues?.primaryContact || "",
      status: initialValues?.status || "Active",
      notes: initialValues?.notes || "",
    },
  });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      {(unitName || wingName) && (
        <div className="bg-[#F0FDF4] border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-md text-emerald-800 mb-2">
          <Info className="size-4 text-emerald-600 shrink-0" />
          <span>
            {unitName && <>Unit: <strong className="font-semibold text-emerald-950">{unitName}</strong> → </>}
            Wing: <strong className="font-semibold text-emerald-950">{wingName || "North Wing"}</strong>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Room Number */}
        <div className="space-y-1.5">
          <label className="text-md font-semibold text-foreground">
            Room Name / Number <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g. Room 101"
            className="h-11 rounded-xl bg-gray-50/50 border-gray-200 text-md"
            {...register("roomNumber", { required: "Room Number is required" })}
            errorMessage={errors.roomNumber?.message}
          />
        </div>

        {/* Select Wing */}
        <div className="space-y-1.5">
          <label className="text-md font-semibold text-foreground">
            Select Wing <span className="text-red-500">*</span>
          </label>
          <Controller
            name="wingId"
            control={control}
            rules={{ required: "Wing selection is required" }}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50/50 border-gray-200 text-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
            <p className="text-[10px] text-red-500 mt-0.5">{errors.wingId.message}</p>
          )}
        </div>

        {/* Room Type */}
        <div className="space-y-1.5">
          <label className="text-md font-semibold text-foreground">
            Room Type <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            rules={{ required: "Room Type is required" }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50/50 border-gray-200 text-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {ROOM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-md font-semibold text-foreground">Description</label>
        <textarea
          rows={3}
          placeholder="Add any additional notes about this room..."
          className="w-full p-3 rounded-xl bg-gray-50/50 border border-gray-200 text-md focus:outline-none focus:ring-2 focus:ring-[#3D5C57]/20 transition-all resize-none"
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-md font-semibold text-foreground">
            Primary Contact (Optional)
          </label>
          <Input
            placeholder="e.g. Room Lead Nurse"
            className="h-11 rounded-xl bg-gray-50/50 border-gray-200 text-md"
            {...register("primaryContact")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-md font-semibold text-foreground">
            Status <span className="text-red-500">*</span>
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50/50 border-gray-200 text-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-md font-semibold text-foreground">
          Notes (Optional)
        </label>
        <textarea
          rows={2}
          placeholder="Add any additional notes about this room..."
          className="w-full p-3 rounded-xl bg-gray-50/50 border border-gray-200 text-md focus:outline-none focus:ring-2 focus:ring-[#3D5C57]/20 transition-all resize-none"
          {...register("notes")}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Saving..." : "Continue →"}
        </Button>
      </div>
    </form>
  );
}
