import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DECIDE_CARE_PLAN_APPROVAL } from "@repo/endpoints";
import { DecideCarePlanApprovalDTO } from "@repo/schema";
import { carePlanKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useDecideCarePlanApprovalMutation(
  carePlanId: string,
  approvalId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DecideCarePlanApprovalDTO) =>
      makeAPICall(
        DECIDE_CARE_PLAN_APPROVAL,
        data,
        {},
        { id: carePlanId, approvalId }
      ),
    onSuccess: (_, variables) => {
      toast({
        title: "Decision Recorded",
        description: `Approval status updated to ${variables.decision}.`,
      });
      queryClient.invalidateQueries({
        queryKey: carePlanKeys.detail(carePlanId),
      });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Recording Decision",
        description: error.message || "Failed to record approval decision",
        variant: "destructive",
      });
    },
  });
}
