-- AlterTable
ALTER TABLE "Resident"
ADD COLUMN "supportedLivingDetails" JSONB;

-- AlterTable
ALTER TABLE "UserProfile"
ADD COLUMN "contractType" TEXT,
ADD COLUMN "contractedHoursPerWeek" DOUBLE PRECISION,
ADD COLUMN "employmentDetails" JSONB,
ADD COLUMN "propertyId" TEXT,
ADD COLUMN "schemeId" TEXT;

-- AlterTable
ALTER TABLE "Wing"
ADD COLUMN "propertyDetails" JSONB,
ADD COLUMN "schemeId" TEXT;

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "referenceId" TEXT,
    "location" TEXT,
    "description" TEXT,
    "commissioningLa" TEXT,
    "schemeManagerId" TEXT,
    "commissionedHours" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "schemeDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "adminNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scheme_tenantId_idx" ON "Scheme"("tenantId");
CREATE INDEX "Scheme_branchId_idx" ON "Scheme"("branchId");
CREATE INDEX "LeaveRequest_tenantId_staffId_idx" ON "LeaveRequest"("tenantId", "staffId");
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX "Wing_schemeId_idx" ON "Wing"("schemeId");

-- AddForeignKey
ALTER TABLE "Scheme"
ADD CONSTRAINT "Scheme_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Scheme"
ADD CONSTRAINT "Scheme_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Wing"
ADD CONSTRAINT "Wing_schemeId_fkey"
FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_staffId_fkey"
FOREIGN KEY ("staffId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
