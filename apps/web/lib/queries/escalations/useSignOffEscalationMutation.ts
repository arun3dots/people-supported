"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { SIGN_OFF_ESCALATION } from "@repo/endpoints";
import { ClinicalEscalationItemDTO, ManagerSignOffEscalationDTO } from "@repo/schema";
import { escalationKeys } from "./keys";

export function useSignOffEscalationMutation(escalationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: ManagerSignOffEscalationDTO) => {
      return await makeAPICall<ClinicalEscalationItemDTO>(
        SIGN_OFF_ESCALATION,
        dto as unknown as Record<string, unknown>,
        undefined,
        { id: escalationId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: escalationKeys.all });
    },
  });
}
