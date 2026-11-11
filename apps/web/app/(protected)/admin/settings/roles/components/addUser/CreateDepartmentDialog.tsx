import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  toast,
} from "@repo/ui/components/ui";
import { createDepartmentSchema, CreateDepartmentDTO } from "@repo/schema";
import { useCreateDepartmentMutation } from "../../../../../../../lib/queries/department/useDepartments";
import { Loader2 } from "lucide-react";

interface CreateDepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (departmentId: string) => void;
}

export function CreateDepartmentDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateDepartmentDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDepartmentDTO>({
    resolver: zodResolver(createDepartmentSchema),
  });

  const createMutation = useCreateDepartmentMutation();

  const onSubmit = async (data: CreateDepartmentDTO) => {
    try {
      const response = await createMutation.mutateAsync(data) as any;
      toast({
        title: "Success",
        description: "Department created successfully",
      });
      reset();
      onClose();
      if (onSuccess && response?.id) {
        onSuccess(response.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create department",
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Create New Department
          </DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-md sm:text-md font-semibold text-slate-800">
              Department Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("name")}
              placeholder="e.g. Finance"
              className="rounded-xl h-10 bg-white border-slate-200"
            />
            {errors.name && (
              <p className="text-md text-red-500 font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-md sm:text-md font-semibold text-slate-800">
              Description
            </label>
            <Input
              {...register("description")}
              placeholder="Optional"
              className="rounded-xl h-10 bg-white border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-[#4A706A] hover:bg-[#3D5C57] text-white"
            >
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Create Department
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
