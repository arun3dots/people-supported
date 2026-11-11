import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateCarePlanTaskSchema, CreateCarePlanTaskDTO } from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from "@repo/ui/components/ui";
import { useCreateCarePlanTaskMutation } from "../../../lib/queries/residents";

interface AddCarePlanTaskDialogProps {
  residentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  "Personal Care",
  "Clinical",
  "Nutrition",
  "Mobility",
  "Social",
  "Other",
];
const FREQUENCIES = ["Daily", "Twice Daily", "Weekly", "Custom"];
const TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Night"];

export function AddCarePlanTaskDialog({
  residentId,
  open,
  onOpenChange,
}: AddCarePlanTaskDialogProps) {
  const mutation = useCreateCarePlanTaskMutation(residentId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateCarePlanTaskDTO>({
    resolver: zodResolver(CreateCarePlanTaskSchema),
    defaultValues: {
      residentId,
      title: "",
      description: "",
      category: "Personal Care",
      frequency: "Daily",
      timeOfDay: ["Morning"],
      priority: "Medium",
    },
  });

  const onSubmit = (data: CreateCarePlanTaskDTO) => {
    mutation.mutate(
      { ...data, residentId },
      {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add Care Plan Task</DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="e.g. Morning Wash"
              {...register("title")}
              errorMessage={errors.title?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide details about how to perform this task..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-md text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-md text-red-500">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && (
                <p className="text-md text-red-500">
                  {errors.priority.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Controller
              name="frequency"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.frequency && (
              <p className="text-md text-red-500">{errors.frequency.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Time of Day</Label>
            <Controller
              name="timeOfDay"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot} className="flex items-center space-x-2">
                      <Checkbox
                        id={`slot-${slot}`}
                        checked={field.value?.includes(slot)}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, slot]);
                          } else {
                            field.onChange(
                              current.filter((s: string) => s !== slot),
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`slot-${slot}`}
                        className="font-normal cursor-pointer"
                      >
                        {slot}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            />
            {errors.timeOfDay && (
              <p className="text-md text-red-500 mt-1">
                {errors.timeOfDay.message}
              </p>
            )}
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
              {mutation.isPending ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
