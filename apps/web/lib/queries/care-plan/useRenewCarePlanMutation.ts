import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { RENEW_CARE_PLAN } from "@repo/endpoints";
import { RenewCarePlanDTO } from "@repo/schema";
import { carePlanKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useRenewCarePlanMutation(parentPlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RenewCarePlanDTO) =>
      makeAPICall(RENEW_CARE_PLAN, data, {}, { id: parentPlanId }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Care Plan renewal draft created successfully",
      });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.all });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to renew care plan",
        variant: "destructive",
      });
    },
  });
}
