"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Text,
  Badge,
} from "@repo/ui/components/ui";
import { UserCheck, Stethoscope, AlertCircle, Loader2 } from "lucide-react";
import { useGetStaffQuery } from "../../../../lib/queries/staff";
import { useUpdateCarePlanMutation } from "../../../../lib/queries/care-plan";

interface AssignClinicalSignoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  carePlanId: string;
  currentPrimaryDoctorId?: string | null;
  currentSecondaryDoctorId?: string | null;
  onSuccess?: () => void;
}

export function AssignClinicalSignoffModal({
  isOpen,
  onClose,
  carePlanId,
  currentPrimaryDoctorId,
  currentSecondaryDoctorId,
  onSuccess,
}: AssignClinicalSignoffModalProps): React.JSX.Element {
  const [primaryDoctorId, setPrimaryDoctorId] = useState<string>("");
  const [secondaryDoctorId, setSecondaryDoctorId] = useState<string>("none");
  const [error, setError] = useState<string | null>(null);

  const { data: rawStaff = [], isLoading: isStaffLoading } = useGetStaffQuery();
  const staffList = Array.isArray(rawStaff)
    ? (rawStaff as Array<{ id: string; fullName: string; role?: { name: string }; roleName?: string }>)
    : [];

  const updateMutation = useUpdateCarePlanMutation(carePlanId);

  useEffect(() => {
    if (isOpen) {
      setPrimaryDoctorId(currentPrimaryDoctorId || "");
      setSecondaryDoctorId(currentSecondaryDoctorId || "none");
      setError(null);
    }
  }, [isOpen, currentPrimaryDoctorId, currentSecondaryDoctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!primaryDoctorId || primaryDoctorId === "none") {
      setError("Please select a Primary Clinical Doctor for sign-off.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        primaryDoctorId,
        secondaryDoctorId: secondaryDoctorId === "none" ? null : secondaryDoctorId,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign clinical sign-off staff.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <UserCheck className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                Assign Clinical Sign-Off Team
              </DialogTitle>
              <Text size="sm" variant="muted">
                Designate the clinicians responsible for reviewing and approving this care plan.
              </Text>
            </div>
          </div>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4  pt-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-md font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Doctor */}
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required >
              <Stethoscope className="size-3.5 text-emerald-800" />
              Primary Clinical Sign-Off (Doctor / Lead Clinician)
            </Label>
            <Select
              value={primaryDoctorId}
              onValueChange={(val) => {
                setPrimaryDoctorId(val);
                if (error) setError(null);
              }}
              disabled={isStaffLoading || updateMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={isStaffLoading ? "Loading staff list..." : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{staff.fullName}</span>
                      {(staff.role?.name || staff.roleName) && (
                        <Badge state="inactive" >
                          {staff.role?.name || staff.roleName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Secondary Doctor */}
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label >
              <UserCheck className="size-3.5 text-slate-400" />
              Secondary Reviewer (Optional)
            </Label>
            <Select
              value={secondaryDoctorId}
              onValueChange={setSecondaryDoctorId}
              disabled={isStaffLoading || updateMutation.isPending}
            >
              <SelectTrigger >
                <SelectValue placeholder="-- None / Single Sign-Off --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- None (Single Primary Sign-Off) --</SelectItem>
                {staffList
                  .filter((s) => s.id !== primaryDoctorId)
                  .map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{staff.fullName}</span>
                        {(staff.role?.name || staff.roleName) && (
                          <Badge state="inactive" className="text-sm px-1.5 py-0 shadow-none ml-2">
                            {staff.role?.name || staff.roleName}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending || !primaryDoctorId || primaryDoctorId === "none"}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save Sign-Off Staff"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
