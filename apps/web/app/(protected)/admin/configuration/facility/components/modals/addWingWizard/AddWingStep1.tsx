"use client";

import { useForm, Controller } from "react-hook-form";
import { Input } from "@repo/ui/components/ui/Input";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";

export interface WingStep1Values {
  name: string;
  description?: string;
  primaryContact?: string;
  status: string;
  notes?: string;
}

interface AddWingStep1Props {
  initialValues?: Partial<WingStep1Values>;
  onSubmit: (values: WingStep1Values) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddWingStep1({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
}: AddWingStep1Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WingStep1Values>({
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      primaryContact: initialValues?.primaryContact || "",
      status: initialValues?.status || "Active",
      notes: initialValues?.notes || "",
    },
  });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Wing Name */}
        <div className="space-y-1.5">
          <label className="text-md font-semibold text-foreground">
            Wing Name <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g. North Wing"
            className="h-11 rounded-xl bg-gray-50/50 border-gray-200 text-md"
            {...register("name", { required: "Wing Name is required" })}
            errorMessage={errors.name?.message}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-md font-semibold text-foreground">
            Primary Contact (Optional)
          </label>
          <Input
            placeholder="e.g. North Wing Lead"
            className="h-11 rounded-xl bg-gray-50/50 border-gray-200 text-md"
            {...register("primaryContact")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-md font-semibold text-foreground">Description</label>
        <textarea
          rows={3}
          placeholder="Add any additional notes about this wing..."
          className="w-full p-3 rounded-xl bg-gray-50/50 border border-gray-200 text-md focus:outline-none focus:ring-2 focus:ring-[#3D5C57]/20 transition-all resize-none"
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          placeholder="Add any additional notes about this wing..."
          className="w-full p-3 rounded-xl bg-gray-50/50 border border-gray-200 text-md focus:outline-none focus:ring-2 focus:ring-[#3D5C57]/20 transition-all resize-none"
          {...register("notes")}
        />
      </div>

      <div className="flex items-center gap-3 justify-between pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Saving..." : "Continue →"}
        </Button>
      </div>
    </form>
  );
}
