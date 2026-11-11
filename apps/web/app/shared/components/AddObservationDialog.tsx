"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ObservationSchema,
  ObservationDTO,
  calculateNEWS2Score,
} from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Label,
} from "@repo/ui/components/ui";
import { useCreateObservationMutation } from "../../../lib/queries/residents";

interface AddObservationDialogProps {
  residentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddObservationDialog({
  residentId,
  open,
  onOpenChange,
}: AddObservationDialogProps) {
  const mutation = useCreateObservationMutation(residentId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<ObservationDTO>({
    resolver: zodResolver(ObservationSchema) as Resolver<ObservationDTO>,
    defaultValues: {
      residentId,
      temp: null,
      pulse: null,
      bpSystolic: null,
      bpDiastolic: null,
      respiration: null,
      spo2: null,
      spo2Scale: 1,
      airOrOxygen: "Air",
      consciousness: "Alert",
      isAbnormal: false,
      notifyGP: false,
      increaseMonitoring: false,
      notes: "",
      news2Score: null,
    },
  });

  const watchAllFields = watch();

  // Prevent infinite loop by memoizing the score calculation and avoiding direct state updates in effect
  const news2Info = useMemo(
    () => calculateNEWS2Score(watchAllFields),
    [watchAllFields],
  );

  useEffect(() => {
    // Side effects based on score
    if (news2Info.score >= 5) {
      if (!getValues("isAbnormal")) setValue("isAbnormal", true);
      if (!getValues("increaseMonitoring"))
        setValue("increaseMonitoring", true);
    }
  }, [news2Info.score, setValue, getValues]);

  const onSubmit = async (data: ObservationDTO) => {
    mutation.mutate(
      { ...data, news2Score: news2Info.score },
      {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      },
    );
  };

  const getScoreColor = (score: number) => {
    if (score === 0) return "bg-[#4A706A] hover:bg-[#3D5E59]";
    if (score <= 4) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getParameterScoreColor = (pScore: number | undefined) => {
    if (pScore === undefined || pScore === 0)
      return "bg-[#4A706A]/10 text-[#4A706A] border-[#4A706A]/30";
    if (pScore === 1) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (pScore === 2) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle>Record New Observation</DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex justify-between">
                Temperature (°C)
                <Badge
                  variant="outline"
                  className={getParameterScoreColor(news2Info.details.temp)}
                >
                  Score: {news2Info.details.temp || 0}
                </Badge>
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="36.5"
                {...register("temp", { valueAsNumber: true })}
                errorMessage={errors.temp?.message?.toString()}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex justify-between">
                Pulse (bpm)
                <Badge
                  variant="outline"
                  className={getParameterScoreColor(news2Info.details.pulse)}
                >
                  Score: {news2Info.details.pulse || 0}
                </Badge>
              </Label>
              <Input
                type="number"
                placeholder="72"
                {...register("pulse", { valueAsNumber: true })}
                errorMessage={errors.pulse?.message?.toString()}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Blood Pressure (mmHg)</span>
                <Badge
                  variant="outline"
                  className={getParameterScoreColor(
                    news2Info.details.bpSystolic,
                  )}
                >
                  Score: {news2Info.details.bpSystolic || 0}
                </Badge>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Systolic (120)"
                    {...register("bpSystolic", { valueAsNumber: true })}
                    errorMessage={errors.bpSystolic?.message?.toString()}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Diastolic (80)"
                    {...register("bpDiastolic", { valueAsNumber: true })}
                    errorMessage={errors.bpDiastolic?.message?.toString()}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex justify-between">
                Respiration (bpm)
                <Badge
                  variant="outline"
                  className={getParameterScoreColor(
                    news2Info.details.respiration,
                  )}
                >
                  Score: {news2Info.details.respiration || 0}
                </Badge>
              </Label>
              <Input
                type="number"
                placeholder="16"
                {...register("respiration", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex justify-between">
                Oxygen Saturation (%)
                <Badge
                  variant="outline"
                  className={getParameterScoreColor(news2Info.details.spo2)}
                >
                  Score: {news2Info.details.spo2 || 0}
                </Badge>
              </Label>
              <Input
                type="number"
                placeholder="98"
                {...register("spo2", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>SpO2 Scale</Label>
              <Select
                onValueChange={(v) => setValue("spo2Scale", parseInt(v))}
                defaultValue={watchAllFields.spo2Scale?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Scale 1 (Normal)</SelectItem>
                  <SelectItem value="2">Scale 2 (COPD/Hypercapnic)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex justify-between">
                Air or Oxygen?
                <Badge
                  variant="outline"
                  className={getParameterScoreColor(
                    news2Info.details.airOrOxygen,
                  )}
                >
                  Score: {news2Info.details.airOrOxygen || 0}
                </Badge>
              </Label>
              <Select
                onValueChange={(v) => setValue("airOrOxygen", v)}
                defaultValue={watchAllFields.airOrOxygen || "Air"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Air">Air</SelectItem>
                  <SelectItem value="Oxygen">Oxygen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex justify-between">
                Consciousness
                <Badge
                  variant="outline"
                  className={getParameterScoreColor(
                    news2Info.details.consciousness,
                  )}
                >
                  Score: {news2Info.details.consciousness || 0}
                </Badge>
              </Label>
              <Select
                onValueChange={(v) => setValue("consciousness", v)}
                defaultValue={watchAllFields.consciousness || "Alert"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alert">Alert</SelectItem>
                  <SelectItem value="Confusion">New Confusion</SelectItem>
                  <SelectItem value="Voice">Responds to Voice</SelectItem>
                  <SelectItem value="Pain">Responds to Pain</SelectItem>
                  <SelectItem value="Unresponsive">Unresponsive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label>Clinical Notes</Label>
              <Textarea
                placeholder="Enter any specific clinical notes..."
                className="min-h-[100px]"
                {...register("notes")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-white">
                <Checkbox
                  checked={watchAllFields.isAbnormal}
                  onCheckedChange={(v) => setValue("isAbnormal", !!v)}
                />
                <Label className="font-medium cursor-pointer">
                  Mark as Abnormal
                </Label>
              </div>
              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-white">
                <Checkbox
                  checked={watchAllFields.notifyGP}
                  onCheckedChange={(v) => setValue("notifyGP", !!v)}
                />
                <Label className="font-medium cursor-pointer">Notify GP</Label>
              </div>
              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-white">
                <Checkbox
                  checked={watchAllFields.increaseMonitoring}
                  onCheckedChange={(v) => setValue("increaseMonitoring", !!v)}
                />
                <Label className="font-medium cursor-pointer">
                  Increase Monitoring
                </Label>
              </div>
            </div>
          </div>

          <div
            className={`mt-6 p-4 rounded-xl text-white flex items-center justify-between shadow-lg ${getScoreColor(news2Info.score)}`}
          >
            <div>
              <p className="text-sm font-semibold">
                Total NEWS2 Score
              </p>
              <p className="text-md opacity-75 mt-1">
                Calculated based on news2 parameters
              </p>
            </div>
            <div className="text-4xl font-black bg-white/20 px-4 py-2 rounded-lg">
              {news2Info.score}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4A706A] hover:bg-[#3D5E59] text-white min-w-[120px] rounded-xl font-medium shadow-xs cursor-pointer"
            >
              Save Observation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
