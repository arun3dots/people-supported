import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_CARE_PLAN_REVIEWS,
  CREATE_CARE_PLAN_REVIEW,
  GET_RESIDENT_CARE_PLAN_REVIEWS,
} from "@repo/endpoints";
import { CreateCarePlanReviewDTO, CarePlanReviewDTO } from "@repo/schema";
import { carePlanKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useGetCarePlanReviewsQuery(carePlanId: string) {
  return useQuery({
    queryKey: carePlanKeys.reviews(carePlanId),
    queryFn: () =>
      makeAPICall<CarePlanReviewDTO[]>(
        GET_CARE_PLAN_REVIEWS,
        undefined,
        {},
        { id: carePlanId }
      ),
    enabled: !!carePlanId,
  });
}

export function useGetResidentCarePlanReviewsQuery(residentId: string) {
  return useQuery({
    queryKey: carePlanKeys.residentReviews(residentId),
    queryFn: () =>
      makeAPICall<CarePlanReviewDTO[]>(
        GET_RESIDENT_CARE_PLAN_REVIEWS,
        undefined,
        {},
        { residentId }
      ),
    enabled: !!residentId,
  });
}

export function useCreateCarePlanReviewMutation(carePlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCarePlanReviewDTO) =>
      makeAPICall(CREATE_CARE_PLAN_REVIEW, payload, {}, { id: carePlanId }),
    onSuccess: () => {
      toast({
        title: "Review Recorded",
        description: "Monthly statutory care plan evaluation saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.detail(carePlanId) });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.reviews(carePlanId) });
      queryClient.invalidateQueries({ queryKey: carePlanKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Review Failed",
        description: error.message || "Failed to record care plan review",
        variant: "destructive",
      });
    },
  });
}
