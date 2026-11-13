"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateShiftRequestSchema, type CreateShiftRequestDTO } from "@repo/schema";
import { cn } from "@repo/ui/lib/utils";
import { formatUkDate, getUkDateTimeForLocalDisplay, convertLocalDateTimeToUk } from "../../utils/uk-date-time";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DateTimePicker,
  Text,
} from "@repo/ui/components/ui";
import { useCreateShiftRequestMutation } from "../../queries/shifts";
import { type Shift } from "../../types/shifts";

interface ShiftRequestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "Leave" | "Change" | "Cover";
  selectedShift?: Shift | null;
  myShifts?: Shift[];
}

export function ShiftRequestDialog({
  isOpen,
  onOpenChange,
  defaultType,
  selectedShift,
  myShifts = [],
}: ShiftRequestDialogProps) {
  const createMutation = useCreateShiftRequestMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<CreateShiftRequestDTO>({
    resolver: zodResolver(CreateShiftRequestSchema),
    defaultValues: {
      type: (selectedShift ? "Change" : (defaultType || "")) as any,
      shiftId: selectedShift?.id || null,
      startTime: selectedShift
        ? selectedShift.startTime || selectedShift.rawStartTime || ""
        : "",
      endTime: selectedShift
        ? selectedShift.endTime || selectedShift.rawEndTime || ""
        : "",
      reason: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const isPast = Boolean(selectedShift?.startTime && new Date(selectedShift.startTime).getTime() < Date.now());
      const targetShift = isPast ? null : selectedShift;
      const initialType = targetShift ? "Change" : (defaultType || "Leave");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const defaultStartTime = targetShift
        ? targetShift.startTime || targetShift.rawStartTime || ""
        : initialType === "Leave"
          ? tomorrow.toISOString()
          : "";
      const defaultEndTime = targetShift
        ? targetShift.endTime || targetShift.rawEndTime || ""
        : initialType === "Leave"
          ? new Date(tomorrow.getTime() + 8 * 3600 * 1000).toISOString()
          : "";

      reset({
        type: initialType as any,
        shiftId: targetShift?.id || null,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        reason: "",
        notes: "",
      });
    }
  }, [isOpen, selectedShift, defaultType, reset]);

  const requestType = watch("type");
  const selectedShiftId = watch("shiftId");

  const onSubmit = async (data: CreateShiftRequestDTO) => {
    if (!data.startTime || isNaN(new Date(data.startTime).getTime())) {
      return;
    }
    if (new Date(data.startTime).getTime() < Date.now()) {
      return;
    }
    const cleanEndTime = data.endTime && data.endTime !== "" ? data.endTime : undefined;
    try {
      await createMutation.mutateAsync({
        ...data,
        endTime: cleanEndTime,
      });
      onOpenChange(false);
      reset();
    } catch {
      // Mutation handles error state
    }
  };

  const handleShiftSelect = (shiftId: string) => {
    const s = myShifts.find((sh) => sh.id === shiftId);
    if (s) {
      setValue("shiftId", s.id);
      const sStart = new Date(s.startTime || s.rawStartTime || "");
      const sEnd = new Date(s.endTime || s.rawEndTime || "");
      if (!isNaN(sStart.getTime())) {
        setValue("startTime", s.startTime || s.rawStartTime || "");
      }
      if (!isNaN(sEnd.getTime())) {
        setValue("endTime", s.endTime || s.rawEndTime || "");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="rounded-2xl font-['Outfit',sans-serif] sm:max-w-2xl max-h-[92vh] overflow-y-auto sm:overflow-visible">
        <DialogHeader className="gap-1 pb-1">
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
            Submit Shift Request
          </DialogTitle>
          <DialogDescription className="text-md text-slate-500">
            Requests are sent to line managers and rotas will update upon approval.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
          {/* Request Type & Optional Shift Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <div className={cn("space-y-1", !(requestType === "Change" || requestType === "Cover") && "sm:col-span-2")}>
              <Label className="text-md font-semibold text-slate-700">Request Type</Label>
              <Select
                value={requestType || ""}
                onValueChange={(v) => {
                  const newType = v as "Leave" | "Change" | "Cover";
                  setValue("type", newType, { shouldValidate: true });
                  if (newType === "Leave") {
                    setValue("shiftId", null);
                    if (!watch("startTime")) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(8, 0, 0, 0);
                      setValue("startTime", tomorrow.toISOString(), { shouldValidate: true });
                      setValue("endTime", new Date(tomorrow.getTime() + 8 * 3600 * 1000).toISOString(), { shouldValidate: true });
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Request Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Leave">Annual Leave / Day Off</SelectItem>
                  <SelectItem value="Change">Shift Swap / Change</SelectItem>
                  <SelectItem value="Cover">Request Shift Cover</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-md text-red-500 font-medium">Please select a request type</p>
              )}
            </div>

            {/* Shift Selector if swap/cover */}
            {(requestType === "Change" || requestType === "Cover") && (
              <div className="space-y-1">
                <Label className="text-md font-semibold text-slate-700">
                  Select Shift to {requestType === "Change" ? "Swap" : "Cover"}
                </Label>
                <Select onValueChange={handleShiftSelect} value={selectedShiftId || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an assigned shift" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {myShifts
                      .filter((sh) => sh.status !== "Draft" && sh.status !== "Cancelled")
                      .map((sh) => {
                      const d = new Date(sh.startTime || sh.rawStartTime || "");
                      const label = !isNaN(d.getTime())
                        ? `${formatUkDate(d, { weekday: "short", day: "numeric", month: "short" })} · ${sh.type?.name || "Shift"}`
                        : sh.type?.name || "Shift";
                      return (
                        <SelectItem key={sh.id} value={sh.id}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div className="space-y-1">
              <Label required className="text-md font-semibold text-slate-700">Start Time</Label>
              <Controller
                name="startTime"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value ? getUkDateTimeForLocalDisplay(field.value) : undefined}
                    onChange={(d) =>
                      field.onChange(d ? convertLocalDateTimeToUk(d).toISOString() : "")
                    }
                    use12Hours={false}
                    minDate={new Date()}
                    placeholder="Select start time"
                  />
                )}
              />
              {errors.startTime && (
                <Text size="md" variant="error" className="text-md text-rose-600">
                  {errors.startTime.message}
                </Text>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label className="text-md font-semibold text-slate-700">End Time</Label>
                <span className="text-md text-slate-400 font-normal">(Optional)</span>
              </div>
              <Controller
                name="endTime"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value ? getUkDateTimeForLocalDisplay(field.value) : undefined}
                    onChange={(d) => {
                      const iso = d ? convertLocalDateTimeToUk(d).toISOString() : "";
                      field.onChange(iso);
                      if (d && !watch("startTime")) {
                        const autoStart = new Date(d);
                        autoStart.setHours(Math.max(0, d.getHours() - 8));
                        setValue("startTime", autoStart.toISOString(), { shouldValidate: true });
                      }
                    }}
                    use12Hours={false}
                    minDate={new Date()}
                    placeholder="Select end time (optional)"
                  />
                )}
              />
              {errors.endTime && (
                <Text size="md" variant="error" className="text-md text-rose-600">
                  {errors.endTime.message}
                </Text>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <Label className="text-md font-semibold text-slate-700">Reason</Label>
            <Input
              placeholder="e.g. Family appointment, medical, personal"
              {...register("reason")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-md font-semibold text-slate-700">Additional Notes</Label>
            <Textarea
              rows={2}
              className="min-h-[58px] resize-none text-md"
              placeholder="Any details to help rota management..."
              {...register("notes")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Submitting..." : "Submit request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
