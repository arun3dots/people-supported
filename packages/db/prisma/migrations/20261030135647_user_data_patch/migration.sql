-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "dpaAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "dpaAcceptedByEmail" TEXT,
ADD COLUMN     "dpaVersion" TEXT,
ADD COLUMN     "enablePageViewGeolocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enforceMfaForAllStaff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacyNoticeVersion" TEXT,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DataRightsRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL DEFAULT 'Resident',
    "residentId" TEXT,
    "staffUserId" TEXT,
    "requestType" TEXT NOT NULL DEFAULT 'SAR',
    "requesterName" TEXT NOT NULL,
    "requesterRelationship" TEXT,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "authorityVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "clockStoppedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "exemptionReason" TEXT,
    "redactionConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRightsRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataRightsRequest_tenantId_idx" ON "DataRightsRequest"("tenantId");

-- CreateIndex
CREATE INDEX "DataRightsRequest_residentId_idx" ON "DataRightsRequest"("residentId");

-- CreateIndex
CREATE INDEX "DataRightsRequest_staffUserId_idx" ON "DataRightsRequest"("staffUserId");

-- CreateIndex
CREATE INDEX "DataRightsRequest_status_idx" ON "DataRightsRequest"("status");

-- AddForeignKey
ALTER TABLE "DataRightsRequest" ADD CONSTRAINT "DataRightsRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRightsRequest" ADD CONSTRAINT "DataRightsRequest_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
