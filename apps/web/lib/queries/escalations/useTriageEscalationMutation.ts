"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { TRIAGE_ESCALATION } from "@repo/endpoints";
import { ClinicalEscalationItemDTO, TriageClinicalEscalationDTO } from "@repo/schema";
import { escalationKeys } from "./keys";

export function useTriageEscalationMutation(escalationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: TriageClinicalEscalationDTO) => {
      return await makeAPICall<ClinicalEscalationItemDTO>(
        TRIAGE_ESCALATION,
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
