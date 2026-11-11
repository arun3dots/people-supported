"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_RESIDENT_SUPPORTED_LIVING } from "@repo/endpoints";
import type { UpdateSupportedLivingDetailsDTO } from "@repo/schema";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useUpdateSupportedLivingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      residentId,
      data,
    }: {
      residentId: string;
      data: UpdateSupportedLivingDetailsDTO;
    }) =>
      makeAPICall<{ id: string }>(
        UPDATE_RESIDENT_SUPPORTED_LIVING,
        data as unknown as Record<string, unknown>,
        {},
        { id: residentId },
      ),
    onSuccess: (_, { residentId }) => {
      toast({ title: "Saved", description: "Changes saved successfully." });
      queryClient.invalidateQueries({
        queryKey: residentKeys.detail(residentId),
      });
      queryClient.invalidateQueries({
        queryKey: residentKeys.lists(),
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to save changes.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}
