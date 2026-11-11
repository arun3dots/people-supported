import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  CREATE_MEDICATION_ROUND,
  UPDATE_MEDICATION_ROUND,
  DELETE_MEDICATION_ROUND,
  CREATE_MEDICATION_ROUND_BULK,
  ADMINISTER_MEDICATION_ADHOC,
} from "@repo/endpoints";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useCreateMedicationRoundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ residentId, data }: { residentId: string; data: any }) =>
      makeAPICall(CREATE_MEDICATION_ROUND, data as any, {}, { id: residentId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...residentKeys.detail(variables.residentId),
          "medication-rounds",
        ],
      });
      toast({
        title: "Success",
        description: "Medication round created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create medication round",
        variant: "destructive",
      });
    },
  });
}

export function useCreateMedicationRoundBulkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ residentId, data }: { residentId: string; data: any }) =>
      makeAPICall(
        CREATE_MEDICATION_ROUND_BULK,
        data as any,
        {},
        { id: residentId },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...residentKeys.detail(variables.residentId),
          "medication-rounds",
        ],
      });
      toast({
        title: "Success",
        description: "Medication schedule created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create medication schedule",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMedicationRoundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roundId,
      residentId,
      data,
    }: {
      roundId: string;
      residentId: string;
      data: any;
    }) =>
      makeAPICall(UPDATE_MEDICATION_ROUND, data as any, {}, { id: roundId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...residentKeys.detail(variables.residentId),
          "medication-rounds",
        ],
      });
      toast({
        title: "Success",
        description: "Medication round updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update medication round",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMedicationRoundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roundId,
      residentId,
      reason,
    }: {
      roundId: string;
      residentId: string;
      reason: string;
    }) => makeAPICall(DELETE_MEDICATION_ROUND, { reason }, {}, { id: roundId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...residentKeys.detail(variables.residentId),
          "medication-rounds",
        ],
      });
      toast({
        title: "Success",
        description: "Medication round deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete medication round",
        variant: "destructive",
      });
    },
  });
}

export function useAdministerAdHocMedicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ residentId, data }: { residentId: string; data: any }) =>
      makeAPICall(
        ADMINISTER_MEDICATION_ADHOC,
        data as any,
        {},
        { id: residentId },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...residentKeys.detail(variables.residentId),
          "medication-rounds",
        ],
      });
      toast({
        title: "Success",
        description: "Ad-hoc medication recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record ad-hoc medication",
        variant: "destructive",
      });
    },
  });
}
