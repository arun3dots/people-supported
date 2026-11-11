-- AlterTable
ALTER TABLE "StaffCertification" ADD COLUMN IF NOT EXISTS "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

