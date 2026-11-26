-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "AccessProduct" (
    "key" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "permissions" TEXT[],

    CONSTRAINT "AccessProduct_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AccessUser" (
    "id" UUID NOT NULL,
    "issuer" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "name" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "revokedBefore" TIMESTAMP(3),

    CONSTRAINT "AccessUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessTenant" (
    "productKey" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AccessTenant_pkey" PRIMARY KEY ("productKey","tenantId")
);

-- CreateTable
CREATE TABLE "AccessRole" (
    "productKey" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AccessRole_pkey" PRIMARY KEY ("productKey","tenantId","key")
);

-- CreateTable
CREATE TABLE "AccessMembership" (
    "productKey" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "revokedBefore" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AccessMembership_pkey" PRIMARY KEY ("productKey","tenantId","userId")
);

-- CreateTable
CREATE TABLE "AccessAudit" (
    "id" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productKey" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "changes" JSONB NOT NULL,

    CONSTRAINT "AccessAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessUser_issuer_subject_key" ON "AccessUser"("issuer", "subject");

-- CreateIndex
CREATE INDEX "AccessMembership_userId_idx" ON "AccessMembership"("userId");

-- CreateIndex
CREATE INDEX "AccessMembership_productKey_tenantId_roleKey_idx" ON "AccessMembership"("productKey", "tenantId", "roleKey");

-- CreateIndex
CREATE INDEX "AccessAudit_productKey_tenantId_occurredAt_idx" ON "AccessAudit"("productKey", "tenantId", "occurredAt");

-- AddForeignKey
ALTER TABLE "AccessTenant" ADD CONSTRAINT "AccessTenant_productKey_fkey" FOREIGN KEY ("productKey") REFERENCES "AccessProduct"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRole" ADD CONSTRAINT "AccessRole_productKey_tenantId_fkey" FOREIGN KEY ("productKey", "tenantId") REFERENCES "AccessTenant"("productKey", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessMembership" ADD CONSTRAINT "AccessMembership_productKey_tenantId_fkey" FOREIGN KEY ("productKey", "tenantId") REFERENCES "AccessTenant"("productKey", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessMembership" ADD CONSTRAINT "AccessMembership_productKey_tenantId_roleKey_fkey" FOREIGN KEY ("productKey", "tenantId", "roleKey") REFERENCES "AccessRole"("productKey", "tenantId", "key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessMembership" ADD CONSTRAINT "AccessMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AccessUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep administrative history append-only.
CREATE FUNCTION access_audit_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Access audit records are append-only' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER access_audit_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON "AccessAudit"
FOR EACH STATEMENT EXECUTE FUNCTION access_audit_reject_mutation();

