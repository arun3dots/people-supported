"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_ESCALATION } from "@repo/endpoints";
import { ClinicalEscalationItemDTO, CreateClinicalEscalationDTO } from "@repo/schema";
import { escalationKeys } from "./keys";

export function useCreateEscalationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateClinicalEscalationDTO) => {
      return await makeAPICall<ClinicalEscalationItemDTO>(
        CREATE_ESCALATION,
        dto as unknown as Record<string, unknown>,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: escalationKeys.all });
    },
  });
}
