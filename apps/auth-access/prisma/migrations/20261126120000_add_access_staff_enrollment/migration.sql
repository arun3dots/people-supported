CREATE TABLE "AccessStaffEnrollment" (
    "productKey" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "productUserId" UUID NOT NULL,
    "roleKey" TEXT NOT NULL,
    "requestedBy" UUID NOT NULL,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "AccessStaffEnrollment_pkey" PRIMARY KEY ("productKey", "tenantId", "productUserId"),
    CONSTRAINT "AccessStaffEnrollment_completion_check" CHECK (("subject" IS NULL) = ("completedAt" IS NULL))
);

CREATE UNIQUE INDEX "AccessStaffEnrollment_productKey_tenantId_subject_key"
ON "AccessStaffEnrollment"("productKey", "tenantId", "subject");

ALTER TABLE "AccessStaffEnrollment" ADD CONSTRAINT "AccessStaffEnrollment_productKey_tenantId_fkey"
FOREIGN KEY ("productKey", "tenantId") REFERENCES "AccessTenant"("productKey", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
