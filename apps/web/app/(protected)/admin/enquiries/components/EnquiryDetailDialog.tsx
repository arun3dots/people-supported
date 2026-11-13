"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateEnquiryAssessmentSchema,
  type UpdateEnquiryAssessmentDTO,
  type EnquiryResponseDTO,
} from "@repo/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Badge,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import { UserCheck, ArrowRight, Phone, Mail, Activity } from "lucide-react";
import { useUpdateEnquiryMutation } from "../../../../../lib/queries/enquiries";
import { DEPENDENCY_LEVELS, ENQUIRY_STATUSES, type EnquiryStatus } from "../types";

interface EnquiryDetailDialogProps {
  enquiry: EnquiryResponseDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnquiryDetailDialog({
  enquiry,
  open,
  onOpenChange,
}: EnquiryDetailDialogProps) {
  const router = useRouter();
  const updateMutation = useUpdateEnquiryMutation(enquiry?.id || "");

  const {
    register,
    handleSubmit,
    control,
    reset,
  } = useForm<UpdateEnquiryAssessmentDTO>({
    resolver: zodResolver(UpdateEnquiryAssessmentSchema),
    defaultValues: {
      status: (enquiry?.status as EnquiryStatus) || "Enquiry",
      medicalNeeds: enquiry?.medicalNeeds || "",
      dependencyLevel: enquiry?.dependencyLevel || "Medium",
      mobilityNeeds: enquiry?.mobilityNeeds || "",
      dietaryRequirements: enquiry?.dietaryRequirements || "",
      riskNotes: enquiry?.riskNotes || "",
      targetAdmissionDate: enquiry?.targetAdmissionDate
        ? new Date(enquiry.targetAdmissionDate).toISOString().split("T")[0]
        : "",
      preferredRoomType: enquiry?.preferredRoomType || "",
      notes: enquiry?.notes || "",
    },
  });

  useEffect(() => {
    if (open && enquiry) {
      reset({
        status: (enquiry.status as EnquiryStatus) || "Enquiry",
        medicalNeeds: enquiry.medicalNeeds || "",
        dependencyLevel: enquiry.dependencyLevel || "Medium",
        mobilityNeeds: enquiry.mobilityNeeds || "",
        dietaryRequirements: enquiry.dietaryRequirements || "",
        riskNotes: enquiry.riskNotes || "",
        targetAdmissionDate: enquiry.targetAdmissionDate
          ? new Date(enquiry.targetAdmissionDate).toISOString().split("T")[0]
          : "",
        preferredRoomType: enquiry.preferredRoomType || "",
        notes: enquiry.notes || "",
      });
    }
  }, [open, enquiry, reset]);

  if (!enquiry) return null;

  const handleAdmitClick = () => {
    onOpenChange(false);
    if (enquiry.convertedResidentId) {
      router.push(`/admin/residents/admit?enquiryId=${enquiry.id}&id=${enquiry.convertedResidentId}`);
    } else {
      router.push(`/admin/residents/admit?enquiryId=${enquiry.id}`);
    }
  };

  const onSubmit = (data: UpdateEnquiryAssessmentDTO) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const getStatusBadgeState = (status: string) => {
    switch (status) {
      case "Admitted":
        return "success";
      case "Ready for Admission":
        return "info";
      case "Assessment Pending":
        return "warning";
      case "Closed":
        return "inactive";
      default:
        return "info";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="font-['Outfit',sans-serif]">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                  {enquiry.firstName} {enquiry.lastName}
                </DialogTitle>
                <Badge
                  variant="secondary"
                  state={getStatusBadgeState(enquiry.status)}
                  className="px-2.5 py-0.5 shadow-none"
                >
                  {enquiry.status}
                </Badge>
              </div>
              <DialogDescription className="text-md text-slate-500 mt-0.5">
                Care Category: <strong className="text-slate-700">{enquiry.careCategory}</strong> • Location: <strong className="text-slate-700">{enquiry.currentLocation}</strong>
              </DialogDescription>
            </div>

            {/* Stage 3 Action: Admit Resident Button */}
            <Button
              type="button"
              variant="primary"
              disabled={enquiry.status === "Closed"}
              onClick={(e) => {
                if (enquiry.status === "Closed") return;
                handleAdmitClick();
              }}
              className="h-9 px-4 rounded-xl cursor-pointer flex items-center gap-2 shrink-0 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCheck className="size-4" /> Admit Resident <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Quick Contact Bar (Stage 1 info) */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-md">
          <div className="flex items-center gap-2 text-slate-600">
            <UserCheck className="size-3.5 text-slate-400 shrink-0" />
            <span>Enquirer: <strong className="text-slate-900">{enquiry.enquirerName}</strong> ({enquiry.enquirerRelationship})</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="size-3.5 text-slate-400 shrink-0" />
            <span>{enquiry.enquirerPhone}</span>
          </div>
          {enquiry.enquirerEmail && (
            <div className="flex items-center gap-2 text-slate-600 truncate">
              <Mail className="size-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{enquiry.enquirerEmail}</span>
            </div>
          )}
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Stage 2: Pre-Admission Assessment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Activity className="size-4 text-emerald-800" />
              <Text size="md" weight="medium" className="text-slate-900 font-semibold">
                Stage 2: Pre-Admission Assessment &amp; Fit Check
              </Text>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>System Workflow Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11 bg-white border-slate-200">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENQUIRY_STATUSES.map((st) => (
                          <SelectItem key={st} value={st}>
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Dependency Level</Label>
                <Controller
                  name="dependencyLevel"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="h-11 bg-white border-slate-200">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPENDENCY_LEVELS.map((lvl) => (
                          <SelectItem key={lvl} value={lvl}>
                            {lvl} Dependency
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="medicalNeeds">Medical Needs &amp; Clinical Care Requests</Label>
              <Textarea
                id="medicalNeeds"
                placeholder="e.g. Requires assistance with insulin administration, hypertension monitoring..."
                {...register("medicalNeeds")}
                className="text-md min-h-16 bg-white border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mobilityNeeds">Mobility &amp; Equipment Needs</Label>
                <Input
                  id="mobilityNeeds"
                  placeholder="e.g. Uses Zimmer frame, requires 1-carer assist"
                  {...register("mobilityNeeds")}
                  className="h-11 bg-white border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dietaryRequirements">Dietary &amp; Food Requirements</Label>
                <Input
                  id="dietaryRequirements"
                  placeholder="e.g. Pureed diet, diabetic, low sodium"
                  {...register("dietaryRequirements")}
                  className="h-11 bg-white border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="riskNotes">Risk Factors &amp; Notes for Assessment</Label>
              <Textarea
                id="riskNotes"
                placeholder="e.g. High fall risk during night, wandering tendency..."
                {...register("riskNotes")}
                className="text-md min-h-16 bg-white border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Stage 3 Prep */}
          <div className="space-y-3 pt-2">
            <Text size="md" weight="semibold" className="text-slate-900 tracking-wider">
              Stage 3: Admission Prep Details
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="targetAdmissionDate">Target Admission Date</Label>
                <Controller
                  name="targetAdmissionDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                      placeholder="Select target admission date"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferredRoomType">Preferred Room Type</Label>
                <Input
                  id="preferredRoomType"
                  placeholder="e.g. En-suite single room, Ground floor"
                  {...register("preferredRoomType")}
                  className="h-11 bg-white border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">General Staff Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add ongoing operational notes, communications with family..."
                {...register("notes")}
                className="text-md min-h-16 bg-white border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-xl cursor-pointer"
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending}
              className="h-9 px-5 rounded-xl cursor-pointer"
            >
              {updateMutation.isPending ? "Saving..." : "Save Assessment Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
