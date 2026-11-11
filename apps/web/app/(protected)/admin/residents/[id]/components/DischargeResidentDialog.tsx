"use client";

import React, { useState } from "react";
import { z } from "zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
  DatePicker,
  toast,
} from "@repo/ui/components/ui";
import { useDischargeResidentMutation } from "../../../../../../lib/queries/residents";
import { Building2, Bed as BedIcon, Loader2, Calendar as CalendarIcon } from "lucide-react";

const DischargeFormSchema = z.object({
  dischargeType: z.string().min(1, "Discharge type is required"),
  reason: z.string().trim().min(1, "Reason for discharge is required"),
  dischargeDate: z.string().min(1, "Discharge date is required"),
});

const getDefaultDischargeData = () => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    dischargeType: "",
    reason: "",
    dischargeDate: dateStr,
    dischargeTime: "11:20",
    carePlanReview: "",
    riskAssessment: "",
    medicationReview: "",
    familyNotified: true,
    gpNotified: false,
  };
};

interface DischargeResidentDialogProps {
  resident: {
    id?: string;
    fullName?: string;
    bed?: {
      number?: string;
      room?: {
        roomNumber?: string;
      };
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DischargeResidentDialog({
  resident,
  open,
  onOpenChange,
}: DischargeResidentDialogProps) {
  const [dischargeData, setDischargeData] = useState(getDefaultDischargeData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  React.useEffect(() => {
    if (open) {
      setDischargeData(getDefaultDischargeData());
      setErrors({});
      setIsConfirming(false);
    }
  }, [open]);

  const dischargeMutation = useDischargeResidentMutation(resident?.id || "");

  const handleDischarge = () => {
    if (!resident?.id) return;
    setErrors({});
    const validation = DischargeFormSchema.safeParse(dischargeData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast({
        title: "Missing fields",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    dischargeMutation.mutate(
      {
        dischargeType: dischargeData.dischargeType as any,
        reason: dischargeData.reason,
        dischargeDate: dischargeData.dischargeDate,
        dischargeTime: dischargeData.dischargeTime,
        carePlanReview: dischargeData.carePlanReview,
        riskAssessment: dischargeData.riskAssessment,
        medicationReview: dischargeData.medicationReview,
        familyNotified: dischargeData.familyNotified,
        gpNotified: dischargeData.gpNotified,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setIsConfirming(false);
          toast({
            title: "Resident Discharged",
            description: `${resident.fullName || "Resident"} has been successfully discharged.`,
          });
        },
      }
    );
  };

  const handleClose = () => {
    setIsConfirming(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="xl" className="bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
            {isConfirming ? "Confirm Resident Discharge" : "Discharge Resident"}
          </DialogTitle>
          <DialogDescription className="text-md text-slate-500 font-medium">
            {isConfirming
              ? "Review the discharge summary below and confirm. This will release the bed and archive active care tasks."
              : `Are you sure you want to discharge ${resident?.fullName || "this resident"}? All fields are recorded in audit logs.`}
          </DialogDescription>
        </DialogHeader>

        {resident?.bed && (
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-md text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <Building2 className="size-4 text-emerald-800" />
              <span>Room: {resident.bed.room?.roomNumber || "Unassigned"}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <BedIcon className="size-4 text-emerald-800" />
              <span>Bed: {resident.bed.number || "Unassigned"}</span>
            </div>
          </div>
        )}

        {!isConfirming ? (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label required>Discharge Type</Label>
                <Select
                  value={dischargeData.dischargeType}
                  onValueChange={(val) => {
                    setDischargeData({ ...dischargeData, dischargeType: val });
                    if (errors.dischargeType) setErrors((prev) => ({ ...prev, dischargeType: "" }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Hospital">Hospitalization</SelectItem>
                    <SelectItem value="Deceased">Deceased</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.dischargeType && (
                  <p className="text-md text-text-error font-medium min-h-[18px] mt-1">{errors.dischargeType}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label required>Discharge Date</Label>
                <DatePicker
                  value={dischargeData.dischargeDate}
                  onChange={(d) => {
                    setDischargeData({
                      ...dischargeData,
                      dischargeDate: d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "",
                    });
                    if (errors.dischargeDate) setErrors((prev) => ({ ...prev, dischargeDate: "" }));
                  }}
                  placeholder="Select discharge date"
                  errorMessage={errors.dischargeDate}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label required>Reason for Discharge</Label>
              <Input
                placeholder="Detailed reason... (e.g., Relocated closer to family)"
                value={dischargeData.reason}
                onChange={(e) => {
                  setDischargeData({ ...dischargeData, reason: e.target.value });
                  if (errors.reason) setErrors((prev) => ({ ...prev, reason: "" }));
                }}
                errorMessage={errors.reason}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <Label>Care Plan Review</Label>
                <Select
                  value={dischargeData.carePlanReview}
                  onValueChange={(val) => setDischargeData({ ...dischargeData, carePlanReview: val })}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Risk Assessment</Label>
                <Select
                  value={dischargeData.riskAssessment}
                  onValueChange={(val) => setDischargeData({ ...dischargeData, riskAssessment: val })}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low Risk">Low Risk</SelectItem>
                    <SelectItem value="Medium Risk">Medium Risk</SelectItem>
                    <SelectItem value="High Risk">High Risk</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Medication Review</Label>
                <Select
                  value={dischargeData.medicationReview}
                  onValueChange={(val) => setDischargeData({ ...dischargeData, medicationReview: val })}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Reconciled">Reconciled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-md text-slate-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-emerald-800" />
                <span>Notice period recorded in resident profile</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="size-4 rounded text-emerald-800 border-slate-300 focus:ring-emerald-800"
                    checked={dischargeData.familyNotified}
                    onChange={(e) => setDischargeData({ ...dischargeData, familyNotified: e.target.checked })}
                  />
                  <span>Family Notified</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="size-4 rounded text-emerald-800 border-slate-300 focus:ring-emerald-800"
                    checked={dischargeData.gpNotified}
                    onChange={(e) => setDischargeData({ ...dischargeData, gpNotified: e.target.checked })}
                  />
                  <span>GP Notified</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-md font-medium">
              Confirming will free the assigned bed and mark the resident active status as Discharged. Care records will be archived but queryable.
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100 text-md">
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="font-semibold text-slate-700">Reason for Discharge:</span>
                <span className="font-medium text-slate-900">{dischargeData.reason}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="font-semibold text-slate-700">Discharge Type:</span>
                <span className="font-medium text-slate-900">{dischargeData.dischargeType}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-700">Date:</span>
                <span className="font-medium text-slate-900">{dischargeData.dischargeDate}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={handleClose} disabled={dischargeMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDischarge}
            disabled={dischargeMutation.isPending}
            className="gap-2"
          >
            {dischargeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Processing...
              </span>
            ) : isConfirming ? (
              "Yes, Confirm Discharge"
            ) : (
              "Discharge"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
