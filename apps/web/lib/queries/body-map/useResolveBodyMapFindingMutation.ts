"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { RESOLVE_BODY_MAP_FINDING } from "@repo/endpoints";
import { bodyMapKeys } from "./keys";
import { ResolveBodyMapFindingDTO } from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useResolveBodyMapFindingMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      findingId,
      dto,
    }: {
      findingId: string;
      dto: ResolveBodyMapFindingDTO;
    }) => {
      return makeAPICall(
        RESOLVE_BODY_MAP_FINDING,
        dto as unknown as Record<string, unknown>,
        {},
        { id: findingId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bodyMapKeys.assessments(residentId),
      });
      toast({
        title: "Finding Resolved",
        description: "Body map finding has been marked as resolved",
      });
    },
    onError: (error: Record<string, unknown>) => {
      toast({
        title: "Error",
        description:
          (error.message as string) || "Failed to resolve finding",
      });
    },
  });
}
