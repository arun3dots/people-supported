"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_INCIDENT } from "@repo/endpoints";
import { Incident } from "../../types/incident";
import { incidentKeys } from "./keys";
import { UpdateIncidentDTO } from "@repo/schema";

export function useUpdateIncidentMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateIncidentDTO) => {
      return await makeAPICall<Incident>(
        UPDATE_INCIDENT,
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
