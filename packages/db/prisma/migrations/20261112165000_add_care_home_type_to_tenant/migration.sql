-- Add optional care home type to Tenant.
ALTER TABLE "Tenant"
ADD COLUMN IF NOT EXISTS "careHomeType" TEXT;
