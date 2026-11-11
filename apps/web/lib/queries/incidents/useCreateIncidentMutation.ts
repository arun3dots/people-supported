"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_INCIDENT } from "@repo/endpoints";
import { Incident } from "../../types/incident";
import { incidentKeys } from "./keys";
import { CreateIncidentDTO } from "@repo/schema";

export function useCreateIncidentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateIncidentDTO) => {
      return await makeAPICall<Incident>(CREATE_INCIDENT, dto as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.all });
    },
  });
}
