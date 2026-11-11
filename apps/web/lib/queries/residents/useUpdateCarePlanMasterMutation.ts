"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_CARE_PLAN_MASTER } from "@repo/endpoints";
import { residentKeys } from "./keys";
import { UpdateCarePlanMasterDTO } from "@repo/schema";

import { toast } from "@repo/ui/components/ui";

export function useUpdateCarePlanMasterMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCarePlanMasterDTO) =>
      makeAPICall<any>(
        UPDATE_CARE_PLAN_MASTER,
        data as Record<string, unknown>,
        {},
        { residentId }
      ),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Care plan master updated successfully",
      });
      queryClient.invalidateQueries({
        queryKey: residentKeys.detail(residentId),
      });
      queryClient.invalidateQueries({ queryKey: ["residents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update care plan master",
        variant: "destructive",
      });
    },
  });
}
