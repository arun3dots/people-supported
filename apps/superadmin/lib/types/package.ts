/**
 * SubscriptionPackage as returned by the SuperAdmin packages endpoints
 * (`apps/backend/src/payments/packages.controller.ts`).
 */
export interface SubscriptionPackage {
  id: string;
  name: string;
  priceMonthly: number;
  residentLimit: number;
  staffLimit: number;
  featureFlags: Record<string, unknown>;
  currency: string;
  isActive: boolean;
  isPublic: boolean;
  isCustom: boolean;
  createdAt: string;
}
