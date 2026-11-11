"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_BODY_MAP_ASSESSMENT } from "@repo/endpoints";
import { bodyMapKeys } from "./keys";
import { CreateBodyMapAssessmentDTO } from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useCreateBodyMapAssessmentMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateBodyMapAssessmentDTO) => {
      return makeAPICall(
        CREATE_BODY_MAP_ASSESSMENT,
        dto as unknown as Record<string, unknown>,
        {},
        { residentId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bodyMapKeys.assessments(residentId),
      });
      toast({
        title: "Assessment Saved",
        description: "Body map assessment has been recorded",
      });
    },
    onError: (error: Record<string, unknown>) => {
      toast({
        title: "Error",
        description:
          (error.message as string) || "Failed to save body map assessment",
      });
    },
  });
}
