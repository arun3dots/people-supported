-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "allergySummary" TEXT,
ADD COLUMN     "dnacprStatus" TEXT,
ADD COLUMN     "fallsRiskLevel" TEXT,
ADD COLUMN     "iddsiLevel" TEXT;

-- CreateTable
CREATE TABLE "ResidentPreAdmission" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "parentVersionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "assessedAt" TIMESTAMP(3),
    "assessedLocation" TEXT,
    "assessedById" TEXT,
    "assessedByName" TEXT,
    "partA" JSONB,
    "partB" JSONB,
    "partC" JSONB,
    "partD" JSONB,
    "partE" JSONB,
    "partF" JSONB,
    "partG" JSONB,
    "roomAllocation" JSONB,
    "managerDecision" JSONB,
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "ResidentPreAdmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResidentPreAdmission_tenantId_idx" ON "ResidentPreAdmission"("tenantId");

-- CreateIndex
CREATE INDEX "ResidentPreAdmission_residentId_isCurrent_idx" ON "ResidentPreAdmission"("residentId", "isCurrent");

-- CreateIndex
CREATE INDEX "ResidentPreAdmission_status_idx" ON "ResidentPreAdmission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentPreAdmission_residentId_versionNumber_key" ON "ResidentPreAdmission"("residentId", "versionNumber");

-- Partial unique indexes (not expressible in Prisma): at most one current
-- version and at most one open draft per resident.
CREATE UNIQUE INDEX "ResidentPreAdmission_one_current_per_resident"
    ON "ResidentPreAdmission"("residentId") WHERE "isCurrent" = true;

CREATE UNIQUE INDEX "ResidentPreAdmission_one_draft_per_resident"
    ON "ResidentPreAdmission"("residentId") WHERE "status" = 'Draft';

-- AddForeignKey
ALTER TABLE "ResidentPreAdmission" ADD CONSTRAINT "ResidentPreAdmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentPreAdmission" ADD CONSTRAINT "ResidentPreAdmission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentPreAdmission" ADD CONSTRAINT "ResidentPreAdmission_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentPreAdmission" ADD CONSTRAINT "ResidentPreAdmission_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "ResidentPreAdmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
