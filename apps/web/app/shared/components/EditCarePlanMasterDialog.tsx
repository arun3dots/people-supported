import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateCarePlanMasterSchema, UpdateCarePlanMasterDTO } from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DatePicker,
} from "@repo/ui/components/ui";
import { useUpdateCarePlanMasterMutation } from "../../../lib/queries/residents";
import { useGetStaffQuery } from "../../../lib/queries/staff";

interface CarePlanMasterShape {
  status?: UpdateCarePlanMasterDTO["status"];
  validFrom?: string | Date;
  nextReviewDate?: string | Date;
  approvedById?: string | null;
  secondaryApprovedById?: string | null;
  doctorsInvolved?: string[] | string;
  departments?: string[] | string;
}

interface EditCarePlanMasterDialogProps {
  residentId: string;
  carePlan?: CarePlanMasterShape | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCarePlanMasterDialog({
  residentId,
  carePlan,
  open,
  onOpenChange,
}: EditCarePlanMasterDialogProps) {
  const mutation = useUpdateCarePlanMasterMutation(residentId);
  const { data: staffList = [] } = useGetStaffQuery();

  const formatDateForInput = (dateString?: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatListToString = (val?: string[] | string) => {
    if (Array.isArray(val)) return val.join(", ");
    return val || "";
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateCarePlanMasterDTO>({
    resolver: zodResolver(UpdateCarePlanMasterSchema),
    defaultValues: {
      status: carePlan?.status || "Active",
      validFrom: formatDateForInput(carePlan?.validFrom),
      nextReviewDate: formatDateForInput(carePlan?.nextReviewDate),
      approvedById: carePlan?.approvedById || undefined,
      secondaryApprovedById: carePlan?.secondaryApprovedById || undefined,
      doctorsInvolved: formatListToString(carePlan?.doctorsInvolved),
      departments: formatListToString(carePlan?.departments),
    },
  });

  // Re-sync values when dialog opens with a new or updated carePlan
  React.useEffect(() => {
    if (open) {
      reset({
        status: carePlan?.status || "Active",
        validFrom: formatDateForInput(carePlan?.validFrom),
        nextReviewDate: formatDateForInput(carePlan?.nextReviewDate),
        approvedById: carePlan?.approvedById || undefined,
        secondaryApprovedById: carePlan?.secondaryApprovedById || undefined,
        doctorsInvolved: formatListToString(carePlan?.doctorsInvolved),
        departments: formatListToString(carePlan?.departments),
      });
    }
  }, [open, carePlan, reset]);

  const parseValidDate = (val?: string | Date) => {
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  const onSubmit = (data: UpdateCarePlanMasterDTO) => {
    const formattedData: UpdateCarePlanMasterDTO = {
      status: data.status,
      validFrom: parseValidDate(data.validFrom),
      nextReviewDate: parseValidDate(data.nextReviewDate),
      approvedById: data.approvedById && data.approvedById !== "none" ? data.approvedById : null,
      secondaryApprovedById:
        data.secondaryApprovedById && data.secondaryApprovedById !== "none"
          ? data.secondaryApprovedById
          : null,
      doctorsInvolved:
        typeof data.doctorsInvolved === "string"
          ? data.doctorsInvolved
              .split(",")
              .map((d) => d.trim())
              .filter(Boolean)
          : data.doctorsInvolved,
      departments:
        typeof data.departments === "string"
          ? data.departments
              .split(",")
              .map((d) => d.trim())
              .filter(Boolean)
          : data.departments,
    };

    mutation.mutate(formattedData, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {carePlan ? "Edit Care Plan Master" : "Create Care Plan Master"}
          </DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From</Label>
              <Controller
                name="validFrom"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(d) => field.onChange(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "")}
                    placeholder="Select valid from date"
                    errorMessage={errors.validFrom?.message}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextReviewDate">Next Review Date</Label>
              <Controller
                name="nextReviewDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(d) => field.onChange(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "")}
                    placeholder="Select next review date"
                    errorMessage={errors.nextReviewDate?.message}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Primary Approver</Label>
            <Controller
              name="approvedById"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Primary Approver</SelectItem>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.approvedById && (
              <p className="text-sm text-text-error font-medium min-h-[18px] mt-1">{errors.approvedById.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Secondary Approver</Label>
            <Controller
              name="secondaryApprovedById"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Secondary Approver</SelectItem>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.secondaryApprovedById && (
              <p className="text-sm text-text-error font-medium min-h-[18px] mt-1">
                {errors.secondaryApprovedById.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctorsInvolved">Doctors Involved (comma separated)</Label>
            <Input
              id="doctorsInvolved"
              placeholder="e.g. Dr. John Doe, Dr. Sarah Smith"
              {...register("doctorsInvolved")}
              errorMessage={errors.doctorsInvolved?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="departments">Departments Involved (comma separated)</Label>
            <Input
              id="departments"
              placeholder="e.g. Cardiology, Nutrition, Physiotherapy"
              {...register("departments")}
              errorMessage={errors.departments?.message}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? carePlan
                  ? "Saving..."
                  : "Creating..."
                : carePlan
                  ? "Save Changes"
                  : "Create Care Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
