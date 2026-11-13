"use client";

import React from "react";
import { type UseFormRegister, type Control, Controller } from "react-hook-form";
import { ArrowLeft, ArrowRight, UserCheck } from "lucide-react";
import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import type { UpdateEnquiryAssessmentDTO } from "@repo/schema";
import { ENQUIRY_STATUSES } from "../../types";

interface WizardStep3Props {
  register: UseFormRegister<UpdateEnquiryAssessmentDTO>;
  control: Control<UpdateEnquiryAssessmentDTO>;
  isLoading: boolean;
  onBack: () => void;
  onAdmitResident: () => void;
  onFinish: () => void;
}

export function WizardStep3({
  register,
  control,
  isLoading,
  onBack,
  onAdmitResident,
  onFinish,
}: WizardStep3Props) {
  return (
    <div className="space-y-4 pt-1">
      {/* Admission Target & Room Preferences Card */}
      <Card className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-none">
        <Text size="md" weight="semibold" className="text-slate-900 tracking-wider">
          Admission Target & Room Preferences
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="targetAdmissionDate">Target Move-in Date</Label>
            <Controller
              name="targetAdmissionDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                  placeholder="Select target move-in date"
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preferredRoomType">Preferred Room / Floor</Label>
            <Input
              id="preferredRoomType"
              placeholder="e.g. Single En-suite, Ground floor"
              {...register("preferredRoomType")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Workflow System Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger className="h-9 text-md bg-white border-slate-200">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {ENQUIRY_STATUSES.map((st) => (
                    <SelectItem key={st} value={st} className="text-md">
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Additional Admission Notes</Label>
          <Textarea
            id="notes"
            placeholder="e.g. Family agreed to visit on Tuesday to finalise contract details..."
            {...register("notes")}
            className="text-md min-h-16"
          />
        </div>
      </Card>

      {/* Seamless Resident Admission Callout Banner */}
      <div className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <div className="font-bold text-md flex items-center justify-center sm:justify-start gap-2">
            <UserCheck className="size-4 text-emerald-300" />
            Ready to Admit Resident?
          </div>
          <Text size="md" className="text-emerald-100">
            Transition this prospect directly into the official 5-step resident admission flow with pre-filled details.
          </Text>
        </div>
        <Button
          type="button"
          onClick={onAdmitResident}
          className="h-10 px-5 font-bold bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl shrink-0 shadow-xs gap-2 cursor-pointer"
        >
          Admit Resident Now <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Back to Assessment
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onFinish}
          disabled={isLoading}
          className="h-10 px-5 rounded-xl cursor-pointer"
        >
          Finish & Save Enquiry
        </Button>
      </div>
    </div>
  );
}
