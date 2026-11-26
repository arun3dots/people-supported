BEGIN;

CREATE TYPE "UserAuthMode" AS ENUM ('Legacy', 'Cognito');
CREATE TYPE "CognitoOnboardingPhase" AS ENUM ('VerifyEmail', 'ProvisionIdentity', 'Invite', 'Invited', 'Activated');
CREATE TYPE "CognitoDeliveryState" AS ENUM ('NotSent', 'Sending', 'Sent', 'Failed');

ALTER TABLE "User"
  ADD COLUMN "authMode" "UserAuthMode" NOT NULL DEFAULT 'Legacy',
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD CONSTRAINT "User_auth_mode_password_check" CHECK (
    ("authMode" = 'Legacy' AND "passwordHash" IS NOT NULL)
    OR ("authMode" = 'Cognito' AND "passwordHash" IS NULL)
  );

CREATE TABLE "CognitoProvisioning" (
  "userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "requestId" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "poolId" TEXT NOT NULL,
  "providerUsername" TEXT,
  "accessRequested" BOOLEAN NOT NULL DEFAULT true,
  "phase" "CognitoOnboardingPhase" NOT NULL DEFAULT 'VerifyEmail',
  "verificationDelivery" "CognitoDeliveryState" NOT NULL DEFAULT 'NotSent',
  "invitationDelivery" "CognitoDeliveryState" NOT NULL DEFAULT 'NotSent',
  "verificationHash" TEXT UNIQUE,
  "verificationExpiresAt" TIMESTAMPTZ(3),
  "verifiedAt" TIMESTAMPTZ(3),
  "activatedAt" TIMESTAMPTZ(3),
  "lastActionAt" TIMESTAMPTZ(3),
  "lastError" TEXT
);

COMMIT;
