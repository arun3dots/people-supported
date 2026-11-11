import type { TenantStatus } from "@repo/schema";

/**
 * Tenant as returned by the SuperAdmin list/detail endpoints
 * (`apps/backend/src/tenants/tenants.service.ts` `findAll` / `findOne`).
 * Mirrors the Prisma `Tenant` scalar fields plus the `_count` aggregate and the
 * trimmed `users` relation (only a verification token, for the "copy link"
 * action on pending tenants).
 */
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  cqcNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    residents: number;
    users: number;
  };
  users?: {
    verificationToken: string | null;
  }[];
}

/**
 * Response shape from `POST /api/super-admin/tenants`. The controller returns the
 * created `Tenant` plus an optional `paymentUrl`; the onboarding success screen
 * also surfaces the primary contact email it was created with.
 */
export interface CreatedTenant extends Tenant {
  paymentUrl?: string;
  primaryContactEmail?: string;
}
