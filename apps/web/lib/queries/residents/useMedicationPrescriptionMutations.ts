import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  STOP_MEDICATION_PRESCRIPTION,
  CHANGE_MEDICATION_PRESCRIPTION,
  PAUSE_MEDICATION_PRESCRIPTION,
} from "@repo/endpoints";
import type {
  StopMedicationPrescriptionDTO,
  ChangeMedicationPrescriptionDTO,
  PauseMedicationPrescriptionDTO,
} from "@repo/schema";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

type PrescriptionMutationVars<T> = {
  prescriptionId: string;
  residentId: string;
  data: T;
};

function useInvalidatePrescriptions() {
  const queryClient = useQueryClient();
  return (residentId: string) =>
    queryClient.invalidateQueries({
      queryKey: [...residentKeys.detail(residentId), "medication-rounds"],
    });
}

export function useStopMedicationPrescriptionMutation() {
  const invalidate = useInvalidatePrescriptions();

  return useMutation({
    mutationFn: ({ prescriptionId, data }: PrescriptionMutationVars<StopMedicationPrescriptionDTO>) =>
      makeAPICall(STOP_MEDICATION_PRESCRIPTION, data, {}, { id: prescriptionId }),
    onSuccess: (_, variables) => {
      invalidate(variables.residentId);
      toast({ title: "Success", description: "Medication stopped from the chosen date" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop medication",
        variant: "destructive",
      });
    },
  });
}

export function useChangeMedicationPrescriptionMutation() {
  const invalidate = useInvalidatePrescriptions();

  return useMutation({
    mutationFn: ({ prescriptionId, data }: PrescriptionMutationVars<ChangeMedicationPrescriptionDTO>) =>
      makeAPICall(CHANGE_MEDICATION_PRESCRIPTION, data, {}, { id: prescriptionId }),
    onSuccess: (_, variables) => {
      invalidate(variables.residentId);
      toast({ title: "Success", description: "Medication changed from the chosen date" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change medication",
        variant: "destructive",
      });
    },
  });
}

export function usePauseMedicationPrescriptionMutation() {
  const invalidate = useInvalidatePrescriptions();

  return useMutation({
    mutationFn: ({ prescriptionId, data }: PrescriptionMutationVars<PauseMedicationPrescriptionDTO>) =>
      makeAPICall(PAUSE_MEDICATION_PRESCRIPTION, data, {}, { id: prescriptionId }),
    onSuccess: (_, variables) => {
      invalidate(variables.residentId);
      toast({ title: "Success", description: "Medication paused for the chosen period" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to pause medication",
        variant: "destructive",
      });
    },
  });
}
