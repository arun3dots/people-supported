import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  CREATE_MEDICATION_ROUND,
  UPDATE_MEDICATION_ROUND,
  DELETE_MEDICATION_ROUND,
  CREATE_MEDICATION_ROUND_BULK,
  ADMINISTER_MEDICATION_ADHOC,
} from "@repo/endpoints";
import {
  CreateMedicationRoundSchema,
  CreateMedicationRoundBulkSchema,
  AdministerAdHocMedicationSchema,
  type CreateMedicationRoundDTO,
} from "@repo/schema";
import type { z } from "zod";
import { refreshMedicationQueries } from "./refreshMedicationQueries";
import { toast } from "@repo/ui/components/ui";

export function useCreateMedicationRoundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: z.input<typeof CreateMedicationRoundSchema>;
    }) => makeAPICall(CREATE_MEDICATION_ROUND, data, {}, { id: residentId }),
    onSuccess: async (_, variables) => {
      await refreshMedicationQueries(queryClient, variables.residentId);
      toast({
        title: "Success",
        description: "Medication round created successfully",
      });
    },
    onError: (error: Error) => {
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
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: z.input<typeof CreateMedicationRoundBulkSchema>;
    }) =>
      makeAPICall(CREATE_MEDICATION_ROUND_BULK, data, {}, { id: residentId }),
    onSuccess: async (_, variables) => {
      await refreshMedicationQueries(queryClient, variables.residentId);
      toast({
        title: "Success",
        description: "Medication schedule created successfully",
      });
    },
    onError: (error: Error) => {
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
      data: Partial<CreateMedicationRoundDTO>;
    }) => makeAPICall(UPDATE_MEDICATION_ROUND, data, {}, { id: roundId }),
    onSuccess: async (_, variables) => {
      await refreshMedicationQueries(queryClient, variables.residentId);
      toast({
        title: "Success",
        description: "Medication round updated successfully",
      });
    },
    onError: (error: Error) => {
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
    onSuccess: async (_, variables) => {
      await refreshMedicationQueries(queryClient, variables.residentId);
      toast({
        title: "Success",
        description: "Medication round deleted successfully",
      });
    },
    onError: (error: Error) => {
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
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: unknown;
    }) => {
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw new Error("Medication details are required.");
      const payload = AdministerAdHocMedicationSchema.parse({
        ...data,
        residentId,
      });
      return makeAPICall(
        ADMINISTER_MEDICATION_ADHOC,
        payload,
        {},
        { id: residentId },
      );
    },
    onSuccess: async (_, variables) => {
      await refreshMedicationQueries(queryClient, variables.residentId);
      toast({
        title: "Success",
        description: "Ad-hoc medication recorded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record ad-hoc medication",
        variant: "destructive",
      });
    },
  });
}
