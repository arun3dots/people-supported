import { z } from "zod";

export const MealSlotSchema = z.enum([
  "Breakfast",
  "MorningTea",
  "Lunch",
  "AfternoonTea",
  "Dinner",
  "Supper",
  "NightHydration",
  "HydrationRound",
  "Snack",
  "Other",
]);
export type MealSlot = z.infer<typeof MealSlotSchema>;

export const CreateFoodFluidLogSchema = z.object({
  type: z.enum(["Food", "Fluid"]),
  amount: z.number().min(0, "Amount must be a positive number"),
  unit: z.enum(["ml", "g", "oz", "%", "portion"]),
  mealSlot: MealSlotSchema.optional(),
  intakePercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  timestamp: z.string().or(z.date()).optional(),
});

export type CreateFoodFluidLogDTO = z.infer<typeof CreateFoodFluidLogSchema>;

export const UpdateFoodFluidLogSchema = CreateFoodFluidLogSchema.partial();
export type UpdateFoodFluidLogDTO = z.infer<typeof UpdateFoodFluidLogSchema>;

export const FoodFluidLogQuerySchema = z.object({
  date: z.string().optional(),
  type: z.enum(["Food", "Fluid"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type FoodFluidLogQueryDTO = z.infer<typeof FoodFluidLogQuerySchema>;

export interface FoodFluidSummaryDTO {
  residentId: string;
  date: string;
  totalFluidIntakeMl: number;
  dailyTargetMl: number;
  remainingFluidMl: number;
  percentageCompleted: number;
  isDehydrationRisk: boolean;
  statusLabel: string;
  totalFoodEntries: number;
  recentLogs: Array<{
    id: string;
    type: string;
    amount: number;
    unit: string;
    mealSlot: string | null;
    intakePercentage: number | null;
    timestamp: Date | string;
    notes: string | null;
    staffName?: string;
  }>;
}
