"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { NOTIFY_INCIDENT_NOK } from "@repo/endpoints";
import { incidentKeys } from "./keys";
import { NotifyNextOfKinDTO } from "@repo/schema";

export function useNotifyIncidentNokMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: NotifyNextOfKinDTO) => {
      return await makeAPICall<{ success: boolean; message: string; recipient: string }>(
        NOTIFY_INCIDENT_NOK,
        dto as Record<string, unknown>,
        {},
        { id }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.all });
    },
  });
}
