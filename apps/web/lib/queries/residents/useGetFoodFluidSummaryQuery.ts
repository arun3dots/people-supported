import { useQuery } from "@tanstack/react-query";
import { GET_FOOD_FLUID_SUMMARY } from "@repo/endpoints";
import type { FoodFluidSummaryDTO } from "@repo/schema";
import { makeAPICall } from "../../api";

export function useGetFoodFluidSummaryQuery(residentId: string, date?: string) {
  return useQuery({
    queryKey: ["residentFoodFluidSummary", residentId, date],
    queryFn: () =>
      makeAPICall<FoodFluidSummaryDTO>(
        GET_FOOD_FLUID_SUMMARY,
        {},
        date ? { date } : {},
        { id: residentId },
      ),
    enabled: Boolean(residentId),
  });
}