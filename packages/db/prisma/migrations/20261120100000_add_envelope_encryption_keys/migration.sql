BEGIN;

-- Phase 1 development databases may already have this table from prisma db push.
CREATE TABLE IF NOT EXISTS "EncryptionKey" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "kmsKeyId" TEXT NOT NULL,
    "encryptedDek" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),

    CONSTRAINT "EncryptionKey_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EncryptionKey"
    ADD CONSTRAINT "EncryptionKey_version_check" CHECK ("version" > 0),
    ADD CONSTRAINT "EncryptionKey_purpose_check" CHECK ("purpose" IN ('DB_FIELD', 'AUDIT_HMAC')),
    ADD CONSTRAINT "EncryptionKey_status_check" CHECK ("status" IN ('Active', 'DecryptOnly', 'Retired'));

CREATE UNIQUE INDEX IF NOT EXISTS "EncryptionKey_purpose_version_key"
    ON "EncryptionKey" ("purpose", "version");
CREATE INDEX IF NOT EXISTS "EncryptionKey_purpose_status_idx"
    ON "EncryptionKey" ("purpose", "status");
CREATE UNIQUE INDEX "EncryptionKey_one_active_per_purpose"
    ON "EncryptionKey" ("purpose") WHERE "status" = 'Active';

COMMIT;
