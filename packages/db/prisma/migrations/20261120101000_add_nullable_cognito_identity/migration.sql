BEGIN;

ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "cognitoSub" TEXT,
    ALTER COLUMN "passwordHash" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_cognitoSub_key" ON "User" ("cognitoSub");

COMMIT;
