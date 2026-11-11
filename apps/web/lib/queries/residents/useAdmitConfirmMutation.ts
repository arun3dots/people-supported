"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdmitConfirmDTO } from "@repo/schema";
import { makeAPICall } from "../../api";
import { ADMIT_CONFIRM, GET_BEDS, GET_ROOMS } from "@repo/endpoints";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useAdmitConfirmMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: AdmitConfirmDTO;
    }) =>
      makeAPICall<{ id: string }>(
        ADMIT_CONFIRM,
        data as Record<string, unknown>,
        {},
        { id },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: residentKeys.all });
      queryClient.invalidateQueries({ queryKey: residentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: residentKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: [GET_BEDS] });
      queryClient.invalidateQueries({ queryKey: [GET_ROOMS] });
      queryClient.invalidateQueries({ queryKey: ["beds"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to confirm admission.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}
