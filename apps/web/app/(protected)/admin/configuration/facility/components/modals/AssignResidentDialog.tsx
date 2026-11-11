"use client";

import { useState } from "react";
import { UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { useGetResidentsQuery } from "../../../../../../../lib/queries/residents/useGetResidentsQuery";
import { useAssignBedMutation } from "../../../../../../../lib/queries/residents/useAssignBedMutation";
import type { Bed } from "../../../../../../../lib/types/facility";

interface AssignResidentDialogProps {
  bed: Bed | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignResidentDialog({
  bed,
  isOpen,
  onOpenChange,
}: AssignResidentDialogProps) {
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");

  const { data: residents, isLoading: isResidentsLoading } =
    useGetResidentsQuery();
  const assignBedMutation = useAssignBedMutation();

  // Filter to active residents
  const activeResidents = residents?.filter(
    (r: { status?: string }) => r.status !== "Discharged"
  );

  const handleAssign = () => {
    if (!bed?.id || !selectedResidentId) return;

    assignBedMutation.mutate(
      {
        residentId: selectedResidentId,
        bedId: bed.id,
      },
      {
        onSuccess: () => {
          setSelectedResidentId("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <UserCheck className="size-5 text-primary" />
            Assign Resident to Bed
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Assign an active resident to Bed{" "}
            <span className="font-medium text-slate-700">
              {bed?.number || bed?.code || ""}
            </span>{" "}
            {bed?.roomNumber ? `(Room ${bed.roomNumber})` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label required>
              Select Resident
            </Label>
            <Select
              value={selectedResidentId}
              onValueChange={setSelectedResidentId}
              disabled={isResidentsLoading}
            >
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue
                  placeholder={
                    isResidentsLoading
                      ? "Loading residents..."
                      : "Choose a resident..."
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 max-h-56">
                {activeResidents?.map(
                  (r: { id: string; fullName: string; nhsNumber?: string }) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.fullName}{" "}
                      {r.nhsNumber ? `· NHS: ${r.nhsNumber}` : ""}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleAssign}
            disabled={!selectedResidentId || assignBedMutation.isPending}
          >
            {assignBedMutation.isPending ? "Assigning..." : "Assign Resident"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
