-- AlterTable
ALTER TABLE "cqc_audit_logs" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION;
