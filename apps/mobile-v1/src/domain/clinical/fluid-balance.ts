import type { MealSlot } from '@repo/schema';

/**
 * CQC Regulation 14 & NICE CG32: Meeting Nutritional and Hydration Needs
 * 24-Hour Fluid Balance, Food/Fluid Log Types, and Dehydration Risk Calculation.
 */

export interface FluidEntry {
  id: string;
  residentId: string;
  amountMl: number;
  beverageType: string;
  recordedAt: string;
  staffName: string;
}

export interface FoodFluidLogItem {
  id: string;
  type: 'Food' | 'Fluid';
  amount: number;
  unit: string;
  mealSlot?: MealSlot | string | null;
  intakePercentage?: number | null;
  timestamp: string;
  notes?: string | null;
  deletedAt?: string | null;
}

export interface BeveragePreset {
  id: string;
  label: string;
  shortLabel?: string;
  amountMl: number;
  iconName: string;
}

export const BEVERAGE_PRESETS: BeveragePreset[] = [
  { id: 'cup', label: '150 ml (Cup)', shortLabel: 'Cup', amountMl: 150, iconName: 'coffee' },
  { id: 'glass', label: '200 ml (Glass)', shortLabel: 'Glass', amountMl: 200, iconName: 'cup' },
  { id: 'mug', label: '250 ml (Mug)', shortLabel: 'Mug', amountMl: 250, iconName: 'glass' },
  { id: 'bottle', label: '300 ml (Bottle)', shortLabel: 'Bottle', amountMl: 300, iconName: 'bottle' },
  { id: 'jug', label: '500 ml (Jug)', shortLabel: 'Jug', amountMl: 500, iconName: 'jug' },
];

export const MEAL_SLOT_OPTIONS: Array<{ value: MealSlot; label: string }> = [
  { value: 'Breakfast', label: 'Breakfast' },
  { value: 'MorningTea', label: 'Morning Tea / Round' },
  { value: 'Lunch', label: 'Lunch' },
  { value: 'AfternoonTea', label: 'Afternoon Tea / Round' },
  { value: 'Dinner', label: 'Dinner' },
  { value: 'Supper', label: 'Supper' },
  { value: 'NightHydration', label: 'Night Hydration' },
  { value: 'HydrationRound', label: 'Hydration Round' },
  { value: 'Snack', label: 'Snack' },
  { value: 'Other', label: 'Other' },
];

export type IntakeUnit = 'ml' | 'portion' | 'g' | 'oz' | '%';

export const INTAKE_UNIT_OPTIONS: Array<{ value: IntakeUnit; label: string }> = [
  { value: 'ml', label: 'ml' },
  { value: 'portion', label: 'Portion(s)' },
  { value: 'g', label: 'g' },
  { value: 'oz', label: 'oz' },
  { value: '%', label: '%' },
];

export const CONSUMED_PERCENTAGES = [25, 50, 75, 100] as const;

export function formatMealSlotLabel(slot?: string | null): string {
  if (!slot) return 'Hydration Round';
  const found = MEAL_SLOT_OPTIONS.find((opt) => opt.value === slot);
  return found ? found.label : slot;
}

export interface FluidBalanceSummary {
  totalIntakeMl: number;
  dailyTargetMl: number;
  percentageCompleted: number;
  remainingMl: number;
  isDehydratedRisk: boolean;
  statusLabel: string;
}

export function calculateFluidBalance(
  entries: FluidEntry[],
  dailyTargetMl = 2000
): FluidBalanceSummary {
  const totalIntakeMl = entries.reduce((acc, curr) => acc + curr.amountMl, 0);
  const percentageCompleted = Math.min(Math.round((totalIntakeMl / dailyTargetMl) * 100), 100);
  const remainingMl = Math.max(dailyTargetMl - totalIntakeMl, 0);

  const isDehydratedRisk = percentageCompleted < 50;
  let statusLabel = 'On Track';
  if (percentageCompleted >= 100) {
    statusLabel = 'Target Met';
  } else if (percentageCompleted >= 75) {
    statusLabel = 'Good Progress';
  } else if (isDehydratedRisk) {
    statusLabel = 'Dehydration Risk';
  }

  return {
    totalIntakeMl,
    dailyTargetMl,
    percentageCompleted,
    remainingMl,
    isDehydratedRisk,
    statusLabel,
  };
}
