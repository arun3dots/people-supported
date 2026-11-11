import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_CARE_PLAN_DRAFT } from "@repo/endpoints";
import { UpdateCarePlanDraftDTO } from "@repo/schema";
import { carePlanKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useUpdateCarePlanMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCarePlanDraftDTO) =>
      makeAPICall(UPDATE_CARE_PLAN_DRAFT, data, {}, { id }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Care Plan draft updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update care plan",
        variant: "destructive",
      });
    },
  });
}
