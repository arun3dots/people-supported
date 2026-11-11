import { useQuery } from "@tanstack/react-query";
import { GET_FOOD_FLUID_LOGS } from "@repo/endpoints";
import { makeAPICall } from "../../api";

export interface FoodFluidLogItem {
  id: string;
  type: "Food" | "Fluid";
  amount: number;
  unit: string;
  mealSlot?: string | null;
  intakePercentage?: number | null;
  timestamp: string;
  notes?: string | null;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useGetFoodFluidLogsQuery(residentId: string, date?: Date) {
  return useQuery({
    queryKey: ["residentFoodFluidLogs", residentId, date?.toDateString()],
    queryFn: () =>
      makeAPICall<FoodFluidLogItem[]>(
        GET_FOOD_FLUID_LOGS,
        {},
        date ? { date: formatLocalDate(date) } : {},
        { id: residentId },
      ),
    enabled: Boolean(residentId),
  });
}
