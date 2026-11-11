"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DISCHARGE_RESIDENT, GET_BEDS, GET_ROOMS } from "@repo/endpoints";
import { DischargeResidentDTO } from "@repo/schema";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useDischargeResidentMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DischargeResidentDTO | any) =>
      makeAPICall<any>(DISCHARGE_RESIDENT, data as any, {}, { id: residentId }),
    onSuccess: () => {
      toast({
        title: "Resident Discharged",
        description: "Resident has been successfully discharged.",
        variant: "default",
      });
      queryClient.invalidateQueries({
        queryKey: residentKeys.detail(residentId),
      });
      queryClient.invalidateQueries({ queryKey: residentKeys.all });
      queryClient.invalidateQueries({ queryKey: residentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [GET_BEDS] });
      queryClient.invalidateQueries({ queryKey: [GET_ROOMS] });
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      queryClient.invalidateQueries({ queryKey: ["facility"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Discharge Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
}
