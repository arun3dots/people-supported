import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { SUBMIT_CARE_PLAN } from "@repo/endpoints";
import { carePlanKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useSubmitCarePlanMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => makeAPICall(SUBMIT_CARE_PLAN, {}, {}, { id }),
    onSuccess: () => {
      toast({
        title: "Submitted for Approval",
        description: "Care plan is now pending clinical sign-off.",
      });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit care plan",
        variant: "destructive",
      });
    },
  });
}
