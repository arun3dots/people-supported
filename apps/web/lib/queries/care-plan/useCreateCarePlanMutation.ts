import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_CARE_PLAN_WIZARD } from "@repo/endpoints";
import { CreateCarePlanWizardDTO } from "@repo/schema";
import { carePlanKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useCreateCarePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCarePlanWizardDTO) =>
      makeAPICall(CREATE_CARE_PLAN_WIZARD, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Care Plan created successfully",
      });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.all });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create care plan",
        variant: "destructive",
      });
    },
  });
}
