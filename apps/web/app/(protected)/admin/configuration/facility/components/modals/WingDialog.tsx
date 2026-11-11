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
import { CreateWingDTO } from "@repo/schema";
import { Wing } from "../../../../../../../lib/types/facility";
import { useGetWingsQuery } from "../../../../../../../lib/queries/facility/useGetWingsQuery";
import { FacilitySuccessPrompt } from "../shared/FacilitySuccessPrompt";

interface WingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateWingDTO) => Promise<{ id?: string } | void> | void | null;
  onAddRoomNext?: (wingId?: string) => void;
  initialData?: Wing | null;
  title: string;
  isLoading?: boolean;
}

interface WingFormValues {
  name: string;
  code?: string;
  description?: string;
  primaryContact?: string;
  status: string;
  notes?: string;
}

export function WingDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  onAddRoomNext,
  initialData,
  title,
  isLoading,
}: WingDialogProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdWing, setCreatedWing] = useState<{ id?: string; name: string } | null>(null);

  const { data: existingWings } = useGetWingsQuery(null, { enabled: isOpen });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<WingFormValues>({
    defaultValues: {
      name: "",
      code: "",
      description: "",
      primaryContact: "",
      status: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setCreatedWing(null);
      reset({
        name: initialData?.name || "",
        code: initialData?.code || "",
        description: initialData?.description || "",
        primaryContact: initialData?.primaryContact || "",
        status: initialData?.status || "",
        notes: initialData?.notes || "",
      });
    }
  }, [isOpen, initialData, reset]);

  const isEdit = !!initialData;

  const handleFormSubmit = async (values: WingFormValues) => {
    const normalizedName = values.name.trim().toLowerCase();
    const duplicateName = existingWings?.find(
      (w: Wing) =>
        w.id !== initialData?.id &&
        w.name.trim().toLowerCase() === normalizedName,
    );
    if (duplicateName) {
      setError("name", {
        type: "manual",
        message: `Wing "${values.name.trim()}" already exists in this facility.`,
      });
      return;
    }

    if (values.code?.trim()) {
      const normalizedCode = values.code.trim().toLowerCase();
      const duplicateCode = existingWings?.find(
        (w: Wing) =>
          w.id !== initialData?.id &&
          w.code?.trim().toLowerCase() === normalizedCode,
      );
      if (duplicateCode) {
        setError("code", {
          type: "manual",
          message: `A wing with code "${values.code.trim()}" already exists in this facility.`,
        });
        return;
      }
    }

    try {
      const res = await onSubmit({
        name: values.name.trim(),
        code: values.code?.trim() || undefined,
        description: values.description || undefined,
        primaryContact: values.primaryContact || undefined,
        status: values.status,
        notes: values.notes || undefined,
      });

      const resId =
        res && typeof res === "object" && "id" in res
          ? (res as { id?: string }).id
          : undefined;

      setCreatedWing({ id: resId, name: values.name.trim() });
      setShowSuccess(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "A wing with this name already exists.";
      setError("name", {
        type: "manual",
        message: msg,
      });
    }
  };

  const handleAddAnother = () => {
    reset({
      name: "",
      code: "",
      description: "",
      primaryContact: "",
      status: "",
      notes: "",
    });
    setCreatedWing(null);
    setShowSuccess(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="p-0 overflow-x-hidden">
        {!showSuccess ? (
          <div className="p-6">
            <DialogHeader className="pb-4 border-b border-slate-100">
              <DialogTitle className="text-lg font-bold text-slate-900">
                {title}
              </DialogTitle>
            </DialogHeader>

            <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
              {/* Wing Name */}
              <div className="space-y-1.5">
                <Label required>
                  Wing Name
                </Label>
                <Input
                  placeholder="e.g. East Wing"
                  {...register("name", {
                    required: "Wing Name is required",
                    validate: (val) => {
                      const key = val.trim().toLowerCase();
                      if (!key) return "Wing Name is required";
                      const dup = existingWings?.find(
                        (w: Wing) =>
                          w.id !== initialData?.id &&
                          w.name.trim().toLowerCase() === key,
                      );
                      return dup
                        ? `Wing "${val.trim()}" already exists in this facility.`
                        : true;
                    },
                  })}
                  errorMessage={errors.name?.message}
                />
              </div>

              {/* Code & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="space-y-1.5">
                  <Label>
                    Wing Code (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. WNG-E"
                    {...register("code")}
                    errorMessage={errors.code?.message}
                  />
                </div>

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
              </div>

              {/* Primary Contact */}
              <div className="space-y-1.5">
                <Label>
                  Primary Contact (Optional)
                </Label>
                <Input
                  placeholder="e.g. Wing Supervisor"
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
                  placeholder="Add notes or details about the wing..."
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
                  {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Wing"}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <FacilitySuccessPrompt
            title={`Wing ${isEdit ? "Updated" : "Created"} Successfully!`}
            description={`Wing "${createdWing?.name || ""}" has been ${isEdit ? "updated" : "saved"}.`}
            entityName={createdWing?.name || "Wing"}
            addAnotherLabel="Add Another Wing"
            onAddAnother={handleAddAnother}
            addNextLabel="Add Rooms for this Wing"
            onAddNext={() => {
              onOpenChange(false);
              onAddRoomNext?.(createdWing?.id);
            }}
            onFinish={() => onOpenChange(false)}
            isEdit={isEdit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
