"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  Text,
  Label,
  Textarea,
  MultiSelect,
} from "@repo/ui/components/ui";
import { Trash2, Ban, Plus } from "lucide-react";
import { toast } from "@repo/ui/hooks";
import { DeleteConfirmDialog } from "../../../../../../lib/components/shared/DeleteConfirmDialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetShiftTypesQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} from "../../../../../../lib/queries/shifts";
import { useGetResidentsQuery } from "../../../../../../lib/queries/residents/useGetResidentsQuery";
import {
  useGetRoomsQuery,
  useGetBedsQuery,
} from "../../../../../../lib/queries/facility";
import { ShiftStaffSummary } from "./ShiftStaffSummary";
import { ShiftResidentTable } from "./ShiftResidentTable";
import type { ResidentRotaItem } from "./ShiftResidentTableRow";
import { ShiftTimingDetails } from "./ShiftTimingDetails";
import { ShiftRecurringEngine } from "./ShiftRecurringEngine";
import { LocalShiftSchema } from "./mockResidents";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { CreateShiftDTO } from "@repo/schema";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import {
  addUkCalendarDays,
  formatUkDate,
  formatUkTime,
  getLocalCalendarDateString,
  getUkDateString,
  getUkDayEnd,
} from "../../../../../../lib/utils/uk-date-time";

type ShiftCreatePayload = CreateShiftDTO & {
  repeatUntil?: string;
  repeatDays?: number[];
  residentAssignmentConfirmed?: boolean;
  duplicateResidentNames?: string[];
};

export function ShiftDialog({
  isOpen,
  onClose,
  shift,
  existingShifts = [],
  units = [],
  wings = [],
  staff = [],
}: any) {
  const { user } = useAuth();
  const { data: shiftTypes = [] } = useGetShiftTypesQuery();
  const { data: rawApiResidents = [] } = useGetResidentsQuery();
  const apiResidents = useMemo(
    () => rawApiResidents.filter((r: { status?: string }) => r.status === "Active"),
    [rawApiResidents],
  );

  const staffOptions = staff
    .filter((s: any) => s.id !== user?.userId && s.userId !== user?.userId)
    .map((s: any) => ({
      value: s.id,
      label: s.fullName || s.email || "Staff",
    }));

  const createShiftMutation = useCreateShiftMutation();
  const updateShiftMutation = useUpdateShiftMutation();
  const deleteShiftMutation = useDeleteShiftMutation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [pendingSharedAssignment, setPendingSharedAssignment] =
    useState<ShiftCreatePayload | null>(null);
  const [isReplacementMode, setIsReplacementMode] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const { control, handleSubmit, watch, setValue, getValues, setError, reset, formState: { errors } } = useForm({
    resolver: zodResolver(LocalShiftSchema),
    defaultValues: {
      startTime: shift?.startTime ? new Date(shift.startTime) : (null as any),
      endTime: shift?.endTime ? new Date(shift.endTime) : (null as any),
      status: shift?.id ? shift.status || undefined : undefined,
      typeId: shift?.id ? shift.typeId || "custom" : "",
      wingId: shift?.wingId || "none",
      unitId: shift?.unitId || "none",
      roomId: "none",
      bedId: "none",
      notes: "",
      userIds: [],
      residentIds: [],
      repeatUntil: shift?.repeatUntil ? new Date(shift.repeatUntil) : (null as any),
      repeatDays: shift?.startTime ? [new Date(shift.startTime).getDay()] : [],
    },
  });

  const selectedWingId = watch("wingId");
  const selectedUnitId = watch("unitId");
  const selectedRoomId = watch("roomId");
  const selectedBedId = watch("bedId");
  const selectedUserIds = watch("userIds") || [];
  const rawResidentIds: string[] = watch("residentIds") || [];
  const selectedResidentIds: string[] = Array.from(new Set<string>(rawResidentIds));
  const selectedStartTime = watch("startTime");
  const selectedEndTime = watch("endTime");

  // BUG-337: Automatically sync Target Days to match the selected shift day
  const prevStartTimeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedStartTime) return;
    const startObj = new Date(selectedStartTime);
    if (Number.isNaN(startObj.getTime())) return;
    const dateStr = getLocalCalendarDateString(startObj);
    if (prevStartTimeRef.current !== dateStr) {
      prevStartTimeRef.current = dateStr;
      const dayOfWeek = startObj.getDay();
      setValue("repeatDays", [dayOfWeek]);
    }
  }, [selectedStartTime, setValue]);

  const overlappingShiftAssignments = existingShifts.filter((existing: Shift) => {
    if (existing.id === shift?.id) return false;
    const existingStart = new Date(existing.startTime).getTime();
    const existingEnd = new Date(existing.endTime).getTime();
    const proposedStart = selectedStartTime ? new Date(selectedStartTime).getTime() : NaN;
    const proposedEnd = selectedEndTime ? new Date(selectedEndTime).getTime() : NaN;
    return (
      Number.isFinite(existingStart) &&
      Number.isFinite(existingEnd) &&
      Number.isFinite(proposedStart) &&
      Number.isFinite(proposedEnd) &&
      existingStart < proposedEnd &&
      existingEnd > proposedStart
    );
  });

  const dateAssignedStaffByResidentId = new Map<string, { id: string; name: string }>();
  overlappingShiftAssignments.forEach((existing: Shift) => {
    const assignedResidentIds = existing.residentIds?.length
      ? existing.residentIds
      : existing.assignments?.flatMap((assignment) => assignment.assignedResidentIds || []) || [];
    assignedResidentIds.forEach((residentId) => {
      const assignment = existing.assignments?.find(
        (item) => item.userId && item.assignedResidentIds?.includes(residentId),
      );
      if (!assignment) return;
      dateAssignedStaffByResidentId.set(residentId, {
        id: assignment.userId,
        name: assignment.user?.fullName || "another staff member",
      });
    });
  });

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [errors]);

  const { data: apiRooms = [] } = useGetRoomsQuery(
    selectedWingId && selectedWingId !== "none" ? selectedWingId : null
  );

  const { data: apiBeds = [] } = useGetBedsQuery(
    selectedRoomId && selectedRoomId !== "none" ? selectedRoomId : null
  );

  useEffect(() => {
    setIsReplacementMode(false);
    if (isOpen) {
      const rawAssignedIds: string[] = shift?.residentIds?.length
        ? shift.residentIds
        : shift?.assignments
          ?.flatMap((a: any) => a.assignedResidentIds || [])
          .filter(Boolean) || [];

      const uniqueAssignedIds: string[] = Array.from(new Set<string>(rawAssignedIds));

      const initialUserIds: string[] = shift?.assignments?.length
        ? shift.assignments.map((a: any) => a.userId)
        : shift?.userIds?.length
          ? shift.userIds
          : shift?.entityType === "staff" && shift?.entityId
            ? [shift.entityId]
            : [];

      let initialWingId =
        shift?.wingId ||
        (shift?.entityType === "wing" && shift?.entityId
          ? shift.entityId
          : "none");
      let initialUnitId =
        shift?.unitId ||
        (shift?.entityType === "unit" && shift?.entityId
          ? shift.entityId
          : "none");

      if ((!initialWingId || initialWingId === "none") && uniqueAssignedIds.length > 0) {
        const foundResident = (apiResidents as any[]).find((r) =>
          uniqueAssignedIds.includes(r.id),
        );
        const resolvedWing =
          foundResident?.bed?.room?.wingId ||
          foundResident?.bed?.room?.wing?.id ||
          foundResident?.wingId;
        const resolvedUnit =
          foundResident?.bed?.room?.wing?.unitId || foundResident?.unitId;
        if (resolvedWing) initialWingId = resolvedWing;
        if (resolvedUnit && (!initialUnitId || initialUnitId === "none")) initialUnitId = resolvedUnit;
      }

      const baseStart = shift?.startTime ? new Date(shift.startTime) : null;
      const baseEnd = shift?.endTime ? new Date(shift.endTime) : null;

      const initialValues = {
        startTime: baseStart,
        endTime: baseEnd,
        status: shift?.id ? shift.status || undefined : undefined,
        typeId: shift?.id ? shift.typeId || "custom" : "",
        wingId: initialWingId,
        unitId: initialUnitId,
        roomId: shift?.roomId || "none",
        bedId: shift?.bedId || "none",
        notes: shift?.notes || "",
        userIds: initialUserIds,
        residentIds: uniqueAssignedIds,
        repeatUntil: shift?.repeatUntil ? new Date(shift.repeatUntil) : null,
        repeatDays: baseStart ? [baseStart.getDay()] : [],
      };
      reset(initialValues);
    }
  }, [isOpen, shift, reset]);

  const allResidents =
    apiResidents.length > 0
      ? apiResidents.map((r: any) => ({
        id: r.id,
        name: r.fullName,
        roomBed: r.bed
          ? `Bed: ${r.bed.number || r.bed.bedLabel || "--"} | Room: ${r.bed.room?.roomNumber || "--"}`
          : "",
        dependency: r.careProfile?.careCategory || r.careLevel || "Medium",
        conditions: r.careProfile?.chronicConditions?.length
          ? r.careProfile.chronicConditions
          : ["Medication", "Care Plan"],
        status: r.status || "Unknown",
        assignedStaffId: dateAssignedStaffByResidentId.get(r.id)?.id || null,
        assignedStaffName: dateAssignedStaffByResidentId.get(r.id)?.name || null,
        avatar: r.photoUrl || r.avatarUrl,
        bedId: r.bed?.id || r.bedId || null,
        roomId: r.bed?.roomId || r.bed?.room?.id || r.roomId || null,
        wingId:
          r.bed?.room?.wingId || r.bed?.room?.wing?.id || r.wingId || null,
        unitId: r.bed?.room?.wing?.unitId || r.unitId || null,
      }))
      : [];

  // Supported living has no bed allocation: any Active person supported can be rostered.
  const assignableResidents = allResidents.filter(
    (resident: { status?: string }) => resident.status?.toLowerCase() === "active",
  );

  const toggleResident = (id: string) => {
    const current = watch("residentIds") || [];
    if (current.includes(id)) {
      setValue(
        "residentIds",
        current.filter((rId: string) => rId !== id),
        { shouldValidate: true },
      );
    } else {
      const nextResidents = [...current, id];
      setValue("residentIds", nextResidents, { shouldValidate: true });

      const currentWing = watch("wingId");
      if (!currentWing || currentWing === "none") {
        const res = allResidents.find((r: any) => r.id === id);
        if (res?.wingId) {
          setValue("wingId", res.wingId, { shouldValidate: true });
          if (res.unitId && (!watch("unitId") || watch("unitId") === "none")) {
            setValue("unitId", res.unitId, { shouldValidate: true });
          }
          if (res.roomId && nextResidents.length === 1 && (!watch("roomId") || watch("roomId") === "none")) {
            setValue("roomId", res.roomId, { shouldValidate: true });
          }
        }
      }
    }
  };

  const activeStaffList = staff.filter((s: any) =>
    selectedUserIds.includes(s.id)
  );

  const submitShift = (payload: ShiftCreatePayload) => {
    if (shift?.id && !isReplacementMode) {
      updateShiftMutation.mutate(
        { id: shift.id, ...payload },
        {
          onSuccess: onClose,
          onError: (error) => setError("root", { type: "server", message: error.message }),
        },
      );
    } else {
      createShiftMutation.mutate(payload, {
        onSuccess: onClose,
        onError: (error) => setError("root", { type: "server", message: error.message }),
      });
    }
  };

  const handleDeleteDraftShift = () => {
    if (!shift?.id) return;
    deleteShiftMutation.mutate(shift.id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Draft shift deleted successfully",
          variant: "success",
        });
        setIsDeleteDialogOpen(false);
        onClose();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete draft shift",
          variant: "error",
        });
      },
    });
  };

  const handleCancelPublishedShift = () => {
    if (!shift?.id) return;
    if (!cancellationReason.trim()) {
      setCancelReasonError("Cancellation reason is mandatory to withdraw a published shift.");
      return;
    }
    setCancelReasonError("");

    updateShiftMutation.mutate(
      {
        id: shift.id,
        status: "Cancelled",
        cancellationReason: cancellationReason.trim(),
        startTime: shift.startTime,
        endTime: shift.endTime,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Shift cancelled and assigned carers notified",
            variant: "success",
          });
          setIsCancelDialogOpen(false);
          setCancellationReason("");
          setCancelReasonError("");
          onClose();
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to cancel shift",
            variant: "error",
          });
        },
      }
    );
  };

  const onSubmit = (values: any) => {
    if (!shift?.id && new Date(values.startTime).getTime() <= Date.now()) {
      setError("startTime", {
        type: "validate",
        message: "Choose a future start date and time.",
      });
      return;
    }

    if (!selectedResidentIds || selectedResidentIds.length === 0) {
      setError("residentIds", {
        type: "validate",
        message:
          assignableResidents.length === 0
            ? "No active people supported are available. Admit a person supported before scheduling a shift."
            : "Select at least one resident to assign to this shift.",
      });
      return;
    }

    if (!values.startTime) {
      setError("startTime", {
        type: "validate",
        message: "From date is required.",
      });
      return;
    }

    const proposedStart = new Date(values.startTime);
    const proposedEnd = new Date(values.endTime);

    if (values.repeatUntil) {
      const untilD = new Date(values.repeatUntil);
      if (getUkDateString(untilD) < getUkDateString(proposedStart)) {
        setError("repeatUntil", {
          type: "validate",
          message: "To date cannot be earlier than From date.",
        });
        return;
      }
    }

    if (getUkDateString(proposedEnd) < getUkDateString(proposedStart)) {
      setError("endTime", {
        type: "validate",
        message: "End time cannot be on a date earlier than start time.",
      });
      return;
    }

    if (proposedEnd.getTime() <= proposedStart.getTime()) {
      proposedEnd.setTime(addUkCalendarDays(proposedEnd, 1).getTime());
    }
    const selectedStaffIds: string[] = values.userIds || [];
    const conflictingShift = existingShifts.find((existing: Shift) => {
      if (existing.id === shift?.id) return false;
      const existingStaffIds = existing.assignments?.map(
        (assignment: { userId: string }) => assignment.userId,
      ) || existing.userIds || [];
      const sharesStaff = existingStaffIds.some((userId) => selectedStaffIds.includes(userId));
      if (!sharesStaff) return false;
      return (
        new Date(existing.startTime).getTime() < proposedEnd.getTime() &&
        new Date(existing.endTime).getTime() > proposedStart.getTime()
      );
    });

    if (conflictingShift) {
      const conflictingStaffId = (conflictingShift.assignments?.map(
        (assignment: { userId: string }) => assignment.userId,
      ) || conflictingShift.userIds || []).find((userId: string) =>
        selectedStaffIds.includes(userId),
      );
      const conflictingStaff = staff.find((member: { id: string }) =>
        member.id === conflictingStaffId,
      );
      const conflictName = conflictingStaff?.fullName || "The selected staff member";
      const conflictType = conflictingShift.type?.name || "existing shift";
      const conflictDate = formatUkDate(new Date(conflictingShift.startTime), {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const conflictStart = formatUkTime(new Date(conflictingShift.startTime));
      const conflictEnd = formatUkTime(new Date(conflictingShift.endTime));
      setError("root", {
        type: "validate",
        message: `${conflictName} is already assigned to ${conflictType} on ${conflictDate}, ${conflictStart}–${conflictEnd}. Change the new shift time or remove the conflicting rota entry before saving.`,
      });
      return;
    }

    let finalWingId = values.wingId === "none" || !values.wingId ? null : values.wingId;
    let finalUnitId = values.unitId === "none" || !values.unitId ? null : values.unitId;
    let finalRoomId = values.roomId === "none" || !values.roomId ? null : values.roomId;

    if (!finalWingId && selectedResidentIds.length > 0) {
      const residentWithWing = allResidents.find(
        (r: any) => selectedResidentIds.includes(r.id) && r.wingId,
      );
      if (residentWithWing) {
        finalWingId = residentWithWing.wingId;
        if (!finalUnitId && residentWithWing.unitId) {
          finalUnitId = residentWithWing.unitId;
        }
        if (!finalRoomId && residentWithWing.roomId && selectedResidentIds.length === 1) {
          finalRoomId = residentWithWing.roomId;
        }
      }
    }

    const payload: ShiftCreatePayload = {
      typeId:
        values.typeId === "custom" || !values.typeId ? null : values.typeId,
      unitId: finalUnitId,
      wingId: finalWingId,
      roomId: finalRoomId,
      startTime: new Date(values.startTime).toISOString(),
      endTime: proposedEnd.toISOString(),
      status: values.status,
      notes: values.notes || null,
      userIds: values.userIds || [],
      residentIds: selectedResidentIds,
      residentAssignmentConfirmed: false,
      repeatUntil: values.repeatUntil
        ? getUkDayEnd(
            getLocalCalendarDateString(new Date(values.repeatUntil)),
          ).toISOString()
        : undefined,
      repeatDays:
        values.repeatUntil && values.repeatDays && values.repeatDays.length > 0
          ? values.repeatDays
          : undefined,
    };

    const selectedResidentIdList = selectedResidentIds;
    const duplicateResidentNames = selectedResidentIdList
      .filter((residentId) => dateAssignedStaffByResidentId.has(residentId))
      .map((residentId) => {
        const resident = allResidents.find((item: ResidentRotaItem) => item.id === residentId);
        return resident?.name || residentId;
      });
    const needsResidentAssignmentConfirmation =
      !shift?.id &&
      duplicateResidentNames.length > 0;

    if (needsResidentAssignmentConfirmation) {
      setPendingSharedAssignment({
        ...payload,
        duplicateResidentNames,
      });
      return;
    }

    submitShift(payload);
  };

  const topErrorMessage =
    errors.root?.message ||
    (errors.repeatUntil?.message as string | undefined) ||
    (errors.endTime?.message as string | undefined) ||
    (errors.startTime?.message as string | undefined) ||
    (errors.residentIds?.message as string | undefined) ||
    (errors.userIds?.message as string | undefined) ||
    (errors.typeId?.message as string | undefined) ||
    (errors.status?.message as string | undefined) ||
    "Complete all required fields (staff, shift pattern, status, from date, to date, and resident assignment) before saving.";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent size="5xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle asChild>
            <Text size="xl" weight="bold" className="text-slate-900">
              {isReplacementMode
                ? "Schedule Replacement Shift"
                : shift?.id
                  ? shift?.status === "Cancelled"
                    ? "Cancelled Shift Details"
                    : "Edit Staff Shift"
                  : "Schedule New Shift"}
            </Text>
          </DialogTitle>
          <DialogDescription asChild>
            <Text size="md" weight="regular" className="text-slate-500">
              Assign staff members, set work timing, and balance resident care dependencies.
            </Text>
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {Object.keys(errors).length > 0 && (
            <div ref={errorBannerRef}>
              <Card variant="surface" className="border border-rose-200 bg-rose-50 p-4 shadow-none">
                <Text size="md" weight="semibold" className="text-rose-800">
                  {topErrorMessage}
                </Text>
              </Card>
            </div>
          )}

          {shift?.id && shift?.status === "Cancelled" && !isReplacementMode && (
            <Card variant="surface" className="border border-rose-200 bg-rose-50/60 p-4 shadow-none">
              <div className="flex items-start gap-2.5">
                <Ban className="size-5 text-rose-600 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <Text size="md" weight="bold" className="text-rose-900">
                    This shift has been cancelled
                  </Text>
                  <Text size="md" className="text-rose-700">
                    {shift.cancellationReason
                      ? `Reason: ${shift.cancellationReason}`
                      : "No specific cancellation reason was provided."}
                  </Text>
                  <Text size="md" className="text-rose-600 mt-0.5">
                    Click &quot;Schedule Replacement Shift&quot; below to assign a new carer to this slot with the same care requirements.
                  </Text>
                </div>
              </div>
            </Card>
          )}

          {/* 1. Staff Selector & Summary */}
          <Card variant="surface" className="p-4 sm:p-5 shadow-none space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label required>Assign Staff Member(s)</Label>
              <Controller
                name="userIds"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={staffOptions}
                    value={staffOptions.filter((opt: any) =>
                      (field.value || []).includes(opt.value)
                    )}
                    onChange={(selected: any) => {
                      field.onChange((selected || []).map((s: any) => s.value));
                    }}
                    placeholder="Search and select staff..."
                  />
                )}
              />
            </div>

            <ShiftStaffSummary
              activeStaffList={activeStaffList}
              selectedResidentCount={selectedResidentIds.length}
            />
          </Card>

          {/* 2. Shift Details & Timing */}
          <ShiftTimingDetails
            control={control}
            setValue={setValue}
            shiftTypes={shiftTypes}
            isPastShift={Boolean(
              shift?.id &&
              shift?.endTime &&
              new Date(shift.endTime) < new Date()
            )}
            initialStatus={isReplacementMode ? "Draft" : shift?.status}
            isEditMode={Boolean(shift?.id) && !isReplacementMode}
          />

          {/* 3. Bulk Recurring Schedule (Optional) - BUG-341 */}
          {(shift?.status !== "Cancelled" || isReplacementMode) && (
            <ShiftRecurringEngine
              control={control}
              watch={watch}
              setValue={setValue}
              getValues={getValues}
            />
          )}

          {/* 4. Facility Allocation & Resident Matching */}
          <Card variant="surface" className="p-4 sm:p-5 shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <Text variant="base-medium" className="text-slate-900 font-bold">
                Facility Allocation &amp; Resident Care Matching <span className="text-rose-500">*</span>
              </Text>
              {errors.residentIds?.message && (
                <Text size="md" weight="semibold" className="text-rose-600">
                  {String(errors.residentIds.message)}
                </Text>
              )}
            </div>

            <ShiftResidentTable
              allResidents={assignableResidents}
              selectedResidentIds={selectedResidentIds}
              onToggleResident={toggleResident}
              onClearResidents={() => setValue("residentIds", [], { shouldValidate: true })}
              onSetResidentIds={(ids) => setValue("residentIds", ids, { shouldValidate: true })}
              units={units}
              wings={wings}
              rooms={apiRooms}
              beds={apiBeds}
              selectedUnitId={selectedUnitId}
              selectedWingId={selectedWingId}
              selectedRoomId={selectedRoomId}
              selectedBedId={selectedBedId}
              onUnitChange={(val) => {
                setValue("unitId", val);
                setValue("wingId", "none");
                setValue("roomId", "none");
                setValue("bedId", "none");
              }}
              onWingChange={(val) => {
                setValue("wingId", val);
                setValue("roomId", "none");
                setValue("bedId", "none");
              }}
              onRoomChange={(val) => {
                setValue("roomId", val);
                setValue("bedId", "none");
              }}
              onBedChange={(val) => setValue("bedId", val)}
            />
          </Card>

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {shift?.id && !isReplacementMode && shift?.status === "Draft" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={deleteShiftMutation.isPending || updateShiftMutation.isPending}
                  className="h-10 w-10 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl"
                  title="Delete Draft Shift"
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete Draft Shift</span>
                </Button>
              )}
              {shift?.id && !isReplacementMode && shift?.status === "Published" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCancelDialogOpen(true)}
                  disabled={deleteShiftMutation.isPending || updateShiftMutation.isPending}
                  className="h-10 px-3.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-300 rounded-xl gap-2 font-semibold text-md"
                >
                  <Ban className="size-4" />
                  Cancel Shift
                </Button>
              )}
              {shift?.id && !isReplacementMode && shift?.status === "Cancelled" && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-md font-semibold">
                  <Ban className="size-4" />
                  Shift is Cancelled
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {shift?.id && !isReplacementMode && shift?.status === "Cancelled" && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setIsReplacementMode(true);
                    setValue("status", "Draft");
                    setValue("userIds", []);
                  }}
                  className="rounded-xl px-4 font-semibold gap-1.5"
                >
                  <Plus className="size-4" />
                  Schedule Replacement Shift
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl px-4 font-semibold"
              >
                {shift?.status === "Cancelled" && !isReplacementMode ? "Close" : "Cancel"}
              </Button>
              {(shift?.status !== "Cancelled" || isReplacementMode) && (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    createShiftMutation.isPending ||
                    updateShiftMutation.isPending ||
                    assignableResidents.length === 0
                  }
                  title={
                    assignableResidents.length === 0
                      ? "Admit at least one person supported before scheduling a shift"
                      : undefined
                  }
                  className="rounded-xl px-5 font-semibold shadow-none"
                >
                  {createShiftMutation.isPending || updateShiftMutation.isPending
                    ? "Saving..."
                    : shift?.id && !isReplacementMode
                      ? "Update Shift"
                      : "Create Schedule"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingSharedAssignment !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSharedAssignment(null);
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm resident assignment</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSharedAssignment?.duplicateResidentNames?.length
                ? `${pendingSharedAssignment.duplicateResidentNames.join(", ")} is already assigned during the overlapping shift time. Confirm that assigning this resident to another staff member is intentional.`
                : "Confirm that the selected resident assignments are correct before continuing."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel onClick={() => setPendingSharedAssignment(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="primary"
              className="w-full sm:w-auto"
              onClick={(event) => {
                event.preventDefault();
                if (!pendingSharedAssignment) return;
                setPendingSharedAssignment(null);
                submitShift({
                  ...pendingSharedAssignment,
                  residentAssignmentConfirmed: true,
                });
              }}
              disabled={createShiftMutation.isPending}
            >
              Confirm &amp; Create Shift
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Draft Shift"
        description="Are you sure you want to delete this draft shift? This action will permanently remove it from the rota."
        confirmText="Delete"
        onConfirm={handleDeleteDraftShift}
        isDeleting={deleteShiftMutation.isPending}
      />

      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          setIsCancelDialogOpen(open);
          if (!open) {
            setCancellationReason("");
            setCancelReasonError("");
          }
        }}
      >
        <DialogContent size="sm" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Published Shift</DialogTitle>
            <DialogDescription>
              Once cancelled, this shift cannot be re-activated. A mandatory cancellation reason is required for compliance and carer notification.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-1.5">
            <Label htmlFor="cancelReason" required>
              Cancellation Reason
            </Label>
            <Textarea
              id="cancelReason"
              value={cancellationReason}
              onChange={(e) => {
                setCancellationReason(e.target.value);
                if (e.target.value.trim()) setCancelReasonError("");
              }}
              placeholder="e.g. Resident hospitalized, low wing occupancy, staff reallocation..."
              rows={3}
              className={cancelReasonError ? "border-rose-500 focus:ring-rose-500" : ""}
            />
            {cancelReasonError && (
              <p className="text-md font-medium text-rose-600">
                {cancelReasonError}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCancelDialogOpen(false);
                setCancellationReason("");
                setCancelReasonError("");
              }}
              disabled={updateShiftMutation.isPending}
            >
              Keep Shift
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelPublishedShift}
              disabled={updateShiftMutation.isPending}
            >
              {updateShiftMutation.isPending ? "Cancelling..." : "Cancel Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
