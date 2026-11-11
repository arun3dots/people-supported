"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Input,
  Label,
  Card,
  Text,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui";
import { Plus, Trash2, Clock, Palette, Pencil, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateShiftTypeSchema } from "@repo/schema";
import {
  useGetShiftTypesQuery,
  useCreateShiftTypeMutation,
  useDeleteShiftTypeMutation,
  useUpdateShiftTypeMutation,
} from "../../../../../../lib/queries/shifts";
import type { ShiftType } from "../../../../../../lib/types/shifts";

interface ShiftTypeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

function getDeleteErrorMessage(error: string): string {
  const linkedCount = error.match(/linked to (\d+) existing shift/i)?.[1];
  if (linkedCount) {
    return `This template is used by ${linkedCount} existing shift${linkedCount === "1" ? "" : "s"}. Assign another template to those shifts before deleting it.`;
  }

  return error || "Unable to delete the shift template.";
}

export function ShiftTypeManager({ isOpen, onClose }: ShiftTypeManagerProps) {
  const [editingType, setEditingType] = useState<ShiftType | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ShiftType | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { data: shiftTypes = [], refetch } = useGetShiftTypesQuery();
  const createTypeMutation = useCreateShiftTypeMutation({
    onSuccess: () => {
      reset();
      refetch();
    },
  });
  const deleteTypeMutation = useDeleteShiftTypeMutation({
    onSuccess: () => {
      setDeleteError(null);
      setPendingDelete(null);
      refetch();
    },
    onError: (error, deletedTypeId) => {
      setDeleteError(getDeleteErrorMessage(error.message));
      setPendingDelete(
        shiftTypes.find((type) => type.id === deletedTypeId) || null,
      );
    },
  });
  const updateTypeMutation = useUpdateShiftTypeMutation({
    onSuccess: () => {
      setEditingType(null);
      reset();
      refetch();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateShiftTypeSchema),
    defaultValues: {
      name: "",
      startTime: "08:00",
      endTime: "20:00",
      color: "#2563eb",
    },
  });

  const onSubmit = (data: any) => {
    if (editingType) {
      updateTypeMutation.mutate({ id: editingType.id, data });
    } else {
      createTypeMutation.mutate(data);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto font-sans p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold text-slate-900">
            Shift Types &amp; Templates
          </SheetTitle>
          <SheetDescription className="text-md text-slate-500">
            Define reusable shift patterns (e.g. Early, Late, Long Day, Night) to speed up rota planning.
          </SheetDescription>
        </SheetHeader>

        {/* Create New Shift Type Form */}
        <Card variant="surface" className="p-5 mb-6 shadow-none bg-surface-card-grey border-none rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <Plus className="size-4" />
            </div>
            <Text variant="base-bold" className="text-slate-900 font-bold">
              {editingType ? "Edit Shift Type" : "Add New Shift Type"}
            </Text>
          </div>

          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label required htmlFor="typeName">Template Name</Label>
              <Input
                id="typeName"
                {...register("name")}
                placeholder="e.g. Early Morning, Long Day"
                className="bg-white border-slate-200 rounded-xl text-md"
              />
              {errors.name && (
                <Text variant="error" size="sm">
                  {String(errors.name.message)}
                </Text>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label required htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime")}
                  className="bg-white border-slate-200 rounded-xl text-md"
                />
              </div>
              <div className="space-y-1.5">
                <Label required htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register("endTime")}
                  className="bg-white border-slate-200 rounded-xl text-md"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="colorInput">Theme Colour</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="colorInput"
                  type="color"
                  {...register("color")}
                  className="h-10 w-16 p-1 rounded-xl cursor-pointer bg-white border-slate-200"
                />
                <Text size="sm" className="text-slate-500 flex items-center gap-1">
                  <Palette className="size-3.5" /> Colour badge on rota grid
                </Text>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={createTypeMutation.isPending || updateTypeMutation.isPending}
              className="w-full rounded-xl text-md font-bold h-10 mt-2 shadow-none"
            >
              {updateTypeMutation.isPending
                ? "Saving..."
                : createTypeMutation.isPending
                  ? "Creating..."
                  : editingType
                    ? "Save Changes"
                    : "Save Shift Type"}
            </Button>
          </form>
        </Card>

        {/* Existing Shift Types List */}
        <div className="space-y-3">
          <Text variant="sm-bold" subdued className=" tracking-widest px-1 text-slate-500">
            Configured Templates ({shiftTypes.length})
          </Text>

          {shiftTypes.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-white">
              <Clock className="size-8 text-slate-300 mx-auto mb-2" />
              <Text size="sm" className="text-slate-400">
                No shift templates configured yet.
              </Text>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {shiftTypes.map((type) => (
                <div
                  key={type.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between group hover:border-primary transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: type.color || "#2563eb" }}
                    />
                    <div>
                      <Text variant="sm-bold" className="text-slate-900 font-semibold">
                        {type.name}
                      </Text>
                      <Text variant="sm-regular" className="text-slate-500">
                        {type.startTime} – {type.endTime}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:bg-slate-100 rounded-lg size-8 p-0"
                      onClick={() => {
                        setEditingType(type);
                        reset({ name: type.name, startTime: type.startTime, endTime: type.endTime, color: type.color || "#2563eb" });
                      }}
                      title="Edit template"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50 rounded-lg size-8 p-0"
                      disabled={deleteTypeMutation.isPending}
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(type);
                      }}
                      title="Delete template"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
        >
          <AlertDialogContent className="max-w-lg">
            <AlertDialogCancel
              aria-label="Close"
              className="absolute right-4 top-4 size-8 rounded-full border-0 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              disabled={deleteTypeMutation.isPending}
            >
              <X className="size-4" />
            </AlertDialogCancel>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteError ? "Template cannot be deleted" : "Delete shift template?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteError || `Are you sure you want to delete “${pendingDelete?.name}”?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {!deleteError && (
              <AlertDialogFooter>
                <AlertDialogAction
                  disabled={deleteTypeMutation.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    if (pendingDelete) {
                      deleteTypeMutation.mutate(pendingDelete.id);
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {deleteTypeMutation.isPending ? "Deleting..." : "Delete template"}
                </AlertDialogAction>
              </AlertDialogFooter>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
